-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "phone" TEXT,
    "address" TEXT,
    "license_number" TEXT,
    "role" TEXT NOT NULL DEFAULT 'CUSTOMER',
    "customer_tier" TEXT NOT NULL DEFAULT 'BRONZE',
    "total_spent" DECIMAL NOT NULL DEFAULT 0,
    "loyalty_points" INTEGER NOT NULL DEFAULT 0,
    "registration_source" TEXT,
    "last_login_at" DATETIME,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "admin_users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "permissions" TEXT NOT NULL DEFAULT '{}',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "vehicle_locations" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "postcode" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "vehicles" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "make" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "category_id" TEXT,
    "subcategory_id" TEXT,
    "type" TEXT NOT NULL DEFAULT 'rental',
    "daily_rate" DECIMAL,
    "sale_price" DECIMAL,
    "description" TEXT,
    "features" TEXT NOT NULL DEFAULT '[]',
    "images" TEXT NOT NULL DEFAULT '[]',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "color" TEXT,
    "mileage" INTEGER,
    "fuel_type" TEXT,
    "transmission" TEXT,
    "seats" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'AVAILABLE',
    "location_id" TEXT,
    "registration" TEXT,
    "insurance_excess" DECIMAL,
    "deposit" DECIMAL,
    "purchase_cost" DECIMAL,
    "total_rental_revenue" DECIMAL NOT NULL DEFAULT 0,
    "total_rental_days" INTEGER NOT NULL DEFAULT 0,
    "popularity_score" DECIMAL NOT NULL DEFAULT 0,
    "maintenance_cost" DECIMAL NOT NULL DEFAULT 0,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "vehicles_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "vehicles_subcategory_id_fkey" FOREIGN KEY ("subcategory_id") REFERENCES "subcategories" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "vehicles_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "vehicle_locations" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "categories" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT DEFAULT 'Car',
    "color" TEXT DEFAULT 'blue',
    "type" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "subcategories" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "category_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "subcategories_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "vehicle_categories" (
    "vehicle_id" TEXT NOT NULL,
    "category_id" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY ("vehicle_id", "category_id"),
    CONSTRAINT "vehicle_categories_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "vehicles" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "vehicle_categories_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "rentals" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "vehicle_id" TEXT NOT NULL,
    "start_date" DATETIME NOT NULL,
    "end_date" DATETIME NOT NULL,
    "total_price" DECIMAL NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "payment_status" TEXT NOT NULL DEFAULT 'PENDING',
    "payment_method" TEXT,
    "contract_signed" BOOLEAN NOT NULL DEFAULT false,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "rentals_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "rentals_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "vehicles" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "sales" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "vehicle_id" TEXT NOT NULL,
    "sale_price" DECIMAL NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "payment_status" TEXT NOT NULL DEFAULT 'PENDING',
    "payment_method" TEXT,
    "contract_signed" BOOLEAN NOT NULL DEFAULT false,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "sales_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "sales_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "vehicles" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "rental_pricing" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "vehicle_id" TEXT NOT NULL,
    "price_per_day" DECIMAL NOT NULL,
    "price_per_week" DECIMAL NOT NULL,
    "price_per_month" DECIMAL NOT NULL,
    "valid_from" DATETIME NOT NULL,
    "valid_to" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "rental_pricing_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "vehicles" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "sale_pricing" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "vehicle_id" TEXT NOT NULL,
    "sale_price" DECIMAL NOT NULL,
    "valid_from" DATETIME NOT NULL,
    "valid_to" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "sale_pricing_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "vehicles" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "payment_methods" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "gateway_provider" TEXT NOT NULL,
    "gateway_payment_method_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "card_brand" TEXT,
    "card_last_four" TEXT,
    "card_exp_month" INTEGER,
    "card_exp_year" INTEGER,
    "bank_name" TEXT,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "metadata" TEXT NOT NULL DEFAULT '{}',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "payment_methods_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "transactions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "transaction_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "rental_id" TEXT,
    "sale_id" TEXT,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "amount" DECIMAL NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'AUD',
    "gateway_provider" TEXT NOT NULL,
    "gateway_transaction_id" TEXT,
    "gateway_payment_intent_id" TEXT,
    "gateway_charge_id" TEXT,
    "payment_method_type" TEXT,
    "payment_method_id" TEXT,
    "card_last_four" TEXT,
    "card_brand" TEXT,
    "card_exp_month" INTEGER,
    "card_exp_year" INTEGER,
    "subtotal" DECIMAL NOT NULL,
    "tax_amount" DECIMAL NOT NULL DEFAULT 0,
    "processing_fee" DECIMAL NOT NULL DEFAULT 0,
    "total_amount" DECIMAL NOT NULL,
    "gateway_response" TEXT,
    "gateway_metadata" TEXT,
    "failure_reason" TEXT,
    "failure_code" TEXT,
    "processed_at" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "transactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "transactions_rental_id_fkey" FOREIGN KEY ("rental_id") REFERENCES "rentals" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "transactions_sale_id_fkey" FOREIGN KEY ("sale_id") REFERENCES "sales" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "transactions_payment_method_id_fkey" FOREIGN KEY ("payment_method_id") REFERENCES "payment_methods" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "transaction_history" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "transaction_id" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "amount" DECIMAL,
    "gateway_response" TEXT,
    "notes" TEXT,
    "created_by" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "transaction_history_transaction_id_fkey" FOREIGN KEY ("transaction_id") REFERENCES "transactions" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "refunds" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "transaction_id" TEXT NOT NULL,
    "refund_id" TEXT NOT NULL,
    "amount" DECIMAL NOT NULL,
    "reason" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "gateway_refund_id" TEXT,
    "gateway_response" TEXT,
    "failure_reason" TEXT,
    "requested_by" TEXT NOT NULL,
    "approved_by" TEXT,
    "approved_at" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "refunds_transaction_id_fkey" FOREIGN KEY ("transaction_id") REFERENCES "transactions" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "refunds_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "admin_users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "contracts" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "rental_id" TEXT,
    "sale_id" TEXT,
    "terms" TEXT NOT NULL,
    "signed_at" DATETIME,
    "signed_by" TEXT NOT NULL,
    "file_path" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "contracts_rental_id_fkey" FOREIGN KEY ("rental_id") REFERENCES "rentals" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "contracts_sale_id_fkey" FOREIGN KEY ("sale_id") REFERENCES "sales" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "contracts_signed_by_fkey" FOREIGN KEY ("signed_by") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "customer_analytics" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "total_bookings" INTEGER NOT NULL DEFAULT 0,
    "total_spent" DECIMAL NOT NULL DEFAULT 0,
    "average_booking_value" DECIMAL NOT NULL DEFAULT 0,
    "last_booking_date" DATETIME,
    "customer_lifetime_value" DECIMAL NOT NULL DEFAULT 0,
    "churn_risk_score" DECIMAL NOT NULL DEFAULT 0,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "customer_analytics_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "vehicle_analytics" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "vehicle_id" TEXT NOT NULL,
    "utilization_rate" DECIMAL NOT NULL DEFAULT 0,
    "revenue_per_day" DECIMAL NOT NULL DEFAULT 0,
    "maintenance_frequency" INTEGER NOT NULL DEFAULT 0,
    "customer_rating_avg" DECIMAL NOT NULL DEFAULT 0,
    "booking_cancellation_rate" DECIMAL NOT NULL DEFAULT 0,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "vehicle_analytics_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "vehicles" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "revenue_analytics" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "date" DATETIME NOT NULL,
    "rental_revenue" DECIMAL NOT NULL DEFAULT 0,
    "sales_revenue" DECIMAL NOT NULL DEFAULT 0,
    "total_revenue" DECIMAL NOT NULL DEFAULT 0,
    "vehicle_id" TEXT,
    "location_id" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "revenue_analytics_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "vehicles" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "revenue_analytics_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "vehicle_locations" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "financial_analytics" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "date" DATETIME NOT NULL,
    "period_type" TEXT NOT NULL,
    "total_revenue" DECIMAL NOT NULL DEFAULT 0,
    "rental_revenue" DECIMAL NOT NULL DEFAULT 0,
    "sales_revenue" DECIMAL NOT NULL DEFAULT 0,
    "refund_amount" DECIMAL NOT NULL DEFAULT 0,
    "net_revenue" DECIMAL NOT NULL DEFAULT 0,
    "total_transactions" INTEGER NOT NULL DEFAULT 0,
    "successful_transactions" INTEGER NOT NULL DEFAULT 0,
    "failed_transactions" INTEGER NOT NULL DEFAULT 0,
    "refunded_transactions" INTEGER NOT NULL DEFAULT 0,
    "card_payments" DECIMAL NOT NULL DEFAULT 0,
    "bank_transfer_payments" DECIMAL NOT NULL DEFAULT 0,
    "bnpl_payments" DECIMAL NOT NULL DEFAULT 0,
    "total_processing_fees" DECIMAL NOT NULL DEFAULT 0,
    "stripe_fees" DECIMAL NOT NULL DEFAULT 0,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT,
    "admin_id" TEXT,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "details" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "audit_logs_admin_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "admin_users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "admin_users_email_key" ON "admin_users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "vehicles_registration_key" ON "vehicles"("registration");

-- CreateIndex
CREATE UNIQUE INDEX "transactions_transaction_id_key" ON "transactions"("transaction_id");

-- CreateIndex
CREATE UNIQUE INDEX "refunds_refund_id_key" ON "refunds"("refund_id");

-- CreateIndex
CREATE UNIQUE INDEX "contracts_rental_id_key" ON "contracts"("rental_id");

-- CreateIndex
CREATE UNIQUE INDEX "contracts_sale_id_key" ON "contracts"("sale_id");

-- CreateIndex
CREATE UNIQUE INDEX "customer_analytics_user_id_key" ON "customer_analytics"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "vehicle_analytics_vehicle_id_key" ON "vehicle_analytics"("vehicle_id");
