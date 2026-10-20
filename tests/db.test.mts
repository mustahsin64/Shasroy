/**
 * Integration tests against a real PostgreSQL database (transactions, locks,
 * constraints). Run with `npm run test:db`.
 *
 * SETUP: point DATABASE_URL in .env.local at a DEVELOPMENT database only.
 * The tests create rows tagged "ZZTEST" (admins, zone, category, product, orders)
 * and remove them afterwards. They refuse to run unless RUN_DB_TESTS=1 (set by the
 * npm script) and refuse when the database already holds orders that are not
 * test orders, so they cannot be pointed at a live shop by accident
 * (override only on purpose with ALLOW_DB_TESTS_WITH_ORDERS=1).
 */
import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import nextEnv from "@next/env";

nextEnv.loadEnvConfig(process.cwd());
if (process.env.RUN_DB_TESTS !== "1") throw new Error("Use `npm run test:db` (sets RUN_DB_TESTS=1).");

const { and, eq, inArray, like, sql } = await import("drizzle-orm");
const { db, schema } = await import("@/db");
const O = await import("@/lib/admin/orders");
const N = await import("@/lib/admin/order-notes");
const D = await import("@/lib/admin/delivery");
const I = await import("@/lib/admin/inventory");
const U = await import("@/lib/admin/users");
const { placeOrder, getOrderConfirmation } = await import("@/lib/checkout");

const TAG = `ZZTEST${Date.now()}`;
const PRICE = 10000; // paisa
const STOCK = 100;

const realOrders = await db.select({ n: sql<number>`count(*)::int` }).from(schema.orders).where(sql`${schema.orders.customerName} not like 'ZZTEST%'`);
if (realOrders[0].n > 0 && process.env.ALLOW_DB_TESTS_WITH_ORDERS !== "1") {
  throw new Error(`Refusing to run: the database holds ${realOrders[0].n} non-test order(s). Use a development database.`);
}

const ctx = {} as {
  owner: typeof schema.adminUsers.$inferSelect; // an existing real owner, never modified
  staff: typeof schema.adminUsers.$inferSelect;
  manager: typeof schema.adminUsers.$inferSelect;
  zone: typeof schema.deliveryZones.$inferSelect;
  variantId: string;
  productId: string;
  categoryId: string;
};
const createdAdminIds: string[] = [];

async function makeAdmin(label: string, role: "owner" | "manager" | "staff") {
  const [row] = await db.insert(schema.adminUsers).values({ email: `${TAG.toLowerCase()}-${label}@example.invalid`, displayName: `${TAG} ${label}`, role }).returning();
  createdAdminIds.push(row.id);
  return row;
}

async function order(name: string, qty = 1, opts: { phone?: string; zoneId?: string; fee?: number } = {}) {
  const [cart] = await db.insert(schema.carts).values({ tokenHash: `${TAG}-${Math.random()}` }).returning();
  await db.insert(schema.cartItems).values({ cartId: cart.id, variantId: ctx.variantId, quantity: qty });
  const zoneId = opts.zoneId ?? ctx.zone.id;
  const result = await placeOrder(cart.id, {
    customerName: `ZZTEST ${name}`,
    customerPhone: opts.phone ?? "01711112222",
    customerEmail: null,
    deliveryZoneId: zoneId,
    shippingAddress: "House 1, Road 2, Test Area, Dhaka",
    customerNote: null,
    expectedFeePaisa: opts.fee ?? (await db.select().from(schema.deliveryZones).where(eq(schema.deliveryZones.id, zoneId)))[0].feePaisa,
  });
  return result;
}
const stock = async () => (await db.select({ s: schema.productVariants.stockQuantity }).from(schema.productVariants).where(eq(schema.productVariants.id, ctx.variantId)))[0].s;

before(async () => {
  const [owner] = await db.select().from(schema.adminUsers).where(and(eq(schema.adminUsers.role, "owner"), eq(schema.adminUsers.isActive, true))).limit(1);
  assert.ok(owner, "database needs one active owner (run the seed with ADMIN_SEED_EMAIL)");
  ctx.owner = owner;
  ctx.staff = await makeAdmin("staff", "staff");
  ctx.manager = await makeAdmin("manager", "manager");
  const [category] = await db.insert(schema.categories).values({ slug: TAG.toLowerCase(), nameBn: `${TAG} বিভাগ` }).returning();
  ctx.categoryId = category.id;
  const [product] = await db.insert(schema.products).values({ slug: TAG.toLowerCase(), nameBn: `${TAG} পণ্য`, categoryId: category.id, status: "active" }).returning();
  ctx.productId = product.id;
  const [variant] = await db.insert(schema.productVariants).values({ productId: product.id, sku: `${TAG}-A`, nameBn: "সাধারণ", pricePaisa: PRICE, stockQuantity: STOCK, isDefault: true }).returning();
  ctx.variantId = variant.id;
  await db.insert(schema.inventoryMovements).values({ variantId: variant.id, change: STOCK, reason: "initial", createdBy: ctx.manager.id });
  const [zone] = await db.insert(schema.deliveryZones).values({ slug: TAG.toLowerCase(), nameBn: `${TAG} এলাকা`, feePaisa: 6000, minDays: 1, maxDays: 2 }).returning();
  ctx.zone = zone;
});

