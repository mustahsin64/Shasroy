import { relations, sql } from "drizzle-orm";
import {
  boolean,
  check,
  index,
  integer,
  jsonb,
  pgEnum,
  pgSequence,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  type AnyPgColumn,
} from "drizzle-orm/pg-core";

// Money is always stored as integer paisa (1 taka = 100 paisa).
// Every table has RLS enabled with no policies: the Supabase Data API (anon /
// authenticated roles) cannot read or write anything. The app talks to the
// database only from the server through DATABASE_URL.

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
};

export const productStatus = pgEnum("product_status", ["draft", "active", "archived"]);
export const orderStatus = pgEnum("order_status", [
  "pending",
  "confirmed",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
]);
export const paymentMethod = pgEnum("payment_method", ["cod", "sslcommerz"]);
export const paymentStatus = pgEnum("payment_status", ["unpaid", "paid", "refunded", "failed"]);
export const inventoryReason = pgEnum("inventory_reason", [
  "initial",
  "restock",
  "order",
  "cancellation",
  "adjustment",
]);
export const adminRole = pgEnum("admin_role", ["owner", "manager", "staff"]);
export const adminAuditAction = pgEnum("admin_audit_action", [
  "delivery_zone_create",
  "delivery_zone_update",
  "admin_register",
  "admin_activate",
  "admin_deactivate",
  "admin_role_change",
]);

export const categories = pgTable(
  "categories",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    slug: text("slug").notNull().unique(),
    nameBn: text("name_bn").notNull(),
    descriptionBn: text("description_bn"),
    parentId: uuid("parent_id").references((): AnyPgColumn => categories.id, { onDelete: "restrict" }),
    sortOrder: integer("sort_order").notNull().default(0),
    isActive: boolean("is_active").notNull().default(true),
    ...timestamps,
  },
  (t) => [index("categories_parent_idx").on(t.parentId)],
).enableRLS();

export const products = pgTable(
  "products",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    slug: text("slug").notNull().unique(),
    nameBn: text("name_bn").notNull(),
    descriptionBn: text("description_bn"),
    categoryId: uuid("category_id")
      .notNull()
      .references(() => categories.id, { onDelete: "restrict" }),
    status: productStatus("status").notNull().default("draft"),
    isFeatured: boolean("is_featured").notNull().default(false),
    ...timestamps,
  },
  (t) => [index("products_category_status_idx").on(t.categoryId, t.status)],
).enableRLS();

export const productVariants = pgTable(
  "product_variants",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    sku: text("sku").notNull().unique(),
    nameBn: text("name_bn").notNull(),
    // Attribute pairs such as { "রং": "লাল", "মাপ": "ছোট" }.
    options: jsonb("options").$type<Record<string, string>>().notNull().default({}),
    pricePaisa: integer("price_paisa").notNull(),
    compareAtPricePaisa: integer("compare_at_price_paisa"),
    stockQuantity: integer("stock_quantity").notNull().default(0),
    isDefault: boolean("is_default").notNull().default(false),
    isActive: boolean("is_active").notNull().default(true),
    sortOrder: integer("sort_order").notNull().default(0),
    ...timestamps,
  },
  (t) => [
    index("product_variants_product_idx").on(t.productId),
    uniqueIndex("product_variants_one_default_idx").on(t.productId).where(sql`${t.isDefault}`),
    check("product_variants_price_positive", sql`${t.pricePaisa} > 0`),
    check(
      "product_variants_compare_at_gt_price",
      sql`${t.compareAtPricePaisa} is null or ${t.compareAtPricePaisa} > ${t.pricePaisa}`,
    ),
    check("product_variants_stock_non_negative", sql`${t.stockQuantity} >= 0`),
  ],
).enableRLS();

export const productImages = pgTable(
  "product_images",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    variantId: uuid("variant_id").references(() => productVariants.id, { onDelete: "set null" }),
    // Object path inside the Supabase Storage bucket.
    storagePath: text("storage_path").notNull(),
    altBn: text("alt_bn").notNull(),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamps.createdAt,
  },
  (t) => [index("product_images_product_idx").on(t.productId, t.sortOrder)],
).enableRLS();

export const deliveryZones = pgTable(
  "delivery_zones",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    slug: text("slug").notNull().unique(),
    nameBn: text("name_bn").notNull(),
    feePaisa: integer("fee_paisa").notNull(),
    minDays: integer("min_days").notNull(),
    maxDays: integer("max_days").notNull(),
    isActive: boolean("is_active").notNull().default(true),
    sortOrder: integer("sort_order").notNull().default(0),
    ...timestamps,
  },
  (t) => [
    check("delivery_zones_fee_non_negative", sql`${t.feePaisa} >= 0`),
    check("delivery_zones_days_range", sql`${t.minDays} >= 0 and ${t.maxDays} >= ${t.minDays}`),
  ],
).enableRLS();

