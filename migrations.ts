
export const SQLITE_SCHEMA = `
-- ==========================================
-- SQLite Migration Script for ManuVest
-- Generated for: Manufacturing Budget System
-- ==========================================

PRAGMA foreign_keys = ON;

-- 1. Users & Roles
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role TEXT CHECK( role IN ('Admin', 'User', 'Approver', 'Finance') ) NOT NULL DEFAULT 'User',
    department_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 2. Departments
CREATE TABLE IF NOT EXISTS departments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL
);

-- 3. Business Categories (Wiring Harness, AEP, etc.)
CREATE TABLE IF NOT EXISTS business_categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL
);

-- 4. Investment Types (Capex/Opex)
CREATE TABLE IF NOT EXISTS investment_types (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL -- Capex, Opex
);

-- 5. Suppliers
CREATE TABLE IF NOT EXISTS suppliers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    contact_person TEXT,
    email TEXT,
    phone TEXT
);

-- 6. Budget Years
CREATE TABLE IF NOT EXISTS budget_years (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    year INTEGER NOT NULL UNIQUE,
    is_active BOOLEAN DEFAULT 1
);

-- 7. Projects
CREATE TABLE IF NOT EXISTS projects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    customer_name TEXT
);

-- 8. Customers
CREATE TABLE IF NOT EXISTS customers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL
);

-- 9. Currencies
CREATE TABLE IF NOT EXISTS currencies (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT NOT NULL UNIQUE, -- USD, IDR, JPY
    rate_to_base REAL DEFAULT 1.0
);

-- 10. Internal Orders (IO)
CREATE TABLE IF NOT EXISTS io_numbers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT NOT NULL UNIQUE,
    description TEXT
);

-- 11. Cost Centers
CREATE TABLE IF NOT EXISTS cost_centers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    department_id INTEGER,
    FOREIGN KEY (department_id) REFERENCES departments(id)
);

-- 12. Plants
CREATE TABLE IF NOT EXISTS plants (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    location TEXT
);

-- 13. Storage Locations
CREATE TABLE IF NOT EXISTS storage_locations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT NOT NULL UNIQUE,
    plant_id INTEGER,
    description TEXT,
    FOREIGN KEY (plant_id) REFERENCES plants(id)
);

-- 14. Master Items
CREATE TABLE IF NOT EXISTS master_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    item_code TEXT NOT NULL UNIQUE,
    item_name TEXT NOT NULL,
    description TEXT,
    uom TEXT,
    category TEXT,
    is_active BOOLEAN DEFAULT 1
);

-- ==========================================
-- TRANSACTION TABLES
-- ==========================================

-- Budget Investment Plan Header
CREATE TABLE IF NOT EXISTS budget_plans (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    plan_number TEXT NOT NULL UNIQUE,
    year_id INTEGER NOT NULL,
    department_id INTEGER NOT NULL,
    business_category_id INTEGER NOT NULL,
    project_id INTEGER,
    customer_id INTEGER,
    io_number_id INTEGER,
    cost_center_id INTEGER,
    plant_id INTEGER,
    pic_name TEXT,
    investment_type_id INTEGER,
    status TEXT DEFAULT 'Draft',
    created_by INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (department_id) REFERENCES departments(id),
    FOREIGN KEY (business_category_id) REFERENCES business_categories(id),
    FOREIGN KEY (project_id) REFERENCES projects(id),
    FOREIGN KEY (io_number_id) REFERENCES io_numbers(id),
    FOREIGN KEY (cost_center_id) REFERENCES cost_centers(id),
    FOREIGN KEY (plant_id) REFERENCES plants(id)
);

-- Budget Investment Plan Items
CREATE TABLE IF NOT EXISTS budget_plan_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    budget_plan_id INTEGER NOT NULL,
    internal_no TEXT,
    machine_name TEXT NOT NULL,
    process_type TEXT, -- Preparation / Final Assy
    brand TEXT,
    qty INTEGER DEFAULT 1,
    uom TEXT,
    currency_id INTEGER,
    est_cost_unit REAL,
    est_cost_total REAL,
    description TEXT,
    
    FOREIGN KEY (budget_plan_id) REFERENCES budget_plans(id) ON DELETE CASCADE,
    FOREIGN KEY (currency_id) REFERENCES currencies(id)
);

-- Purchase Request (PR) Header
CREATE TABLE IF NOT EXISTS purchase_requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    pr_number TEXT NOT NULL UNIQUE,
    pr_date DATE NOT NULL,
    department_id INTEGER,
    business_category_id INTEGER,
    io_number_id INTEGER,
    cost_center_id INTEGER,
    auc_no TEXT,
    asset_no TEXT,
    plant_id INTEGER,
    storage_location_id INTEGER,
    pic_name TEXT,
    investment_type_id INTEGER,
    status TEXT DEFAULT 'Draft',
    created_by INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (department_id) REFERENCES departments(id),
    FOREIGN KEY (io_number_id) REFERENCES io_numbers(id),
    FOREIGN KEY (plant_id) REFERENCES plants(id)
);

-- Purchase Request Items
CREATE TABLE IF NOT EXISTS pr_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    purchase_request_id INTEGER NOT NULL,
    budget_plan_item_id INTEGER, -- Link to Budget
    item_id INTEGER, -- Link to Master Item
    description TEXT NOT NULL,
    qty REAL NOT NULL,
    uom TEXT,
    est_cost_unit REAL,
    est_cost_total REAL,
    currency_id INTEGER,
    supplier_id INTEGER,
    remarks TEXT,
    
    FOREIGN KEY (purchase_request_id) REFERENCES purchase_requests(id) ON DELETE CASCADE,
    FOREIGN KEY (budget_plan_item_id) REFERENCES budget_plan_items(id),
    FOREIGN KEY (supplier_id) REFERENCES suppliers(id)
);

-- Audit / Approval Log
CREATE TABLE IF NOT EXISTS workflow_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    entity_type TEXT NOT NULL, -- 'BUDGET' or 'PR'
    entity_id INTEGER NOT NULL,
    action TEXT NOT NULL, -- 'SUBMIT', 'APPROVE', 'REJECT'
    user_id INTEGER,
    notes TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_budget_dept ON budget_plans(department_id);
CREATE INDEX idx_budget_project ON budget_plans(project_id);
CREATE INDEX idx_pr_number ON purchase_requests(pr_number);
CREATE INDEX idx_pr_budget_link ON pr_items(budget_plan_item_id);
`;