after(async () => {
  const testOrderIds = (await db.select({ id: schema.orders.id }).from(schema.orders).where(like(schema.orders.customerName, "ZZTEST%"))).map(r => r.id);
  if (testOrderIds.length) {
    await db.delete(schema.inventoryMovements).where(inArray(schema.inventoryMovements.orderId, testOrderIds));
    await db.delete(schema.orders).where(inArray(schema.orders.id, testOrderIds));
  }
  if (createdAdminIds.length) await db.delete(schema.adminAuditEvents).where(inArray(schema.adminAuditEvents.actorId, createdAdminIds));
  // Audit rows written by the real owner about test entities.
  await db.delete(schema.adminAuditEvents).where(sql`${schema.adminAuditEvents.entityId} = ${ctx.zone?.id ?? null} or ${schema.adminAuditEvents.entityId} in (select id from admin_users where email like ${`${TAG.toLowerCase()}%`})`);
  await db.delete(schema.carts).where(like(schema.carts.tokenHash, `${TAG}%`));
  await db.delete(schema.products).where(eq(schema.products.id, ctx.productId));
  await db.delete(schema.categories).where(eq(schema.categories.id, ctx.categoryId));
  await db.delete(schema.deliveryZones).where(like(schema.deliveryZones.slug, `${TAG.toLowerCase()}%`));
  if (createdAdminIds.length) await db.delete(schema.adminUsers).where(inArray(schema.adminUsers.id, createdAdminIds));
  process.exit(0);
});

describe("regression: COD order lifecycle and stock", () => {
  it("places an order, deducts stock, cancels once and restores exactly", async () => {
    const before = await stock();
    const placed = await order("Regression", 3);
    assert.ok(placed.ok);
    if (!placed.ok) return;
    assert.equal(await stock(), before - 3);
    assert.equal((await O.changeOrderStatus(placed.orderId, "delivered", ctx.staff.id, null)).ok, false, "pending -> delivered must be rejected");
    assert.equal((await O.changeOrderStatus(placed.orderId, "confirmed", ctx.staff.id, "phone ok")).ok, true);
    assert.equal((await O.changeOrderStatus(placed.orderId, "cancelled", ctx.staff.id, null)).ok, true);
    assert.equal(await stock(), before, "cancel restores exactly the ordered quantity");
    assert.equal((await O.changeOrderStatus(placed.orderId, "cancelled", ctx.staff.id, null)).ok, false, "cancelled is final: no second restore");
    assert.equal(await stock(), before);
    const full = await O.getOrderForAdmin(placed.orderId);
    assert.deepEqual(full!.statusHistory.map(h => h.toStatus).reverse(), ["pending", "confirmed", "cancelled"]);
  });
  it("rejects an order that exceeds stock without touching it", async () => {
    const original = await stock();
    await db.update(schema.productVariants).set({ stockQuantity: 2 }).where(eq(schema.productVariants.id, ctx.variantId));
    try {
      const result = await order("TooMany", 5);
      assert.equal(result.ok, false);
      assert.equal(await stock(), 2);
    } finally {
      await db.update(schema.productVariants).set({ stockQuantity: original }).where(eq(schema.productVariants.id, ctx.variantId));
    }
  });
});

