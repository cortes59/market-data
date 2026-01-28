CREATE EXTENSION IF NOT EXISTS "pgcrypto";
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "market_data" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"symbol" varchar(10) NOT NULL,
	"price" numeric(18, 8) NOT NULL,
	"volume" numeric(18, 8) NOT NULL,
	"timestamp" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "price_updates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"symbol" varchar(10) NOT NULL,
	"price" numeric(18, 8) NOT NULL,
	"change" numeric(18, 8) NOT NULL,
	"change_percent" numeric(10, 4) NOT NULL,
	"timestamp" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "stocks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"symbol" varchar(10) NOT NULL,
	"name" varchar(255) NOT NULL,
	"exchange" varchar(50) NOT NULL,
	"sector" varchar(100),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "stocks_symbol_unique" UNIQUE("symbol")
);
