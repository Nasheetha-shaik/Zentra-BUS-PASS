# 🚌 ZENTRA - University Campus Bus Pass Management System

> **Tagline:** *“Your Campus Bus Pass, Simplified.”*

Zentra is a comprehensive, client-side university transport management prototype engineered strictly with **Vanilla JavaScript (ES6+)**, **HTML5**, and **CSS3**. It requires **zero external frameworks, zero dependencies, and zero backend servers**. All business rules, seat calculations, application workflows, fee payments, and AI assistance are powered entirely by client-side JavaScript and persisted using the browser's `localStorage` API.

---

## 📁 Project Directory Structure

```text
smartpass/
│
├── index.html                   # Landing page (hero, 6-step process, live routes, FAQ)
├── login.html                   # Multi-role authentication (Student / Employee / Admin)
├── signup.html                  # Strict validation registration for Students & Staff
├── student-dashboard.html       # Student portal (fee status, timeline, pass details)
├── employee-dashboard.html      # Employee portal (subsidized transit, verification)
├── admin-dashboard.html         # Admin authority portal (metrics, approval/rejection, reports)
├── routes.html                  # Interactive routes explorer with live seat tracking
├── application.html             # 6-step application wizard with strict business logic
├── bus-pass.html                # Digital pass card with pure JS Canvas-drawn QR code
│
├── css/
│   └── style.css                # University-tech design system (deep navy, teal accents)
│
└── js/
    ├── app.js                   # Data model, demo seeding, localStorage CRUD helpers, nav & QR
    ├── auth.js                  # Login/signup logic, format validation, duplicate checks
    ├── student.js               # Student dashboard metrics, 5-stage timeline, profile
    ├── employee.js              # Employee dashboard metrics, staff subsidy, timeline
    ├── admin.js                 # Admin approval/rejection workflows, seat tracking, reports
    ├── routes.js                # Dynamic route cards, real-time seat calculation, search & filters
    ├── application.js           # Multi-step wizard, fee check, duplicate protection, seat check
    ├── payment.js               # Mock payment gateway, transaction ID generation, receipts
    ├── notification.js          # Notification dispatching, badge counter, slide-out drawer
    └── ai-assistant.js          # Floating Zentra AI widget with rule-based reasoning
```

---

## ⚡ How to Run the Project

1. **No Installation Required:** Because this project uses pure Vanilla JavaScript, HTML5, and CSS3, no build step, `npm install`, or backend server is needed.
2. Simply double-click **`index.html`** or open it in any modern browser (Chrome, Edge, Firefox, Safari).
3. Recommended workspace: Set `C:\Users\nashe\.gemini\antigravity\scratch\smartpass` as your active workspace directory.

---

## 👥 Demo Accounts & Credentials

To facilitate demonstration for university faculty and evaluators, the login page features **1-Click Quick Autofill Pills**:

| Role | Name | ID / Username | Password | Status / Scenario |
| :--- | :--- | :--- | :--- | :--- |
| **Student** | Rahul Sharma | `21BCE1001` | `password123` | Transport Fee **PAID**, Pass **APPROVED** (Route 01) |
| **Student** | Sneha Patel | `22BCE1045` | `password123` | Transport Fee **PAID**, Application **PENDING** (Route 02) |
| **Student** | Amit Verma | `23BME1089` | `password123` | Transport Fee **UNPAID** (Tests payment gateway) |
| **Student** | Priya Nair | `21BEC1022` | `password123` | Application **REJECTED** (Tests rejection timeline) |
| **Student** | Vikram Singh | `22BCS1111` | `password123` | Transport Fee **PAID**, No active application |
| **Employee** | Dr. Rajesh Kumar | `EMP201` | `password123` | Faculty member, Pass **APPROVED** (Route 01) |
| **Employee** | Prof. Ananya Roy | `EMP202` | `password123` | Faculty member, Application **PENDING** (Route 04) |
| **Employee** | Suresh Menon | `EMP203` | `password123` | Staff member, No active application |
| **Admin** | Chief Officer | `ADMIN01` | `admin` | Transport Authority (Full management portal) |

