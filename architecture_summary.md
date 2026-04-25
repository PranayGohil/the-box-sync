# The Box Sync: Architecture, State, and Data Flow

This document provides a comprehensive summary of the current architecture, state, and data flow for **The Box Sync** platform based on a review of the frontend portals, backend Express routes, and MongoDB schemas.

---

## 1. High-Level Architecture Overview

The system operates as a **Multi-Tenant Software as a Service (SaaS)** solution tailored for restaurant and hospitality management. It employs a **multi-portal frontend** architecture connecting to a **monolithic backend API**, utilizing WebSockets for real-time communication and MongoDB as the primary data store.

### Key Characteristics:
*   **Decoupled Multi-Frontend:** Distinct React applications serve different user roles (e.g., Admin, Captain, Kitchen, Manager).
*   **Express REST API + WebSockets:** Node.js backend handles both traditional HTTP REST requests and real-time Socket.IO connections.
*   **Document-Oriented Data Model:** MongoDB (via Mongoose) manages complex nested documents such as orders with multiple items, payment details, and dynamic statuses.

---

## 2. Frontend Architecture
The frontend consists of multiple sibling directories, each representing a distinct Single Page Application (SPA) designed for a specific operational role.

### Portals
*   `admin` / `super-admin`: Central dashboards for overarching management.
*   `manager`: Portal for restaurant managers to oversee operations.
*   `captain` / `waiter`: Interface for on-ground staff to take orders and manage tables.
*   `qsr`: Quick Service Restaurant point-of-sale interface.
*   `kot`: Kitchen Order Ticket display for real-time kitchen management.
*   `attendance`: Staff punch-in/punch-out portal.
*   `landing-page` / `website`: Client-facing web pages.

### Technology Stack
*   **Core:** React 17 (from an `acorn-react` base), `react-router-dom` for client-side routing.
*   **State Management:** Redux Toolkit (`@reduxjs/toolkit`).
*   **Styling:** SCSS (`sass`) and React Bootstrap (`react-bootstrap`).
*   **Networking:** `axios` for HTTP, `socket.io-client` for real-time WebSockets.
*   **Tooling:** Heavily relies on tools like `chart.js` (statistics), `fullcalendar` (bookings), and `formik` / `yup` (form validation). All portals appear to be derived from a consistent UI base configuration (`acorn-react`).

---

## 3. Backend Architecture (Express.js)
The `server/` directory encapsulates a monolithic Node/Express backend that exposes APIs to all frontend portals.

### API Routes structure
The application serves specialized REST APIs under `/api/*`, categorized by feature:
*   **Operations & Billing:** `/order`, `/charge`, `/kot`, `/reservation`, `/table`
*   **Menu & Inventory:** `/menu`, `/inventory`
*   **Users & Staff:** `/user`, `/staff`, `/attendance`, `/payroll`, `/waiter`, `/panel-user`
*   **Super Admin & SaaS Tools:** `/subscription`, `/superadmin`, `/statistics`, `/inquiry`
*   **Hotel Systems (Extension):** `/room`, `/hotel-booking`
*   **Customer Facing:** `/feedback`, `/website`, `/customerquery`

### Real-time Engine
A global `Socket.IO` instance is integrated into the Express server.
*   **Role-based connections:** Sockets connect and register via a combination of `userId` and `role`.
*   **Targeted Emissions:** A utility `.emitToUser(userId, event, data)` broadcasts live state (like a new KOT arrival or order completion) exclusively to the relevant authenticated clients without flooding the network.

---

## 4. Database Schema & State (MongoDB/Mongoose)
The schemas represent a robust, multi-tenant relational system using Mongoose. 

### Multi-Tenancy Strategy
Instead of separating databases per client, data segregation relies on `user_id` or `restaurant_code` constraints within documents to isolate restaurant data.

### Notable Schemas
*   **`User` (Restaurant/Tenant):** Contains broad details of the tenant including GST/tax settings, logo, container charges, purchased plans, and password hashes using bcrypt hooks.
*   **`Order`:** Deeply nested documents keeping track of `order_no`, `table_no`, tax details (CGST/SGST), partial/full payments, and an array of `order_items`. Items have individual statuses (Pending, Preparing, Completed) tying back to KOT flows.
*   **`Staff` / `Attendance` / `Payroll`:** Dedicated models track employee configurations, daily punch-in data, and payroll distribution.
*   **Performance Optimization:** Collections heavily utilize indexing. For instance, the `Order` model indexes `{ user_id: 1, order_date: -1 }` and `{ user_id: 1, order_type: 1, order_status: 1 }` to quickly load active dashboards and order histories.

---

## 5. Data Flow Lifecycle
Below is a typical data flow for an operation—for example, taking a table order and sending it to the kitchen:

1.  **Client Initiation:** A `captain` frontend SPA dispatches a state update. 
2.  **API Call:** Axios sends an authenticated `POST /api/order` request, including the token and order JSON.
3.  **Backend Processing:**
    *   Express router forwards the payload to the Order controller.
    *   The controller validates the request and invokes `Order.create()`.
    *   Simultaneously, the KOT controller is typically invoked to generate a kitchen ticket (`kotModel`).
4.  **Database Persistence:** Mongoose saves the nested document to MongoDB safely. 
5.  **Real-Time Push:** The Express server calls `emitToUser(kitchenUserId, 'new_kot', data)`.
6.  **Client Update:** The active `kot` React SPA receives the Socket event and immediately updates the Kitchen display board array without refreshing the page.

---
> [!NOTE]
> This decoupled frontends approach allows operational components (like KOT screens or Captain portals) to remain exceptionally lightweight and isolated, ensuring a deploy block or syntax error in one dashboard does not bring down the entire Point of Sale availability.