describe("7.1 internal order notes", () => {
  it("appends notes with author and time, newest first, and stays out of customer and print projections", async () => {
    const placed = await order("Notes");
    assert.ok(placed.ok);
    if (!placed.ok) return;
    assert.deepEqual(await N.addOrderNote(placed.orderId, ctx.staff.id, "first"), { ok: true });
    await N.addOrderNote(placed.orderId, ctx.manager.id, "second\nline");
    const list = await N.listOrderNotes(placed.orderId);
    assert.deepEqual(list.rows.map(r => r.body), ["second\nline", "first"]);
    assert.equal(list.rows[0].author.email, ctx.manager.email);
    const confirmation = await getOrderConfirmation(placed.orderId);
    const print = await O.getOrderForPrint(placed.orderId);
    for (const view of [confirmation, print]) {
      assert.ok(view);
      assert.equal("notes" in view!, false);
      assert.equal("statusHistory" in view!, false);
      assert.equal(JSON.stringify(view).includes("second"), false);
    }
  });
  it("rejects notes on unknown orders and malformed bodies at the database too", async () => {
    assert.equal((await N.addOrderNote("00000000-0000-4000-8000-000000000000", ctx.staff.id, "x")).ok, false);
    const placed = await order("NotesConstraint");
    assert.ok(placed.ok);
    if (!placed.ok) return;
    await assert.rejects(db.insert(schema.orderNotes).values({ orderId: placed.orderId, body: " padded ", createdBy: ctx.staff.id }));
    await assert.rejects(db.insert(schema.orderNotes).values({ orderId: placed.orderId, body: "x".repeat(2001), createdBy: ctx.staff.id }));
    await assert.rejects(db.insert(schema.orderNotes).values({ orderId: placed.orderId, body: "", createdBy: ctx.staff.id }));
  });
});

describe("7.2 order search", () => {
  const ids: Record<string, string> = {};
  before(async () => {
    for (const [key, name, phone] of [["a", "Alpha 100%_x", "01755550001"], ["b", "Beta", "01755550002"], ["c", "Gamma", "01866660003"]] as const) {
      const placed = await order(name, 1, { phone });
      assert.ok(placed.ok);
      if (placed.ok) ids[key] = placed.orderId;
    }
    await O.changeOrderStatus(ids.b, "confirmed", ctx.staff.id, null);
  });
  const find = async (query: string, status?: "pending" | "confirmed") => (await O.listOrders({ status, query })).rows.map(r => r.id);

  it("matches name, order number and phone in any accepted spelling", async () => {
    assert.deepEqual(await find("zztest beta"), [ids.b]);
    const number = (await O.getOrderForAdmin(ids.c))!.orderNumber;
    assert.deepEqual(await find(number), [ids.c]);
    assert.deepEqual(await find("+8801866660003"), [ids.c]);
    assert.deepEqual(await find("০১৮৬৬৬৬০০০৩"), [ids.c]);
    assert.equal((await find("0175555")).length, 2, "partial phone");
  });
  it("treats % and _ literally", async () => {
    assert.deepEqual(await find("100%_x"), [ids.a]);
    assert.deepEqual(await find("%"), [ids.a], "a bare % must not match everything");
    assert.deepEqual(await find("_"), [ids.a]);
  });
  it("combines with status and returns the same total as rows", async () => {
    assert.deepEqual(await find("01755550", "confirmed"), [ids.b]);
    const result = await O.listOrders({ query: "ZZTEST", status: "pending" });
    assert.equal(result.total >= result.rows.length, true);
    assert.deepEqual(await find("no-such-order-xyz"), []);
  });
});

describe("7.3 print projection", () => {
  it("contains only slip fields", async () => {
    const placed = await order("Print");
    assert.ok(placed.ok);
    if (!placed.ok) return;
    const slip = await O.getOrderForPrint(placed.orderId);
    assert.ok(slip);
    assert.equal(slip!.items.length, 1);
    assert.equal(O.collectionState(slip!).kind, "collect");
    assert.equal(Object.keys(slip!).some(k => ["notes", "statusHistory", "id", "customerEmail"].includes(k)), false);
  });
});

