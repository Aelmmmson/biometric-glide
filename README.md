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

## URL Access Patterns
## Examples
- capture = "http://localhost:8089/imaging/capture-52136502"

- approval = "http://localhost:8089/imaging/image_approval_screen-5213650487-202512082003-0204814-UNIONADMIN-WIN-GCCIHDIMBAR-10.10.1.132"

- update = "http://localhost:8089/imaging/update-232"

- enquiry = "http://localhost:8089/imaging/viewimage-52136502"
           "http://localhost:8089/imaging/getimagescred-52136502"
           By Relation No: "http://localhost:8089/imaging/getimages-5213650014".

## !! use new relation numbers



| Purpose                  | URL Example                                | Mode      | Notes |
|--------------------------|--------------------------------------------|-----------|-------|
| Capture new customer     | `/imaging/capture-123456`                  | Capture   | `123456` = relation number |
| Update existing customer | `/imaging/update-123456`                   | Update    | Loads existing images |
| Approval dashboard       | `/imaging/approve?relationno=123456&batch=...` | Approval  | Full params required from backend |
| Enquiry (by relation)    | `/imaging/getimagescred-ABC123XYZ`         | View-only | Encrypted credential |
| Enquiry (by customer ID) | `/imaging/viewimage-232`                   | View-only | Legacy path |

The gateway component (`Gateway.tsx`) automatically routes based on the path format.

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

## Notes

- All images are stored as base64 in the backend database.
- Approval endpoint signs off images → moves from `unapproved` to `approved` bucket.
- Rejection is currently a client-side simulation (backend endpoint not implemented).

This frontend replaces older HTML/PHP imaging modules while keeping full compatibility with the existing backend infrastructure.