export const adminUsers = pgTable(
  "admin_users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    // Linked to auth.users.id on first sign-in; email is the invitation key.
    authUserId: uuid("auth_user_id").unique(),
    email: text("email").notNull().unique(),
    displayName: text("display_name"),
    role: adminRole("role").notNull().default("staff"),
    isActive: boolean("is_active").notNull().default(true),
    ...timestamps,
  },
  (t) => [check("admin_users_email_lowercase", sql`${t.email} = lower(${t.email})`)],
).enableRLS();

export const orderNumberSeq = pgSequence("order_number_seq", { startWith: 1001 });

export const orders = pgTable(
  "orders",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orderNumber: text("order_number")
      .notNull()
      .unique()
      .default(sql`('SH-' || nextval('order_number_seq')::text)`),
    status: orderStatus("status").notNull().default("pending"),
    customerName: text("customer_name").notNull(),
    customerPhone: text("customer_phone").notNull(),
    customerEmail: text("customer_email"),
    shippingAddress: text("shipping_address").notNull(),
    deliveryZoneId: uuid("delivery_zone_id")
      .notNull()
      .references(() => deliveryZones.id, { onDelete: "restrict" }),
    // Snapshot so later zone edits do not rewrite order history.
    deliveryZoneNameBn: text("delivery_zone_name_bn").notNull(),
    customerNote: text("customer_note"),
    subtotalPaisa: integer("subtotal_paisa").notNull(),
    deliveryFeePaisa: integer("delivery_fee_paisa").notNull(),
    discountPaisa: integer("discount_paisa").notNull().default(0),
    totalPaisa: integer("total_paisa").notNull(),
    paymentMethod: paymentMethod("payment_method").notNull().default("cod"),
    paymentStatus: paymentStatus("payment_status").notNull().default("unpaid"),
    ...timestamps,
  },
  (t) => [
    index("orders_status_created_idx").on(t.status, t.createdAt),
    index("orders_customer_phone_idx").on(t.customerPhone),
    check(
      "orders_amounts_non_negative",
      sql`${t.subtotalPaisa} >= 0 and ${t.deliveryFeePaisa} >= 0 and ${t.discountPaisa} >= 0`,
    ),
    check(
      "orders_total_matches",
      sql`${t.totalPaisa} = ${t.subtotalPaisa} + ${t.deliveryFeePaisa} - ${t.discountPaisa} and ${t.totalPaisa} >= 0`,
    ),
  ],
).enableRLS();

export const orderItems = pgTable(
  "order_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orderId: uuid("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    variantId: uuid("variant_id").references(() => productVariants.id, { onDelete: "set null" }),
    // Snapshots of what the customer saw at checkout.
    productNameBn: text("product_name_bn").notNull(),
    variantNameBn: text("variant_name_bn").notNull(),
    sku: text("sku").notNull(),
    unitPricePaisa: integer("unit_price_paisa").notNull(),
    quantity: integer("quantity").notNull(),
    lineTotalPaisa: integer("line_total_paisa").notNull(),
    createdAt: timestamps.createdAt,
  },
  (t) => [
    index("order_items_order_idx").on(t.orderId),
    check("order_items_quantity_positive", sql`${t.quantity} > 0`),
    check("order_items_unit_price_positive", sql`${t.unitPricePaisa} > 0`),
    check("order_items_line_total_matches", sql`${t.lineTotalPaisa} = ${t.unitPricePaisa} * ${t.quantity}`),
  ],
).enableRLS();

export const orderStatusHistory = pgTable(
  "order_status_history",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orderId: uuid("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    fromStatus: orderStatus("from_status"),
    toStatus: orderStatus("to_status").notNull(),
    note: text("note"),
    changedBy: uuid("changed_by").references(() => adminUsers.id, { onDelete: "set null" }),
    createdAt: timestamps.createdAt,
  },
  (t) => [index("order_status_history_order_idx").on(t.orderId, t.createdAt)],
).enableRLS();

export const inventoryMovements = pgTable(
  "inventory_movements",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    variantId: uuid("variant_id")
      .notNull()
      .references(() => productVariants.id, { onDelete: "cascade" }),
    change: integer("change").notNull(),
    reason: inventoryReason("reason").notNull(),
    orderId: uuid("order_id").references(() => orders.id, { onDelete: "set null" }),
    note: text("note"),
    createdBy: uuid("created_by").references(() => adminUsers.id, { onDelete: "set null" }),
    createdAt: timestamps.createdAt,
  },
  (t) => [
    index("inventory_movements_variant_idx").on(t.variantId, t.createdAt),
    check("inventory_movements_change_non_zero", sql`${t.change} <> 0`),
  ],
).enableRLS();