describe("7.4 delivery settings", () => {
  it("rejects a stale edit, applies a fresh one and writes an audit record", async () => {
    const [row] = await db.select().from(schema.deliveryZones).where(eq(schema.deliveryZones.id, ctx.zone.id));
    const fields = { nameBn: row.nameBn, feePaisa: 9000, minDays: 1, maxDays: 3, sortOrder: 0, isActive: true };
    const stale = await D.updateDeliveryZone(row.id, fields, row.updatedAt.getTime() - 5000, ctx.manager.id);
    assert.equal(stale.ok, false);
    assert.equal((await db.select().from(schema.deliveryZones).where(eq(schema.deliveryZones.id, row.id)))[0].feePaisa, 6000, "stale edit changed nothing");
    assert.deepEqual(await D.updateDeliveryZone(row.id, fields, row.updatedAt.getTime(), ctx.manager.id), { ok: true });
    const [audit] = await db.select().from(schema.adminAuditEvents).where(and(eq(schema.adminAuditEvents.entityId, row.id), eq(schema.adminAuditEvents.action, "delivery_zone_update")));
    assert.equal((audit.before as { feePaisa: number }).feePaisa, 6000);
    assert.equal((audit.after as { feePaisa: number }).feePaisa, 9000);
    assert.equal(audit.actorId, ctx.manager.id);
    const keys = Object.keys(audit.after as object).sort();
    assert.deepEqual(keys, ["feePaisa", "isActive", "maxDays", "minDays", "nameBn", "sortOrder"], "audit holds allowlisted fields only");
  });
  it("makes the customer review a changed fee, then charges the new fee; old orders keep theirs", async () => {
    const [zone] = await db.select().from(schema.deliveryZones).where(eq(schema.deliveryZones.id, ctx.zone.id));
    const oldOrder = await order("OldFee", 1, { fee: zone.feePaisa });
    assert.ok(oldOrder.ok);
    const stale = await order("StaleFee", 1, { fee: zone.feePaisa - 1000 });
    assert.deepEqual(stale.ok ? null : stale.error, "fee-changed");
    const fresh = await order("FreshFee", 1, { fee: zone.feePaisa });
    assert.ok(fresh.ok);
    // Change the fee: the earlier order must not move.
    const [current] = await db.select().from(schema.deliveryZones).where(eq(schema.deliveryZones.id, ctx.zone.id));
    await D.updateDeliveryZone(current.id, { nameBn: "নতুন নাম", feePaisa: 15000, minDays: 1, maxDays: 3, sortOrder: 0, isActive: true }, current.updatedAt.getTime(), ctx.manager.id);
    if (oldOrder.ok) {
      const snapshot = await O.getOrderForAdmin(oldOrder.orderId);
      assert.equal(snapshot!.deliveryFeePaisa, zone.feePaisa);
      assert.equal(snapshot!.deliveryZoneNameBn.includes("নতুন নাম"), false);
      assert.equal(snapshot!.totalPaisa, PRICE + zone.feePaisa);
    }
    const afterChange = await order("NewFee", 1);
    assert.ok(afterChange.ok);
    if (afterChange.ok) assert.equal((await O.getOrderForAdmin(afterChange.orderId))!.deliveryFeePaisa, 15000);
  });
  it("rejects an inactive zone and rolls back", async () => {
    const [current] = await db.select().from(schema.deliveryZones).where(eq(schema.deliveryZones.id, ctx.zone.id));
    await D.updateDeliveryZone(current.id, { nameBn: current.nameBn, feePaisa: current.feePaisa, minDays: 1, maxDays: 3, sortOrder: 0, isActive: false }, current.updatedAt.getTime(), ctx.manager.id);
    const before = await stock();
    const result = await order("Inactive", 1, { fee: current.feePaisa });
    assert.deepEqual(result.ok ? null : result.error, "zone-unavailable");
    assert.equal(await stock(), before);
    const [again] = await db.select().from(schema.deliveryZones).where(eq(schema.deliveryZones.id, ctx.zone.id));
    await D.updateDeliveryZone(again.id, { nameBn: again.nameBn, feePaisa: again.feePaisa, minDays: 1, maxDays: 3, sortOrder: 0, isActive: true }, again.updatedAt.getTime(), ctx.manager.id);
  });
  it("create: rejects duplicate slugs cleanly", async () => {
    const result = await D.createDeliveryZone({ slug: ctx.zone.slug, nameBn: "x", feePaisa: 0, minDays: 0, maxDays: 1, sortOrder: 0, isActive: true }, ctx.manager.id);
    assert.equal(result.ok, false);
  });
});

