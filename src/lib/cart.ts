import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { and, asc, eq, sql } from "drizzle-orm";
import { cookies } from "next/headers";
import { db, schema } from "@/db";

const { carts, cartItems, productVariants, products, productImages } = schema;

const CART_COOKIE = "shasroy_cart";
const CART_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;
export const MAX_QUANTITY_PER_LINE = 10;

const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");

export async function findCartId(): Promise<string | null> {
  const token = (await cookies()).get(CART_COOKIE)?.value;
  if (!token || token.length > 100) return null;
  const cart = await db.query.carts.findFirst({ where: eq(carts.tokenHash, hashToken(token)), columns: { id: true } });
  return cart?.id ?? null;
}

/** Only callable from Server Actions: may set the cart cookie. */
async function findOrCreateCartId(): Promise<string> {
  const existing = await findCartId();
  const store = await cookies();
  if (existing) {
    // Slide the expiry forward on activity.
    store.set(CART_COOKIE, store.get(CART_COOKIE)!.value, cookieOptions());
    return existing;
  }
  const token = randomBytes(32).toString("base64url");
  const [cart] = await db.insert(carts).values({ tokenHash: hashToken(token) }).returning({ id: carts.id });
  store.set(CART_COOKIE, token, cookieOptions());
  return cart.id;
}

function cookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: CART_MAX_AGE_SECONDS,
  };
}

export type CartLine = Awaited<ReturnType<typeof getCart>>["lines"][number];

/**
 * Current cart with live prices and stock. Prices are never stored in the cart,
 * so the customer always sees (and will be charged) the current price.
 */
export async function getCart() {
  const cartId = await findCartId();
  if (!cartId) return { lines: [], subtotalPaisa: 0, itemCount: 0, hasIssues: false };

  const imagePath = sql<string | null>`(
    select ${productImages.storagePath} from ${productImages}
    where ${productImages.productId} = ${products.id}
    order by (${productImages.variantId} = ${productVariants.id}) desc nulls last, ${productImages.sortOrder}
    limit 1
  )`;

  const rows = await db
    .select({
      id: cartItems.id,
      variantId: productVariants.id,
      quantity: cartItems.quantity,
      sku: productVariants.sku,
      variantNameBn: productVariants.nameBn,
      pricePaisa: productVariants.pricePaisa,
      stockQuantity: productVariants.stockQuantity,
      variantActive: productVariants.isActive,
      productSlug: products.slug,
      productNameBn: products.nameBn,
      productStatus: products.status,
      variantCount: sql<number>`(select count(*) from ${productVariants} pv where pv.product_id = ${products.id} and pv.is_active)`.mapWith(Number),
      imagePath,
    })
    .from(cartItems)
    .innerJoin(productVariants, eq(productVariants.id, cartItems.variantId))
    .innerJoin(products, eq(products.id, productVariants.productId))
    .where(eq(cartItems.cartId, cartId))
    .orderBy(asc(cartItems.createdAt));

  const lines = rows.map(row => {
    const available = row.productStatus === "active" && row.variantActive && row.stockQuantity > 0;
    const issue = !available
      ? ("unavailable" as const)
      : row.quantity > row.stockQuantity
        ? ("insufficient" as const)
        : null;
    return { ...row, available, issue, lineTotalPaisa: row.pricePaisa * row.quantity };
  });

  const payable = lines.filter(line => line.available);
  return {
    lines,
    subtotalPaisa: payable.reduce((sum, line) => sum + line.lineTotalPaisa, 0),
    itemCount: lines.reduce((sum, line) => sum + line.quantity, 0),
    hasIssues: lines.some(line => line.issue),
  };
}

export async function getCartCount() {
  const cartId = await findCartId();
  if (!cartId) return 0;
  const [row] = await db
    .select({ count: sql<number>`coalesce(sum(${cartItems.quantity}), 0)`.mapWith(Number) })
    .from(cartItems)
    .where(eq(cartItems.cartId, cartId));
  return row?.count ?? 0;
}

export type CartResult = { ok: true; quantity: number; clamped: boolean } | { ok: false; error: "unavailable" | "out-of-stock" | "not-found" };

export async function addToCart(variantId: string, quantity: number): Promise<CartResult> {
  const variant = await db
    .select({ stock: productVariants.stockQuantity })
    .from(productVariants)
    .innerJoin(products, eq(products.id, productVariants.productId))
    .where(and(eq(productVariants.id, variantId), eq(productVariants.isActive, true), eq(products.status, "active")))
    .then(rows => rows[0]);
  if (!variant) return { ok: false, error: "unavailable" };
  if (variant.stock <= 0) return { ok: false, error: "out-of-stock" };

  const cartId = await findOrCreateCartId();
  const limit = Math.min(variant.stock, MAX_QUANTITY_PER_LINE);
  const existing = await db
    .select({ quantity: cartItems.quantity })
    .from(cartItems)
    .where(and(eq(cartItems.cartId, cartId), eq(cartItems.variantId, variantId)))
    .then(rows => rows[0]?.quantity ?? 0);
  // Insert or add to the existing line in one statement, capped by stock and the per-line limit.
  const [line] = await db
    .insert(cartItems)
    .values({ cartId, variantId, quantity: Math.min(quantity, limit) })
    .onConflictDoUpdate({
      target: [cartItems.cartId, cartItems.variantId],
      set: { quantity: sql`least(${cartItems.quantity} + ${quantity}, ${limit})`, updatedAt: new Date() },
    })
    .returning({ quantity: cartItems.quantity });
  await touchCart(cartId);
  return { ok: true, quantity: line.quantity, clamped: line.quantity < existing + quantity };
}

export async function setCartItemQuantity(itemId: string, quantity: number): Promise<CartResult> {
  const cartId = await findCartId();
  if (!cartId) return { ok: false, error: "not-found" };
  if (quantity <= 0) {
    await db.delete(cartItems).where(and(eq(cartItems.id, itemId), eq(cartItems.cartId, cartId)));
    return { ok: true, quantity: 0, clamped: false };
  }
  const item = await db
    .select({ stock: productVariants.stockQuantity })
    .from(cartItems)
    .innerJoin(productVariants, eq(productVariants.id, cartItems.variantId))
    .where(and(eq(cartItems.id, itemId), eq(cartItems.cartId, cartId)))
    .then(rows => rows[0]);
  if (!item) return { ok: false, error: "not-found" };
  if (item.stock <= 0) return { ok: false, error: "out-of-stock" };
  const next = Math.min(quantity, item.stock, MAX_QUANTITY_PER_LINE);
  await db.update(cartItems).set({ quantity: next }).where(and(eq(cartItems.id, itemId), eq(cartItems.cartId, cartId)));
  await touchCart(cartId);
  return { ok: true, quantity: next, clamped: next < quantity };
}

export async function removeCartItem(itemId: string) {
  const cartId = await findCartId();
  if (!cartId) return;
  await db.delete(cartItems).where(and(eq(cartItems.id, itemId), eq(cartItems.cartId, cartId)));
}

async function touchCart(cartId: string) {
  await db.update(carts).set({ updatedAt: new Date() }).where(eq(carts.id, cartId));
}

/** Only callable from Server Actions: drops the cart cookie after checkout. */
export async function forgetCartCookie() {
  (await cookies()).delete(CART_COOKIE);
}