*Tip: You can click "Reset Sample Data" in the top banner at any time to restore the initial database state.*

---

## 🎓 JavaScript Concepts Demonstrated (University Evaluation Checklist)

The project visibly demonstrates core and advanced JavaScript concepts:

1. **DOM Manipulation & Traversal:**
   - Dynamic HTML card and table injection (`renderRouteCards`, `renderApplicationsTable`).
   - Dynamic element creation, class toggles, and modal rendering.
2. **LocalStorage & JSON Serialization:**
   - Full CRUD abstraction: `saveData()`, `loadData()`, `updateData()`, `deleteData()`.
   - `JSON.stringify()` and `JSON.parse()` for robust data persistence.
3. **Array Methods:**
   - `.map()` for dynamic templating.
   - `.filter()` for multi-criteria search and filter bars.
   - `.reduce()` for computing total seat capacity, occupancy rates, and revenue.
   - `.find()` and `.findIndex()` for instant record lookup and state transitions.
4. **Form Validation & Regular Expressions:**
   - Strict regex checking for email (`/^[^\s@]+@[^\s@]+\.[^\s@]+$/`) and 10-digit phone (`/^\d{10}$/`).
   - Password confirmation and length verification.
   - Duplicate key rejection across localStorage arrays.
5. **Simulated Asynchronous Programming:**
   - Simulated payment processing with progress stages and timeout delays (`setTimeout`).
   - Realistic chatbot typing indicator (`Zentra AI is typing...`).
6. **Pure JavaScript HTML5 Canvas Rendering:**
   - Algorithmic QR code matrix rendering on `<canvas>` without external libraries.
7. **Modular Code Organization:**
   - Clean separation of concerns into distinct domain-specific `.js` files.
8. **Rule-Based Conversational Engine:**
   - Natural language keyword parsing with context-sensitive state lookups (querying live seat availability and user status directly from `localStorage`).

---

## 🔄 Demonstration Walkthroughs for Project Defense

### Scenario A: Student Fee Payment & Bus Pass Application
1. Sign in as **Amit Verma** (`23BME1089` / `password123`).
2. Notice his Transport Fee status is marked **UNPAID**.
3. Attempt to apply for a pass by visiting `application.html` — observe the fee clearance blocker!
4. Return to the dashboard and click **"Pay Now"**.
5. Watch the animated gateway simulation. Notice the generated Transaction ID (e.g. `SPTX2026...`), status flip to **PAID**, and view the printable official receipt.
6. Now visit `application.html` — the 6-step wizard is unlocked.
7. Select an available route, choose a stop, review live seat calculation, and submit.
8. The application is registered as **PENDING** without reducing seat count prematurely.

### Scenario B: Admin Review, Seat Allocation & Pass Issuance
1. Sign in as **Admin** (`ADMIN01` / `admin`).
2. Observe the 8 live KPI metrics.
3. Use the search bar to find the newly submitted application or **Sneha Patel** (`APP2026-002`).
4. Click **"Approve"**:
   - The route's `occupiedSeats` count increases by 1.
   - The route's `availableSeats` count decreases by 1.
   - A digital pass (`SP-PASS-2026-...`) is generated.
   - A notification is automatically dispatched to the applicant.
5. Review the **Reports & Analytics** section to see updated bar charts, fleet occupancy donut gauge, and fee revenue tally.

### Scenario C: Route Full Prevention
1. Explore the routes on `routes.html`.
2. Notice **Route 03 (Tenali → Campus Shuttle)** has 0 available seats and is marked **Route Full**.
3. Observe that application is disabled for this route, and click **"Notify Transport Authority"** to trigger an admin notification.

### Scenario D: Zentra AI Assistant
1. Click the floating **Zentra AI** button at the bottom-right of any page.
2. Ask *"How do I apply?"* or *"Show available routes"*.
3. Notice that the AI queries the real-time `localStorage` state and lists the exact current seat availability!
4. Ask *"Where is my bus pass?"* while logged in to receive a personalized update.
