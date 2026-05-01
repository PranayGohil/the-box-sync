# TheBoxSync Architecture Summary

This document provides a comprehensive overview of the architecture, state management, and data flow of the TheBoxSync application, based on a review of the frontend directories, backend Express routes, and MongoDB schemas.

## 1. High-Level Architecture

The system follows a modern decoupled architecture consisting of multiple purpose-built React frontend applications communicating with a unified Node.js/Express backend via a RESTful API.

### 1.1 Micro-Frontends Strategy
The repository contains several distinct frontend applications tailored to specific roles within a restaurant/hospitality ecosystem:
- **`manager`**: Dashboard for restaurant managers to oversee operations, orders, staff, and analytics.
- **`qsr`**: Quick Service Restaurant interface, likely a point-of-sale (POS) optimized for fast order entry.
- **`admin` / `super-admin`**: Portals for high-level tenant and system administration.
- **`captain`**: Interface for waitstaff/captains for table-side ordering.
- **`attendance`**: Dedicated terminal/app for staff attendance tracking.
- **`landing-page` / `website`**: Public-facing components.

### 1.2 Unified Backend
A single `server` directory houses the backend application that serves all frontend clients. It manages business logic, database interactions, authentication, and real-time events.

---

## 2. Frontend Architecture (React)

Using `manager` and `qsr` as reference points, the frontend applications share a consistent, robust architecture based on the `acorn-react` template structure.

### 2.1 Technology Stack
- **Core**: React 17.
- **Routing**: `react-router-dom` (v5) for Single Page Application (SPA) navigation.
- **State Management**: Redux Toolkit (`@reduxjs/toolkit`) paired with `reduxjs-toolkit-persist` for local storage persistence. Context API (`contexts/`) is also utilized for lighter, localized state.
- **Styling**: SASS (`src/sass`) compiled to CSS, utilizing Bootstrap components (`react-bootstrap`) and custom themes.
- **Network**: `axios` for API requests, with `axios-mock-adapter` available for local development without a backend.

### 2.2 Directory Structure
- **`src/views/`**: Contains the page-level components grouped by feature (e.g., `views/manager/order/DeliveryOrder.js`).
- **`src/components/`**: Reusable UI elements (buttons, modals, specific widgets like `PaymentSummaryBox`).
- **`src/store.js` & `src/routing/`**: Configuration for global state and application routes.
- **`src/hooks/` & `src/utils/`**: Custom React hooks and helper functions (e.g., `printUtils.js` for handling receipt/KOT printing).

### 2.3 State Management
State is heavily managed by Redux. Global data such as authentication tokens, user profiles, active tenant settings, and loaded menus are kept in the Redux store. Complex order workflows (like building a unified order in QSR) maintain state either locally within the component tree or in dedicated Redux slices to prevent data loss upon navigation.

---

## 3. Backend Architecture (Express & Node.js)

The backend follows a standard MVC (Model-View-Controller) pattern, though "Views" are handled by the separate React frontends.

### 3.1 Technology Stack
- **Server**: Node.js with Express.js (`express`).
- **Database**: MongoDB utilizing Mongoose (`mongoose`) for object data modeling.
- **Authentication**: JWT (`jsonwebtoken`) and password hashing (`bcryptjs`).
- **Real-Time**: `socket.io` for bi-directional communication (crucial for instant order updates across different portals).
- **Background Tasks**: `node-cron` for scheduled operations (e.g., daily resets, report generation).

### 3.2 Directory Structure
- **`models/`**: Defines the data structures (schemas) for MongoDB.
- **`router/`**: Defines the API endpoints and maps HTTP methods to specific controller functions.
- **`controllers/`**: Contains the core business logic. Extracts data from requests, interacts with models, and formats responses.
- **`middlewares/`**: Functions that run before controllers, handling tasks like JWT verification, role-based access control, and request validation.

### 3.3 MongoDB Schemas (Data Models)
The system is highly data-driven with over 40 distinct schemas covering all aspects of restaurant management. Key schemas include:
- **`OrderModel.js`**: Highly detailed schema tracking `order_items` (dishes, quantities, prices, status), billing details (taxes, discounts, totals), and metadata (`order_source`, `order_type` like Takeaway/Delivery, `table_no`). Includes compound indexes for efficient querying of active vs. historical orders.
- **`KotModel.js`**: Manages Kitchen Order Tickets, separating kitchen instructions from billing.
- **`StaffModel.js` & `UserModel.js`**: Manages employees, their roles, and system access.
- **`MenuModel.js`**: Catalogs items available for order.
- **`InventoryModel.js` & `StockUsageLogModel.js`**: Tracks raw materials and daily consumption.

---

## 4. Data Flow

A typical operation, such as placing a new order via the QSR or Manager portal, follows this lifecycle:

1. **User Action (Frontend)**: A user interacts with a view (e.g., adding an item to the cart in `UnifiedOrder.js` or `TakeawayOrder.js`).
2. **Local State Update**: The React component updates its local state or dispatches a Redux action to update the cart in the global store.
3. **API Request**: Upon clicking "Submit" or "Print KOT", an `axios` POST/PUT request is fired to the backend (e.g., `POST /api/orders`). The request includes the JWT in the authorization header.
4. **Backend Routing**: The Express router (`server/router/orderRoutes.js`) intercepts the request.
5. **Middleware Execution**: Authentication middleware verifies the JWT to ensure the user has the appropriate permissions.
6. **Controller Logic**: The relevant function in `orderController.js` is invoked. It extracts the payload, calculates final totals (if not entirely trusted from the client), and initiates database operations.
7. **Database Interaction**: Mongoose creates or updates documents in MongoDB (e.g., saving to `Order` and `KOT` collections).
8. **Real-Time Broadcast (Optional)**: If configured, the backend emits a `socket.io` event (e.g., `new_order_placed`) to notify other connected clients (like a kitchen display or the manager dashboard) to refresh their views.
9. **Response**: The controller sends a success JSON response back to the frontend.
10. **UI Resolution**: The frontend receives the response, clears the local cart state, shows a success toast, and optionally triggers a print utility (`utils/printUtils.js`) to print the physical KOT/Receipt.
