

# 🍽️ OmniDine — AI-Ready Restaurant Management System

<div align="center">

![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge\&logo=react\&logoColor=black)
![Tailwind](https://img.shields.io/badge/TailwindCSS-06B6D4?style=for-the-badge\&logo=tailwindcss\&logoColor=white)
![Architecture](https://img.shields.io/badge/Architecture-SPA-green?style=for-the-badge)
![Status](https://img.shields.io/badge/Status-Stable-success?style=for-the-badge)
![License](https://img.shields.io/badge/License-MIT-lightgrey?style=for-the-badge)

**Run smarter restaurants. Faster orders. Better decisions.**

OmniDine is a modern, responsive **Restaurant Management System (RMS)** built as a single-page application using React and Tailwind CSS. It combines POS, Kitchen Display, Inventory, Reservations, and Analytics into one seamless workflow.

[🔗 View Repository](https://github.com/ibtesaamaslam/OmniDine) · [🐛 Report Bug](https://github.com/ibtesaamaslam/OmniDine/issues) · [✨ Request Feature](https://github.com/ibtesaamaslam/OmniDine/issues)

</div>

---

## 📋 Table of Contents

* [Overview](#-overview)
* [Features](#-features)
* [System Modules](#-system-modules)
* [Tech Stack](#-tech-stack)
* [Getting Started](#-getting-started)
* [User Roles](#-user-roles)
* [Project Structure](#-project-structure)
* [Limitations](#-limitations)
* [Future Improvements](#-future-improvements)
* [License](#-license)

---

## 📌 Overview

**OmniDine** is a complete front-end restaurant management solution designed to simulate real-world operations.

It integrates:

* 🧾 Order management (POS)
* 🍳 Kitchen workflows (KDS)
* 📦 Inventory tracking
* 📅 Table reservations
* 📊 Business analytics

All within a **fast, responsive, and modular SPA architecture**.

---

## ✨ Features

### 🔐 Authentication & Security

* Role-Based Access Control (Admin, Waiter, Kitchen Staff)
* First-time setup workflow for secure onboarding
* Self-service password updates

---

## 🧩 System Modules

### 🏪 Point of Sale (POS)

* Visual categorized menu with search
* Table-based order assignment
* Dish customization (modifiers, notes)
* Smart cart with real-time calculations

---

### 🍳 Kitchen Display System (KDS)

* Live order ticket board
* Order lifecycle tracking:

  ```
  Pending → Preparing → Ready → Completed
  ```
* Auto inventory deduction
* Color-coded priority system

---

### 📦 Inventory & Menu Management

* Ingredient-based recipe linking
* Real-time stock updates
* Low-stock alerts
* Full CRUD menu management

---

### 📅 Tables & Reservations

* Interactive floor layout
* Reservation scheduling system
* Auto status updates (Reserved / Occupied / Available)

---

### 📊 Dashboard & Analytics

* Revenue tracking
* Daily order metrics
* Active table utilization
* Activity logs
* Inventory alerts

---

## 🏗 System Architecture

```
User Interaction
      ↓
POS / Reservations / KDS
      ↓
State Management (useReducer)
      ↓
UI Updates (React Components)
      ↓
Inventory & Analytics Sync
```

---

## 🛠 Tech Stack

| Layer        | Technology                                |
| ------------ | ----------------------------------------- |
| Frontend     | React 19 (Hooks, Context API, useReducer) |
| Styling      | Tailwind CSS                              |
| Icons        | Lucide React                              |
| Architecture | SPA (Single Page Application)             |
| Runtime      | Browser-based (ES Modules)                |

---

## 🚀 Getting Started

### Prerequisites

* Browser + Static server

---

### Installation

```bash
# Clone the repository
git clone https://github.com/ibtesaamaslam/OmniDine.git
cd OmniDine
```

---

### Run Locally

```bash
# Python
python3 -m http.server

# OR Node
npx http-server .

# OR VS Code Live Server
```

Open:

```
http://localhost:8000
```

---

## 👥 User Roles

| Feature         | Admin | Waiter | Chef |
| --------------- | ----- | ------ | ---- |
| Dashboard       | ✅     | ❌      | ❌    |
| POS             | ✅     | ✅      | ❌    |
| KDS             | ✅     | ❌      | ✅    |
| Reservations    | ✅     | ✅      | ❌    |
| Menu Management | ✅     | ❌      | ❌    |
| Inventory       | ✅     | ❌      | ✅    |
| Order History   | ✅     | ❌      | ❌    |

---

## 🔄 How It Works

```
Login → Select Role
     ↓
Take Orders (POS)
     ↓
Send to Kitchen (KDS)
     ↓
Update Inventory
     ↓
Complete Order
     ↓
Analytics Dashboard Update
```

---

## 📁 Project Structure

```
OmniDine/
├── index.html        # Entry point
├── index.tsx         # Full app logic (components + state)
├── metadata.json     # Config
```

---

## ⚠️ Limitations

* In-memory data storage (no persistence)
* Page refresh resets all data
* No backend integration
* Single-device usage

---

## 🔮 Future Improvements

* [ ] Backend integration (Node.js / Firebase / Supabase)
* [ ] Real database persistence
* [ ] Multi-user real-time sync
* [ ] Payment gateway integration
* [ ] AI-based demand prediction
* [ ] Mobile-first PWA version

---

## 📜 License

MIT License

---

<div align="center">

Built with ❤️ by **Ibtesaam Aslam**

⭐ Star this repo if you found it useful

</div>

