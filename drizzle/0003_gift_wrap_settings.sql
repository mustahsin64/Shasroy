ALTER TYPE "public"."admin_audit_action" ADD VALUE 'gift_wrap_update';--> statement-breakpoint
CREATE TABLE "shop_settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"singleton" boolean DEFAULT true NOT NULL,
	"gift_wrap_enabled" boolean DEFAULT true NOT NULL,
	"gift_wrap_fee_paisa" integer DEFAULT 3000 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "shop_settings_singleton_unique" UNIQUE("singleton"),
	CONSTRAINT "shop_settings_singleton" CHECK ("shop_settings"."singleton"),
	CONSTRAINT "shop_settings_gift_fee_non_negative" CHECK ("shop_settings"."gift_wrap_fee_paisa" >= 0)
);
--> statement-breakpoint
ALTER TABLE "shop_settings" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "orders" DROP CONSTRAINT "orders_amounts_non_negative";--> statement-breakpoint
ALTER TABLE "orders" DROP CONSTRAINT "orders_total_matches";--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "gift_wrap" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "gift_wrap_fee_paisa" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "gift_message" text;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_gift_consistent" CHECK (("orders"."gift_wrap" or ("orders"."gift_wrap_fee_paisa" = 0 and "orders"."gift_message" is null)) and ("orders"."gift_message" is null or char_length("orders"."gift_message") between 1 and 200));--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_amounts_non_negative" CHECK ("orders"."subtotal_paisa" >= 0 and "orders"."delivery_fee_paisa" >= 0 and "orders"."discount_paisa" >= 0 and "orders"."gift_wrap_fee_paisa" >= 0);--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_total_matches" CHECK ("orders"."total_paisa" = "orders"."subtotal_paisa" + "orders"."delivery_fee_paisa" + "orders"."gift_wrap_fee_paisa" - "orders"."discount_paisa" and "orders"."total_paisa" >= 0);--> statement-breakpoint
-- The single settings row; gift wrap starts enabled at ৳30.
INSERT INTO "shop_settings" ("gift_wrap_enabled", "gift_wrap_fee_paisa") VALUES (true, 3000) ON CONFLICT ("singleton") DO NOTHING;