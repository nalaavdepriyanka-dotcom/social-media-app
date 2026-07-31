-- -----------------------------------------------------
-- Database Creation
-- -----------------------------------------------------
CREATE DATABASE ttmm_db;
USE ttmm_db;

-- -----------------------------------------------------
-- 1. Users Table
-- Stores registration, login, and personal budget settings
-- -----------------------------------------------------
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    personal_budget DECIMAL(10, 2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- -----------------------------------------------------
-- 2. Expense Groups Table
-- Stores group details created by users
-- -----------------------------------------------------
CREATE TABLE expense_groups (
    id INT PRIMARY KEY AUTO_INCREMENT,
    group_name VARCHAR(100) NOT NULL,
    description TEXT,
    group_type ENUM('Trip', 'Apartment', 'Event', 'Other'),
    created_by INT,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- -----------------------------------------------------
-- 3. Group Members Table
-- Tracks participants and their balances (Owe/Lent)
-- -----------------------------------------------------
CREATE TABLE group_members (
    id INT PRIMARY KEY AUTO_INCREMENT,
    group_id INT,
    user_name VARCHAR(100) NOT NULL,
    phone VARCHAR(15),
    balance DECIMAL(10, 2) DEFAULT 0.00,
    FOREIGN KEY (group_id) REFERENCES expense_groups(id) ON DELETE CASCADE
);

-- -----------------------------------------------------
-- 4. Group Expenses Table
-- Detailed log of every transaction within a group
-- -----------------------------------------------------
CREATE TABLE group_expenses (
    id INT PRIMARY KEY AUTO_INCREMENT,
    group_id INT,
    title VARCHAR(255) NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    paid_by VARCHAR(100), -- Person who initially paid
    payment_mode VARCHAR(50), -- e.g., PhonePe, GPay, Cash
    receipt_url TEXT, -- Link to the receipt image
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (group_id) REFERENCES expense_groups(id) ON DELETE CASCADE
);
show databases;



