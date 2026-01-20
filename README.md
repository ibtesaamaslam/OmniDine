# OmniDine — Restaurant Management System

OmniDine is a modern, responsive, single-page application (SPA) built with React and Tailwind CSS designed to streamline restaurant operations. It features a comprehensive suite of tools for Point of Sale (POS), Kitchen Display Systems (KDS), Inventory Management, Table Reservation, and Menu Administration.

## 🚀 Features

### 🔐 Authentication & Security
- **Role-Based Access Control (RBAC):** distinct interfaces for Admins, Waiters, and Kitchen Staff.
- **First-Time Setup Workflow:** New accounts start uninitialized. Users must define their display name and secure password upon their first login.
- **Self-Service Password Change:** Logged-in users can update their passwords via the settings menu.

### 🏪 Point of Sale (POS)
- **Visual Menu:** Categorized grid view of dishes with search functionality.
- **Table Management:** Assign orders to specific tables with visual status indicators (Available, Occupied, Reserved).
- **Customizable Orders:** Support for dish modifiers (e.g., "Extra Cheese", "No Onions") and quantity adjustments.
- **Cart System:** Review orders, modify items, and calculate totals before submission.

### 🍳 Kitchen Display System (KDS)
- **Real-Time Order Ticket Board:** Orders appear instantly as they are placed.
- **Status Workflow:** Track order lifecycle from `Pending` → `Preparing` → `Ready` → `Completed`.
- **Inventory Integration:** Automatically depletes stock levels when items are moved to "Preparing".
- **Visual Cues:** Color-coded tickets and timers (creation time) to prioritize orders.

### 📦 Inventory & Menu Management
- **Recipe Linking:** Link dishes to inventory ingredients (e.g., A "Burger" dish consumes 1 "Bun" and 1 "Patty").
- **Stock Tracking:** Real-time stock level updates with visual low-stock alerts on the dashboard.
- **Menu Admin:** Create, edit, delete, and toggle availability of dishes and categories.

### 📅 Tables & Reservations
- **Interactive Floor Plan:** Visual grid of tables showing capacity and current status.
- **Reservation System:** Book tables for future dates/times, tracking guest counts and contact info.
- **Status Automation:** Tables update automatically based on reservation times and active orders.

### 📊 Dashboard & Analytics
- **Live Metrics:** View total revenue, daily order counts, and active table utilization.
- **Low Stock Alerts:** Immediate warnings for items falling below defined thresholds.
- **Recent Activity:** Log of the latest orders and transactions.

---

## 🛠 Tech Stack

- **Frontend:** React 19 (Hooks, Context API, useReducer for state management)
- **Styling:** Tailwind CSS (via CDN)
- **Icons:** Lucide React
- **Build/Run:** ES Modules (No complex bundler required for dev)

---

## 🚦 Getting Started

### Prerequisites
Since this project uses ES Modules directly in the browser via `index.html`, you simply need a static file server.

### Installation & Running
1.  **Clone or Download** the repository.
2.  **Serve the directory**:
    *   If using Python: `python3 -m http.server`
    *   If using Node (http-server): `npx http-server .`
    *   If using VS Code: Use the "Live Server" extension.
3.  **Open in Browser**: Navigate to `http://localhost:8000` (or the port provided by your server).

---

## 📖 User Guide

### 1. Initial Setup (First Run)
The system comes with 3 pre-configured role slots. Data is **in-memory**, so refreshing the page resets the app to this state.

1.  **Select a Role**: Click on "Administrator", "Wait Staff", or "Kitchen Staff".
2.  **Create Account**: Since these accounts are new (`isSetup: false`), you will be prompted to enter a **Name** and create a **Password**.
3.  **Login**: Once setup is complete, you will be logged in automatically.
4.  **Subsequent Logins**: If you log out, simply click your user tile and enter the password you created.

### 2. Role Capabilities

| Feature | Admin / Manager | Waiter | Chef |
| :--- | :---: | :---: | :---: |
| **Dashboard** | ✅ | ❌ | ❌ |
| **POS (Take Orders)** | ✅ | ✅ | ❌ |
| **Kitchen Display (KDS)** | ✅ | ❌ | ✅ |
| **Reservations** | ✅ | ✅ | ❌ |
| **Table Management** | ✅ | ✅ | ❌ |
| **Menu Editing** | ✅ | ❌ | ❌ |
| **Inventory** | ✅ | ❌ | ✅ |
| **Order History** | ✅ | ❌ | ❌ |

---

## 📂 Project Structure

- **index.html**: Entry point. Loads Tailwind CSS and the React application.
- **index.tsx**: Contains the entire application logic (Components, State Management, Views, and Styles).
  - *State Store:* `useReducer` handles complex state logic (orders, inventory, users).
  - *Views:* Separated components for POS, KDS, Dashboard, etc.
- **metadata.json**: Project configuration and permissions.

---

## ⚠️ Note on Persistence
This is a client-side demo application. All data (orders, inventory changes, user passwords) is stored in the browser's memory. **Refreshing the page will reset the application to its initial state.** For a production environment, a backend (Node.js, Firebase, Supabase, etc.) would be required to persist data.
