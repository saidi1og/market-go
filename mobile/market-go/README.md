# Musanze Safe Market Field Inspection Prototype
**SWE 3409 — Mobile Application Development — Assignment 1**  
*Institut d'Enseignement Supérieur de Ruhengeri (INES-Ruhengeri), Ruhengeri, Rwanda*

---

## 1. Group Information
- **Assigned Group Number:** Group 04 (`G04`)
- **Group Verification Code:** `MOB-G04-8924`
- **Academic Year:** 2026 / Term 1

### Team Members & Role Distribution
| Member | Student Name | Reg. Number | Role & Primary Responsibility | Owned Components & Evidence |
| :--- | :--- | :--- | :--- | :--- |
| **Member 1 (Leader)** | Jean de Dieu Habimana | `2023/8924` | Product & UX Lead | Scenario interpretation, UI/UX specification (Pages 1–8), task flows, visual tokens |
| **Member 2** | Aline Uwase | `2023/8925` | Interface Engineer | Catalog screen (`CatalogScreen.tsx`), reusable `StallCard.tsx`, narrow-screen Flexbox layout, empty state |
| **Member 3** | Eric Mugisha | `2023/8926` | State & Navigation Engineer | Validated form (`InspectionFormScreen.tsx`), controlled inputs, Rwandan phone regex, tabs & stack navigation |
| **Member 4** | Sandrine Mukamana | `2023/8927` | Device Integration & QA Lead | Camera & gallery workflow (`MediaCapture.tsx`), permission denial recovery, cancellation handling, test suite |
| **Member 5** | Patrick Nshimiyimana | `2023/8928` | Release & Evidence Lead | Repository hygiene, `README.md`, `AI_USE.md`, marking rubric checklist, package verification |

---

## 2. Project Overview & Field Scenario
Musanze Safe Markets is conducting a field pilot to register vendor stalls and document visible hygiene, storage conditions, and safety compliance across 4 market zones (Zone A: Green Grocers, Zone B: Cereals & Legumes, Zone C: Animal Products, Zone D: Artisanal Crafts).

Field officers operate in-memory on mobile touchscreen devices under bright daylight conditions without reliance on remote backends.

### Key Capabilities
1. **Prominent Group Verification Code:** Displayed in the top application header and on the pre-save Review Screen (`MOB-G04-8924`).
2. **Market Catalog:** 8 detailed fictional stalls across 4 zones with category chips, inspection priority levels (Urgent, Standard, Routine), status indicators, and clear empty-state recovery.
3. **Strict Local Validation:**
   - **Stall Code:** Exact pattern `MSZ-[A-D]-[0-9]{3}` (e.g., `MSZ-A-104`).
   - **Vendor Alias:** Required fictional alias (min 2 chars).
   - **Rwandan Mobile Phone:** Validated against MTN Rwanda (`078`, `079`) and Airtel Rwanda (`072`, `073`) formats in local (`0788123456`) or international (`+250 788 123 456`) syntax.
   - **Risk Assessment:** Low, Medium, High, or Critical.
   - **Mandatory Consent:** Explicit checkbox confirming vendor consent before submission.
4. **Camera & Gallery Evidence Workflow:**
   - Real-time device camera capture via HTML5 `getUserMedia`.
   - Gallery file selection with image preview.
   - 4 curated pilot sample evidence photos for fast offline verification.
   - Robust permission denial recovery and picker cancellation feedback.
5. **Pre-Save Review & Confirmation:**
   - Displays all validated fields, attached photo, timestamp, and group code.
6. **Navigation Architecture:**
   - Bottom tab navigation: **Home (Catalog)**, **New Inspection**, and **Records**.
   - Stack route: Records list pushes to **Inspection Details** with reliable session preservation on back navigation.
7. **Assessor Verification Suite:**
   - Built-in interactive modal testing all 10 Assessor Verification steps from Page 5 of the assignment brief.
   - Live parameter tweak allowing on-the-fly group code and font scale modification.

---

## 3. Installation & Execution Commands

### Prerequisites
- Node.js $\ge$ 18.0.0
- npm $\ge$ 9.0.0

### Run Locally
```bash
# 1. Install dependencies
npm install

# 2. Start development server
npm run dev

# 3. Build for production
npm run build
```

---

## 4. Assessor Verification Script Matrix (Assignment Page 5)
| Test # | Assessor Script Test | Verification Outcome | Linked Rubric Mark |
| :--- | :--- | :--- | :--- |
| **1** | **Launch** | App opens cleanly with `MOB-G04-8924` visible in header; zero red error screens. | Reliability (5 marks) |
| **2** | **Catalog** | 8 stalls render with distinct status & priority chips; empty state toggleable on search/filter. | Layout (12 marks) |
| **3** | **Invalid Form** | Blank inputs, malformed stall codes, invalid phone, and missing consent are blocked with field errors. | Validation (13 marks) |
| **4** | **Valid Form** | Valid fictional inputs advance to review screen with intact values. | State (13 marks) |
| **5** | **Navigation** | All tabs and stack routes work; back navigation preserves all in-memory drafts and records. | Navigation (12 marks) |
| **6** | **Permission** | Denied camera permission yields clear warning and alternate recovery path (Gallery). | Hardware (18 marks) |
| **7** | **Image** | Capture, select, preview, replace, and remove all operate seamlessly. | Hardware (18 marks) |
| **8** | **Responsive Check** | Scalable with device width toggles (375px SE, 412px Android) and font scale buttons (1x, 1.25x, 1.5x). | Layout & UX (12 marks) |
| **9** | **Evidence** | Complete UI/UX design spec (Pages 1–8), role distribution, and audit log available in-app. | Individual Evidence (10 marks) |
| **10** | **Live Change** | In-app live parameter panel allows modifying group verification code and testing dynamic rules. | Live Verification (10 marks) |