// Guest carts. The browser keeps a random token in an httpOnly cookie; only its
// SHA-256 hash is stored, so a database leak cannot be used to hijack carts.
export const carts = pgTable(
  "carts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tokenHash: text("token_hash").notNull().unique(),
    ...timestamps,
  },
  (t) => [index("carts_updated_idx").on(t.updatedAt)],
).enableRLS();

export const cartItems = pgTable(
  "cart_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    cartId: uuid("cart_id")
      .notNull()
      .references(() => carts.id, { onDelete: "cascade" }),
    variantId: uuid("variant_id")
      .notNull()
      .references(() => productVariants.id, { onDelete: "cascade" }),
    quantity: integer("quantity").notNull(),
    ...timestamps,
  },
  (t) => [
    uniqueIndex("cart_items_cart_variant_idx").on(t.cartId, t.variantId),
    check("cart_items_quantity_range", sql`${t.quantity} between 1 and 99`),
  ],
).enableRLS();

// Append-only internal notes on orders. Never shown to customers or on print slips.
export const orderNotes = pgTable(
  "order_notes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orderId: uuid("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    body: text("body").notNull(),
    createdBy: uuid("created_by")
      .notNull()
      .references(() => adminUsers.id, { onDelete: "restrict" }),
    createdAt: timestamps.createdAt,
  },
  (t) => [
    index("order_notes_order_idx").on(t.orderId, t.createdAt, t.id),
    check("order_notes_body_length", sql`char_length(${t.body}) between 1 and 2000 and ${t.body} = btrim(${t.body})`),
  ],
).enableRLS();

// Written in the same transaction as the change it describes. before/after hold
// allowlisted fields only: never credentials, tokens or raw request payloads.
export const adminAuditEvents = pgTable(
  "admin_audit_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    actorId: uuid("actor_id")
      .notNull()
      .references(() => adminUsers.id, { onDelete: "restrict" }),
    action: adminAuditAction("action").notNull(),
    entityType: text("entity_type").notNull(),
    entityId: uuid("entity_id").notNull(),
    before: jsonb("before").$type<Record<string, unknown>>(),
    after: jsonb("after").$type<Record<string, unknown>>(),
    createdAt: timestamps.createdAt,
  },
  (t) => [index("admin_audit_entity_idx").on(t.entityType, t.entityId, t.createdAt)],
).enableRLS();

export const categoriesRelations = relations(categories, ({ one, many }) => ({
  parent: one(categories, { fields: [categories.parentId], references: [categories.id], relationName: "category_parent" }),
  children: many(categories, { relationName: "category_parent" }),
  products: many(products),
}));

export const productsRelations = relations(products, ({ one, many }) => ({
  category: one(categories, { fields: [products.categoryId], references: [categories.id] }),
  variants: many(productVariants),
  images: many(productImages),
}));

export const productVariantsRelations = relations(productVariants, ({ one, many }) => ({
  product: one(products, { fields: [productVariants.productId], references: [products.id] }),
  images: many(productImages),
  inventoryMovements: many(inventoryMovements),
}));

export const productImagesRelations = relations(productImages, ({ one }) => ({
  product: one(products, { fields: [productImages.productId], references: [products.id] }),
  variant: one(productVariants, { fields: [productImages.variantId], references: [productVariants.id] }),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  deliveryZone: one(deliveryZones, { fields: [orders.deliveryZoneId], references: [deliveryZones.id] }),
  items: many(orderItems),
  statusHistory: many(orderStatusHistory),
  notes: many(orderNotes),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, { fields: [orderItems.orderId], references: [orders.id] }),
  variant: one(productVariants, { fields: [orderItems.variantId], references: [productVariants.id] }),
}));

export const orderStatusHistoryRelations = relations(orderStatusHistory, ({ one }) => ({
  order: one(orders, { fields: [orderStatusHistory.orderId], references: [orders.id] }),
  changedByAdmin: one(adminUsers, { fields: [orderStatusHistory.changedBy], references: [adminUsers.id] }),
}));

export const inventoryMovementsRelations = relations(inventoryMovements, ({ one }) => ({
  variant: one(productVariants, { fields: [inventoryMovements.variantId], references: [productVariants.id] }),
  order: one(orders, { fields: [inventoryMovements.orderId], references: [orders.id] }),
  createdByAdmin: one(adminUsers, { fields: [inventoryMovements.createdBy], references: [adminUsers.id] }),
}));

export const orderNotesRelations = relations(orderNotes, ({ one }) => ({
  order: one(orders, { fields: [orderNotes.orderId], references: [orders.id] }),
  author: one(adminUsers, { fields: [orderNotes.createdBy], references: [adminUsers.id] }),
}));

export const cartsRelations = relations(carts, ({ many }) => ({
  items: many(cartItems),
}));

export const cartItemsRelations = relations(cartItems, ({ one }) => ({
  cart: one(carts, { fields: [cartItems.cartId], references: [carts.id] }),
  variant: one(productVariants, { fields: [cartItems.variantId], references: [productVariants.id] }),
}));
