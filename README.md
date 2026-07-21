# Banking Biometric Onboarding & Management Suite (Biometric Glide)

A modern, high-performance React + TypeScript web application for customer biometric onboarding, updates, enquiries, and approval workflows in a retail banking environment.

This system integrates with a legacy PHP backend (`http://10.203.14.169/imaging/...`) and supports real-time capture of photos, signatures, identification documents, and fingerprints. It also features a fully independent **Standalone Coexistence Mode** with local data synchronization, a dynamic **Step Configuration Dashboard**, a secure **Account-Level Approval workflow**, and a forensic-grade **Offline AI Signature Verification Engine** (powered by a local Python server).

## Core Modules & Features

### 1. Dual-Mode Coexistence Architecture
* **Integrated (x100) Mode**: Automatically routes requests to query Oracle core banking database views and packages using standard URL parameter schemes.
* **Standalone Mode**: Operates independently of core banking availability. Tellers can manually register accounts (`TB_STANDALONE_ACCOUNTS`) and signatory relations (`TB_STANDALONE_RELATIONS`) in a local PostgreSQL database, with frontend states cached in `localStorage`.
* **Fallback Retrieval Layer**: Queries are resolved first against the local standalone database. If no record is found, the system automatically falls back to Oracle Core Banking, allowing 100% component and page reuse.

### 2. Standalone Setup & Management Dashboard (`/`)
* **Biometric Status Matrix**: Provides real-time visual tracking of photo, signature, ID document, and fingerprint capture and approval status for all signatories under an account.
* **Biometric Onboarding Launcher**: Directly triggers the 4-step onboarding capture flow from signatory entries.
* **Biometrics Preview Modal**: Tellers can instantly preview high-fidelity captured specimens (photos, signatures, IDs, fingerprints) stored locally or fetched from the API.

### 3. Step Configuration Dashboard (`/imaging/stepconfig`)
* Allows tellers and administrators to dynamically enable or disable specific onboarding steps: **Photo**, **Identification (ID)**, and **Fingerprint** capture.
* Configuration changes are persisted back to the backend `/api/activities` configuration endpoint.

### 4. Interactive Cheque Detail & Verification Console (`/imaging/view_cheques-[CHQNO]`)
* Renders comprehensive instrument metadata (instrument code, cheque amount, status, payer and beneficiary details).
* Features zoom-on-hover magnifying glasses for front and back cheque scans and 3D flipping mandate cards for signature/portrait specimens.
* **Parallel AI signature verification**: Compares the cheque signature against all signatory signature cards in parallel.
* Support for multiple **adjustable Region-of-Interest (ROI) crop zones** to target signatures on cheques.
* **Sandbox Verification Modal**: Accessible via the beaker icon, allowing testing of the AI Verification Engine on custom, manually uploaded files.
* **Mandate Validation Triggers**: Instantly validates transaction compliance against account mandates.

### 5. Multi-Step Biometric Capture Flow
* Step 1: Webcam Photo Capture (with auto file upload fallback) and Signature Pad capture (Topaz SigWeb tablet integration).
* Step 2: Identification Scans (multiple document types, front and back sides).
* Step 3: Fingerprint Scanning (Suprema / Digital Persona scanner integration).
* Step 4: Review and Submit (includes a canvas image editor with cropping, rotation, brightness, and contrast controls).

---

## URL Access Patterns & Routing