describe("7.5 variant stock history", () => {
  it("shows ledger rows, checks product membership and never writes on read", async () => {
    const countMoves = async () => (await db.select({ n: sql<number>`count(*)::int` }).from(schema.inventoryMovements).where(eq(schema.inventoryMovements.variantId, ctx.variantId)))[0].n;
    const placed = await order("History", 2);
    assert.ok(placed.ok);
    if (!placed.ok) return;
    await O.changeOrderStatus(placed.orderId, "cancelled", ctx.staff.id, null);
    const P = await import("@/lib/admin/products");
    await P.setVariantStock(ctx.variantId, (await stock()) + 4, "restock", ctx.manager.id);
    await P.setVariantStock(ctx.variantId, (await stock()) - 1, "damaged", ctx.manager.id);

    const before = await countMoves();
    const all = await I.getVariantHistory(ctx.productId, ctx.variantId, undefined, 1);
    assert.ok(all);
    const reasons = new Set(all!.rows.map(r => r.reason));
    for (const r of ["initial", "order", "cancellation", "restock", "adjustment"]) assert.ok(reasons.has(r as never), r);
    assert.equal(all!.variant.stockQuantity, await stock());
    const onlyOrders = await I.getVariantHistory(ctx.productId, ctx.variantId, "order", 1);
    assert.ok(onlyOrders!.rows.every(r => r.reason === "order" && r.change < 0));
    assert.equal(await countMoves(), before, "reading history writes nothing");
    const [otherProduct] = await db.select({ id: schema.products.id }).from(schema.products).where(sql`${schema.products.id} <> ${ctx.productId}`).limit(1);
    assert.equal(await I.getVariantHistory(otherProduct.id, ctx.variantId, undefined, 1), null, "variant must belong to the product");
  });
});

describe("7.6 owner-only admin management", () => {
  it("denies non-owner actors in the service itself", async () => {
    for (const actor of [ctx.staff, ctx.manager]) {
      const r = await U.registerAdmin({ email: `${TAG.toLowerCase()}-x@example.invalid`, displayName: null, role: "staff" }, actor.id);
      assert.equal(r.ok, false);
    }
    const r = await U.setAdminActive(ctx.staff.id, false, { role: "staff", isActive: true }, ctx.manager.id);
    assert.equal(r.ok, false);
  });
  it("registers (lowercase), rejects duplicates, audits, changes roles and activity", async () => {
    const email = `${TAG.toLowerCase()}-new@example.invalid`;
    assert.deepEqual(await U.registerAdmin({ email, displayName: "New", role: "staff" }, ctx.owner.id), { ok: true });
    const [created] = await db.select().from(schema.adminUsers).where(eq(schema.adminUsers.email, email));
    createdAdminIds.push(created.id);
    assert.equal(created.authUserId, null, "registered but not yet linked");
    assert.equal((await U.registerAdmin({ email, displayName: null, role: "manager" }, ctx.owner.id)).ok, false, "duplicate email");

    assert.deepEqual(await U.setAdminRole(created.id, "manager", { role: "staff", isActive: true }, ctx.owner.id), { ok: true });
    assert.equal((await U.setAdminRole(created.id, "staff", { role: "staff", isActive: true }, ctx.owner.id)).ok, false, "stale form (role already changed)");
    assert.deepEqual(await U.setAdminActive(created.id, false, { role: "manager", isActive: true }, ctx.owner.id), { ok: true });
    assert.equal((await db.select().from(schema.adminUsers).where(eq(schema.adminUsers.id, created.id)))[0].isActive, false);
    assert.deepEqual(await U.setAdminActive(created.id, true, { role: "manager", isActive: false }, ctx.owner.id), { ok: true });

    const actions = (await db.select().from(schema.adminAuditEvents).where(eq(schema.adminAuditEvents.entityId, created.id))).map(a => a.action).sort();
    assert.deepEqual(actions, ["admin_activate", "admin_deactivate", "admin_register", "admin_role_change"]);
  });
  it("blocks self-deactivation, self-demotion and owner role changes", async () => {
    const t = await makeAdmin("owner-b", "owner");
    assert.equal((await U.setAdminActive(t.id, false, { role: "owner", isActive: true }, t.id)).ok, false, "self-deactivation");
    assert.equal((await U.setAdminRole(t.id, "staff", { role: "owner", isActive: true }, t.id)).ok, false, "self-demotion");
    assert.equal((await U.setAdminRole(t.id, "staff", { role: "owner", isActive: true }, ctx.owner.id)).ok, false, "owner role is not editable here");
    assert.equal((await db.select().from(schema.adminUsers).where(eq(schema.adminUsers.id, t.id)))[0].role, "owner");
  });
  it("two owners deactivating each other concurrently: exactly one wins, never both", async () => {
    const a = await makeAdmin("race-a", "owner");
    const b = await makeAdmin("race-b", "owner");
    const results = await Promise.all([
      U.setAdminActive(b.id, false, { role: "owner", isActive: true }, a.id),
      U.setAdminActive(a.id, false, { role: "owner", isActive: true }, b.id),
    ]);
    assert.equal(results.filter(r => r.ok).length, 1, JSON.stringify(results));
    const rows = await db.select().from(schema.adminUsers).where(inArray(schema.adminUsers.id, [a.id, b.id]));
    assert.equal(rows.filter(r => r.isActive).length, 1);
  });
});
