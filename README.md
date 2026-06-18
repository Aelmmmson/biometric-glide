# Banking Biometric Imaging System (Frontend)

A modern React + TypeScript web application for customer biometric onboarding, update, enquiry, and approval workflows in a banking environment.

This system integrates with a legacy PHP backend (`http://10.203.14.169/imaging/...`) and supports real-time capture of photos, signatures, identification documents, and fingerprints.

## Features

- Multi-step biometric capture (Photo → Identification → Fingerprint → Review & Submit)
- Real-time saving to backend on every capture (no data loss on page refresh)
- Update mode for existing customers
- Approval dashboard for supervisors
- Enquiry / View-only mode via customer ID or encrypted account credential
- Image editing (crop/rotate/brightness) before final save
- Signature pad (SigWeb tablet) support
- Fingerprint scanner integration (Digital Persona / SecuGen devices via backend API)
- Responsive UI built with shadcn/ui + Tailwind CSS

## URL Access Patterns (Strict Validation)

The system enforces strict URL patterns to maintain compatibility with legacy routing. The main application is typically accessed via the `/imaging/` prefix.

| Purpose | URL Pattern & Example | Component |
| :--- | :--- | :--- |
| **Capture Phase** | `/imaging/capture-[RELATION]-[BY]-[YYYY-MM-DD]`<br>Ex: `/imaging/capture-123456-admin-2024-04-21` | `Index.tsx` |
| **Update Phase** | `/imaging/update-[REL-BATCH-MANDATE-LIMIT-BY-DATE]`<br>Ex: `/imaging/update-123456-B001-M1-50000-admin-2024-04-21` | `Update.tsx` |
| **Approval** | `/imaging/image_approval_screen-[REL-BATCH-CUST-BY-HOST-IP]`<br>Ex: `/imaging/image_approval_screen-123456-B001-C001-supervisor-PC-10.0.0.1`<br>Note: Batch can be empty (e.g., `...screen-123456--C001...`) | `Approval.tsx` |
| **Relation Enquiry** | `/imaging/viewimage-[RELATION_NO]` or `/viewimage-[RELATION_NO]`<br>Ex: `/imaging/viewimage-000123` | `Enquiry.tsx` |
| **Credential Enquiry** | `/imaging/getimagescred-[CREDENTIAL]` or `/getimagescred-[CREDENTIAL]`<br>Ex: `/imaging/getimagescred-ABC123XYZ` | `Enquiry.tsx` |
| **Account Enquiry** | `/imaging/getimages-[ACCOUNT_NO]` or `/getimages-[ACCOUNT_NO]`<br>Ex: `/imaging/getimages-123456` | `Enquiry.tsx` |
| **View Cheques** | `/imaging/view_cheques-[CHQNO]` or `/view_cheques-[CHQNO]`<br>Ex: `/imaging/view_cheques-005001` | `ViewCheques.tsx` |
| **System Config** | `/imaging/stepconfig`<br>Ex: `http://localhost:8089/imaging/stepconfig` | `StepConfigurationPage.tsx` |

> [!IMPORTANT]
> **Date Format**: The `YYYY-MM-DD` format is strictly enforced for Capture and Update routes. Invalid dates (e.g., month 13 or day 32) will trigger a 404 error page.

### Automatic Routing (Gateway)
The `Gateway.tsx` component acts as an intelligent router. It parses the URL parameters and automatically renders the correct page based on the pattern detected. If a URL is malformed (e.g., missing a segment or using an invalid date), it will display a detailed 404 page explaining the expected structure and providing an example.

## Required Hardware / Devices

| Feature             | Device / Requirement                                 | Notes |
|---------------------|-------------------------------------------------------|-------|
| Photo               | Webcam (built-in or USB)                              | Auto fallback to file upload |
| Signature           | Topaz SigWeb tablet (or any SigWeb-compatible)       | Uses SigWeb SDK (loaded via script in `SigWebTablet.ts`) |
| Fingerprint         | Suprema   | Backend PHP service must be running and device connected to teller PC |
| Document scanning   | Flatbed scanner or mobile camera upload               | Upload mode always available |

## Backend API Base (Internal Network Only)

```
http://10.203.14.169/imaging/
```

All API calls are made from the frontend directly to this legacy server. No proxy or CORS issues in production (same intranet).

## Project Structure (Key Files)

```
src/
├── pages/
│   ├── Index.tsx          → Main capture flow (steps 1–4)
│   ├── Approval.tsx       → Supervisor approval interface
│   ├── Enquiry.tsx        → View-only customer images
│   ├── ViewCheques.tsx    → Cheque detail report presentation
│   ├── Gateway.tsx        → URL router based on path
│   └── Update.tsx         → Update mode wrapper
├── components/
│   ├── PhotoSignature.tsx → Step 1: Photo + Signature capture
│   ├── Identification.tsx → Step 2: ID documents (National ID, Passport, etc.)
│   ├── Fingerprint.tsx    → Step 3: Right & left thumb capture
│   └── ImageEditor.tsx    → Crop/rotate/brightness editor
├── services/api.ts        → All backend API wrappers + URL parsing utils
├── contexts/BiometricContext.tsx → Global state for multi-step form
└── lib/SigWebTablet.ts    → SigWeb tablet integration
```

## Local Development

```bash
# Clone and install
git clone <your-repo>
cd project-name
npm install

# Start dev server
npm run dev
```

The app will run on `http://localhost:8089`

For full functionality (fingerprint/signature tablet):
- Run on the actual teller machine where devices are connected
- Backend imaging service must be reachable at `10.203.14.169`


## Allow Camera Access
chrome://flags/#unsafely-treat-insecure-origin-as-secure

Add URL to existing paths and relaunch
Note this only works on chrome, brave and not mozilla

## Deployment

The app is a static Vite + React SPA. Deploy to any static host (Vercel, Netlify, Cloudflare Pages, etc.).

No server-side rendering required.

## Technologies

- React 18 + TypeScript
- Vite
- TanStack Query (React Query)
- shadcn/ui components
- Tailwind CSS
- Framer Motion
- Lucide Icons
- Zustand-like context for multi-step state

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

Thank you.


How to Run The Application
To run this application, follow the steps below:

1. Start the Backend API
First, ensure you have the Python backend running locally on port 8130:

Copy code

backend\venv\Scripts\python backend/main.py
The backend will start and serve the AI Signature Verification Engine on http://127.0.0.1:8130.

2. Start the Frontend Application
Open a new terminal, navigate to the frontend directory, and run:

Copy code

npm run dev
The frontend will start on http://localhost:8089.

3. Access the Application
Open your browser and navigate to http://localhost:8089.

Usage Examples
Capture Mode: Navigate to http://localhost:8089/imaging/capture-123456-admin-2024-04-21
Update Mode: Navigate to http://localhost:8089/imaging/update-123456-B001-M1-50000-admin-2024-04-21
Approval: Navigate to http://localhost:8089/imaging/image_approval_screen-123456-B001-C001-supervisor-PC-10.0.0.1
Enquiry: Navigate to http://localhost:8089/imaging/viewimage-000123
Note: Ensure the backend is running before accessing any of these routes.