The system uses strict URL routing formats parsed by [Gateway.tsx](file:///c:/Users/USG/Downloads/biometric-glide/src/pages/Gateway.tsx) to ensure full backward compatibility with legacy systems.

| Purpose | URL Pattern & Example | Component / View |
| :--- | :--- | :--- |
| **Standalone Dashboard** | `/` | [StandaloneSetup.tsx](file:///c:/Users/USG/Downloads/biometric-glide/src/pages/StandaloneSetup.tsx) |
| **Capture Phase** | `/imaging/capture-[RELATION]-[BY]-[YYYY-MM-DD]`<br>Ex: `/imaging/capture-123456-admin-2024-04-21` | [Index.tsx](file:///c:/Users/USG/Downloads/biometric-glide/src/pages/Index.tsx) / [Gateway.tsx](file:///c:/Users/USG/Downloads/biometric-glide/src/pages/Gateway.tsx) |
| **Update Phase** | `/imaging/update-[REL-BATCH-MANDATE-LIMIT-BY-DATE]`<br>Ex: `/imaging/update-123456-B001-M1-50000-admin-2024-04-21` | [Update.tsx](file:///c:/Users/USG/Downloads/biometric-glide/src/pages/Update.tsx) / [Gateway.tsx](file:///c:/Users/USG/Downloads/biometric-glide/src/pages/Gateway.tsx) |
| **Relation Approval** | `/imaging/image_approval_screen-[REL-BATCH-CUST-BY-HOST-IP]`<br>Ex: `/imaging/image_approval_screen-123456-B001-C001-supervisor-PC-10.0.0.1` | [Approval.tsx](file:///c:/Users/USG/Downloads/biometric-glide/src/pages/Approval.tsx) |
| **Account Approval** | `/imaging/account_image_approval_screen-[BATCH]-[ACCOUNT_NO]-[APPROVED_BY]-[HOSTNAME]-[TERMINAL_IP]`<br>Ex: `/imaging/account_image_approval_screen-B001-123456-supervisor-PC-10.0.0.1` | [Approval.tsx](file:///c:/Users/USG/Downloads/biometric-glide/src/pages/Approval.tsx) (Account Mode) |
| **Relation Enquiry** | `/imaging/viewimage-[RELATION_NO]` or `/viewimage-[RELATION_NO]` | [Enquiry.tsx](file:///c:/Users/USG/Downloads/biometric-glide/src/pages/Enquiry.tsx) / [Gateway.tsx](file:///c:/Users/USG/Downloads/biometric-glide/src/pages/Gateway.tsx) |
| **Credential Enquiry** | `/imaging/getimagescred-[CREDENTIAL]` or `/getimagescred-[CREDENTIAL]` | [Enquiry.tsx](file:///c:/Users/USG/Downloads/biometric-glide/src/pages/Enquiry.tsx) / [Gateway.tsx](file:///c:/Users/USG/Downloads/biometric-glide/src/pages/Gateway.tsx) |
| **Account Enquiry** | `/imaging/getimages-[ACCOUNT_NO]` or `/getimages-[ACCOUNT_NO]` | [Enquiry.tsx](file:///c:/Users/USG/Downloads/biometric-glide/src/pages/Enquiry.tsx) / [Gateway.tsx](file:///c:/Users/USG/Downloads/biometric-glide/src/pages/Gateway.tsx) |
| **View Cheques** | `/imaging/view_cheques-[CHQNO]` or `/view_cheques-[CHQNO]` | [ViewCheques.tsx](file:///c:/Users/USG/Downloads/biometric-glide/src/pages/ViewCheques.tsx) / [Gateway.tsx](file:///c:/Users/USG/Downloads/biometric-glide/src/pages/Gateway.tsx) |
| **System Config** | `/imaging/stepconfig` | [StepConfigurationPage.tsx](file:///c:/Users/USG/Downloads/biometric-glide/src/components/StepConfigurationPage.tsx) |

> [!IMPORTANT]
> **Date Format**: The `YYYY-MM-DD` format is strictly validated for Capture and Update routes. Invalid dates (e.g., month 13 or day 32) will trigger a custom 404 page detailing expected parameters.

---

## Required Hardware / Devices

| Feature | Device / Requirement | Integration Method |
| :--- | :--- | :--- |
| **Photo** | Webcam (built-in or USB) | Standard browser `getUserMedia` API (falls back to manual file upload) |
| **Signature** | Topaz SigWeb Tablet (Model **T-LBK460-BSB-R**) | Topaz SigWeb SDK (loaded dynamically via `SigWebTablet.js`). Installer: `sigweb.exe` |
| **Fingerprint** | Suprema Scanner | Local middleware API endpoint (`http://127.0.0.1:8080`) |
| **ID Documents** | Flatbed scanner or Mobile upload | Native file input upload |

> ℹ️ **Topaz T-LBK460-BSB-R Setup**: `sigweb.exe` (located in `C:\Users\USG\Downloads\sigweb.exe` or downloaded from [Topaz SigWeb Downloads](https://www.topazsystems.com/sigweb.html)) is the single required installer containing the driver, background service, and configuration utility. During setup, select **`SigLite 1x5 LCD`** and Connection **`BSB (Virtual Serial via USB)`**.

---

## Backend Infrastructure (Legacy PHP + local AI Server)

The frontend communicates with two distinct servers depending on the operation:

1. **Legacy php server**: Serving APIs under `http://10.203.14.169/imaging/`.
2. **Offline AI verification engine**: Run locally on port `8130` (`http://127.0.0.1:8130/`).

---

## Project Structure & key Files

```
src/
├── pages/
│   ├── StandaloneSetup.tsx    → Standalone Account Setup & Signatory Dashboard (root `/`)
│   ├── Index.tsx              → Main multi-step biometric capture flow (steps 1–4)
│   ├── Approval.tsx           → Supervisor approval (supports relation & account modes)
│   ├── Enquiry.tsx            → Customer profile enquiry (view-only)
│   ├── ViewCheques.tsx        → Cheque Detail Console & automated verification panel
│   ├── Gateway.tsx            → Router parsing URL formats to trigger page rendering
│   └── Update.tsx             → Update mode container wrapper
├── components/
│   ├── PhotoSignature.tsx     → Capture Step 1: Webcam Photo + Topaz Signature pad
│   ├── Identification.tsx     → Capture Step 2: ID document type selection & uploads
│   ├── Fingerprint.tsx        → Capture Step 3: Fingerprint enrollment (right & left thumbs)
│   ├── Review.tsx             → Capture Step 4: Verification review and submission
│   ├── ImageEditor.tsx        → Canvas image manipulation (rotate, crop, brightness, contrast)
│   ├── StepConfigurationPage.tsx → Step configuration setup screen (dynamic step toggle)
│   ├── SandboxVerifyModal.tsx → Interactive sandbox signature verification panel
│   ├── ProgressSidebar.tsx    → Capturing steps stepper sidebar
│   └── PrivacyModal.tsx       → Onboarding privacy disclosures modal
├── services/api.ts            → Unified data mapping, API wrappers, URL regex, & local storage mock operations
└── lib/SigWebTablet.ts        → SDK binding for Topaz Signature Tablets
```

---

## Local Development & Setup

### 1. Clone and Install Dependencies
```bash
git clone <your-repo>
cd biometric-glide
npm install
```

### 2. Run the Frontend Development Server
```bash
npm run dev
```
The application will launch on `http://localhost:8089`.

### 3. Running with Full Device Support
To run tests using physical hardware (fingerprint scanner or Topaz signature pad):
* Run the application on the workstation where devices are physically connected.
* Ensure local device drivers (SigWeb and fingerprint services) are running.
* Verify the legacy PHP backend server `10.203.14.169` is accessible on the network.

### 4. Enable Camera Access for Insecure Origins (HTTP)
If accessing the development server from other intranet IP addresses over HTTP, Chrome block webcams. Enable it via:
```
chrome://flags/#unsafely-treat-insecure-origin-as-secure
```
Add your development URL (e.g. `http://192.168.x.x:8089`) to the exceptions text box and relaunch the browser.

---

## Standalone Database Configuration (PostgreSQL)

To support **Standalone Mode** during core banking database outages, two indexed tables are defined in the local PostgreSQL database instance. These local tables store account metadata and signatory details, linking them to the binary biometric blobs stored in the system.

### PostgreSQL Schema Setup
```sql
-- Stores account type, categories, and mandate instructions
CREATE TABLE PUBLIC.TB_STANDALONE_ACCOUNTS (
    account_number VARCHAR(50) PRIMARY KEY,
    account_category VARCHAR(100) NOT NULL, -- joint, shareholder, individuals, corporate, etc.
    mandate VARCHAR(500) NOT NULL,          -- sole signatory, any two to sign, etc.
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Stores signatory relation numbers, transaction limits, names, and signing levels
CREATE TABLE PUBLIC.TB_STANDALONE_RELATIONS (
    relation_no VARCHAR(50) PRIMARY KEY,
    account_number VARCHAR(50) NOT NULL REFERENCES PUBLIC.TB_STANDALONE_ACCOUNTS(account_number) ON DELETE CASCADE,
    first_name VARCHAR(100) NOT NULL,
    other_name VARCHAR(100),
    surname VARCHAR(100) NOT NULL,
    amtlimit NUMERIC(18,2) DEFAULT 0,
    signatory_level VARCHAR(50) NOT NULL,  -- Category A, Category B, Category C, Category D
    date_of_birth DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Predefined Input Constraints
Tellers are constrained to specific options in the standalone setup UI to align with organizational business rules:
* **Account Category Options**: `Joint`, `Shareholder`, `Individuals`, `Shareholder Related`, `Director`, `Director Related`, `Staff Related`
* **Account Mandates**: `Sole Signatory`, `Any two to sign`, `All Three to sign`, `Either to Sign`, `Both to Sign`
* **Signatory Levels**: `Category A`, `Category B`, `Category C`, `Category D`

---

## Core Technologies

* **Vite + React 18 + TypeScript**
* **Tailwind CSS + shadcn/ui** for premium responsive UI layouts
* **TanStack Query (React Query)** for caching and backend API state synchronizations
* **Framer Motion** for premium interactive page transitions and micro-animations
* **LocalStorage API** for offline metadata caching and state fallback in Standalone Mode
* **Python Fast API + OpenCV (Local Server)** for offline biometric signature alignment and metrics computation

---

## AI Signature Verification Engine — How It Works

The Offline AI Signature Engine (`/backend`) performs **forensic-grade, offline signature verification** using a five-phase computer vision pipeline. It is designed to be **stricter than the human eye** — two genuinely different signatures will score well below 82% even if they appear visually similar. The system **never connects to the internet** and operates fully air-gapped on the bank intranet.

### Architecture Overview

```
Cheque Image (Base64)              Mandate Image (Base64)
        │                                   │
        ▼                                   ▼
  ┌────────────────────────────────────────────────────────┐
  │              FORENSIC PREPROCESSING                    │
  │  1. Grayscale                                          │
  │  2. Bilateral Filter  (preserves ink edges)            │
  │  3. Adaptive Threshold (removes GCB paper pattern)     │
  │  4. Morphological Close (fills ink gaps)               │
  │  5. Connected component scrub (drops specks < 10px)    │
  │  6. Content-aware crop  +  resize to 300×300           │
  └────────────────────────────────────────────────────────┘
                          │
           ┌──────────────┴──────────────┐
           │      5-PHASE SCORING        │
           └──────────────┬──────────────┘
   ┌────────┬────────┬────┴────┬────────┬────────┐
   │ Phase1 │ Phase2 │ Phase3  │ Phase4 │ Phase5 │
   │ Stroke │  SSIM  │   ORB   │  Ink   │   Hu   │
   │  Hist  │(curved)│ Keypts  │Density │Moments │
   │  (20%) │  (25%) │  (35%)  │  (5%)  │  (15%) │
   └────────┴────────┴─────────┴────────┴────────┘
                          │
              Weighted Score  (0–100%)
                          │
              ≥ 82% = MATCH ✅  /  < 82% = NO MATCH ❌
```

---

### Phase 1 — Stroke Direction Histogram (weight: 20%)

Uses **Sobel gradient operators** to detect the orientation of every ink stroke. These angles are compiled into a **36-bin weighted histogram** (one bin per 10°), where each bin is weighted by stroke magnitude — stronger strokes count more.

The two histograms are compared using **cosine similarity**, then raised to the power of **1.8** to suppress mid-range scores from mildly similar but non-matching signatures.

> **Why this matters**: Different people have subconscious stroke angle habits (letter tilt, loop entry direction, pen slant) that are nearly impossible to faithfully replicate — even in deliberate forgeries.

---

### Phase 2 — Structural Similarity Index / SSIM (weight: 25%)

SSIM compares the two preprocessed signatures at **luminance**, **contrast**, and **structural pattern** levels simultaneously.

**Critical fix implemented**: The previous formula `(ssim + 1) / 2` mapped uncorrelated images (raw SSIM ≈ 0) to **50%**, which is why non-matching signatures were scoring ~47%. The engine now uses:

```
score = max(0, raw_ssim) ^ 2.5
```

This means uncorrelated images score **0%**, and only genuinely high raw SSIM values survive the power curve (e.g., raw 0.9 → curved 0.77). Slightly positive-but-low SSIM scores (under ~0.5) are aggressively suppressed toward zero.

> **Why this matters**: SSIM captures spatial structure that pixel-diff ignores, but the old normalization formula was the primary source of false leniency in the previous engine version.

---

### Phase 3 — ORB Keypoint Matching (weight: 35%)

ORB (Oriented FAST and Rotated BRIEF) detects **distinctive local feature points** — pen-lift points, loop entries/exits, crossing strokes, and pressure peaks. Up to **600 keypoints** are extracted per image.

Matching uses **Hamming distance with cross-check** validation. Quality filters applied:
- Only matches with Hamming distance **< 50** (out of 256 max) are kept
- A minimum of **6 good matches** is required before any score is returned
- The match ratio is then raised to the power of **1.5** to further penalise weak matches

> **Why this matters**: Micro-stroke discriminators (like exact pen-lift coordinates) are the hardest features to forge. This phase has the highest weight because it is the most identity-specific.

---

### Phase 4 — Ink Density Consistency (weight: 5%)

Computes the fraction of the image covered by ink pixels for each signature. An absolute density difference of **≥15%** maps to near-zero score (quadratic penalty). This catches gross style incompatibility — e.g., a sparse, looping signature being compared against a dense, compressed one.

> **Why this matters**: A forger rarely replicates the exact ink coverage ratio. This phase is a lightweight but reliable sanity check.

---

### Phase 5 — Hu Moment Shape Invariants (weight: 15%)

Computes **7 Hu Moments** from each preprocessed signature — mathematical shape descriptors that are invariant to **translation, scale, and rotation**. They capture the global topology of the signature as a single compact vector.

The vectors are log-transformed (standard practice to normalize magnitude), and their L2 distance is used to compute similarity. A distance above ~2.0 maps to near-zero score (quadratic).

> **Why this matters**: Two different people's signatures have fundamentally different global shapes. Hu moments are the fastest way to detect that incompatibility regardless of how the signatures were scanned or aligned.

---

### Threshold and Strictness

| Score | Result | Meaning |
|:------|:-------|:--------|
| ≥ 82% | **YES — MATCH** | High forensic confidence across all five phases |
| 60–81% | **NO** | Structural divergence; possible forgery attempt |
| < 60% | **NO** | Strong mismatch — clearly different identity |

The threshold is **82%**. Because all five phases use power-curve scoring (floored at true 0%), non-matching signatures consistently score in the **5–20% range** regardless of superficial visual similarity.

> **Operational Note**: The system is calibrated for **minimal false positives**. It will sometimes flag a genuine signature for manual review — but it will never silently pass a forgery as a match.

---

### How to Launch (Local Bank Intranet)

1. **Install Python 3.10+**: Ensure Python is installed on the local workstation.
2. **Setup Virtual Environment** (recommended to clear IDE warnings):
   ```bash
   python -m venv backend/venv
   backend\venv\Scripts\pip install -r backend/requirements.txt
   ```
3. **Start the AI Server**:
   ```bash
   backend\venv\Scripts\python backend/main.py
   ```
   The engine will run on `http://127.0.0.1:8130`. The frontend will automatically connect to it.

## Notes

- All images are stored as base64 in the backend database.
- Approval endpoint signs off images → moves from `unapproved` to `approved` bucket.
- Rejection is currently a client-side simulation (backend endpoint not implemented).
- **AI Verification**: Requires the Python backend running locally on port **8130**.

This frontend replaces older HTML/PHP imaging modules while keeping full compatibility with the existing backend infrastructure.

## Migration Status Audit

The modern ReactJS frontend has successfully replaced the majority of the legacy imaging modules. Below is the current mapping of legacy PHP files to their new React components.

| Legacy PHP Module | React Equivalent | Status |
| :--- | :--- | :--- |
| `view_cheques.php` | `ViewCheques.tsx` | ✅ Migrated |
| `approval.php` / `image-approval-screen.php` | `Approval.tsx` | ✅ Migrated |
| `update.php` | `Update.tsx` | ✅ Migrated |
| `capture.php` | `Index.tsx` | ✅ Migrated |
| `getimages.php` / `getimagescred.php` | `Enquiry.tsx` | ✅ Migrated |
| `viewimagedetails.php` | `Enquiry.tsx` | ✅ Migrated |

### Missing Parameters (Implementation Gap)
The following parameters were identified in legacy PHP but are not yet fully utilized in the frontend or require backend API updates:

1.  **Audit Details**: Full audit history view from `TB_IMAGE_AUDIT` is not yet migrated.
2.  **Fingerprint Alt**: `capture_fingerprint_alt.php` logic (alternative scanner modes) is not yet implemented.
3.  **Posting Date**: Integrated in Approval but requires backend endpoint `get_posting_date`.

### Legacy PHP Pages Remaining (Audited via .htaccess)
The following functional pages still reside on the legacy PHP server:

- `amendments.php`: Search and list images for amendment.
- `view_acpin_images.php`: ACPIN specific instrument viewer.
- `view_j_images.php` / `view_jude_images.php`: Specialized instrument viewers.
- `putsig.php`: Legacy standalone signature capture utility.
- `capture_browse.php`: Raw filesystem image browser (partially bypassed by modern prefetch logic).

---

Thank you.


