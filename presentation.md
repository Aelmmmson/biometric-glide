# Slide Deck: Standalone Banking Biometric Extension

---

## Slide 0: Cover Slide
### Biometric Glide — Standalone Extension
* **Subtitle**: Transforming a core dependency into an independent enterprise asset — with zero disruption.
* **Key Metrics**:
  * **17** Working Days to Delivery
  * **4** Implementation Phases
  * **0** x100 Core Banking Code Changes
* **Onboarding Freedom**: Focus strictly on secure biometric storage.

---

## Slide 1: Executive Summary
### The Case for Freedom
* **The Problem**: Current biometric services are hard-locked to x100 core banking database tables. If core banking is offline, tellers cannot capture or verify customer biometrics.
* **The Solution**: Transition into a standalone biometric platform.
  * Tellers manually input existing account and relation numbers from any CRM or core system.
  * System saves biometric data (photos, signatures, ID scans, fingerprints) locally.
  * Connects with any internal application (mobile banking, loans, CRM) via secure APIs.

---

## Slide 2: Business Objectives
### Why This Matters Now
1. **Zero Disruption**: 100% backward compatible. Integrated teller flows for x100 remain unchanged.
2. **Vendor Independence**: Decouples capture front-end from core database. Operates even during core outages.
3. **Centralized Biometric Registry**: A single intranet source of truth for photos, signatures, IDs, and fingerprints.
4. **Audit & Compliance**: Standardized tracking of teller capture and supervisor approval actions for AML/KYC.

---

## Slide 3: Dual-Mode Coexistence
### Architecture Overview
* **Unified Data Retrieval Layer**:
  1. Frontend React app requests account/relation details.
  2. Backend PHP API queries **Local PostgreSQL** (1st Check - Standalone Mode).
  3. If local record does not exist, API queries **Oracle Core Banking** (2nd Check - Fallback Mode).
* **Benefit**: Reuses 100% of our highly optimized 4-step biometric onboarding pages.

---

## Slide 4: Database Schema
### PostgreSQL Standalone Tables
* **TB_STANDALONE_ACCOUNTS**:
  * `account_number` (PRIMARY KEY)
  * `account_category` (Joint, Shareholder, Individuals, Shareholder Related, Director, Director Related, Staff Related)
  * `mandate` (Sole Signatory, Any two to sign, All Three to sign, Either to Sign, Both to Sign)
* **TB_STANDALONE_RELATIONS**:
  * `relation_no` (PRIMARY KEY)
  * `account_number` (REFERENCES accounts)
  * `first_name`, `other_name`, `surname`
  * `amtlimit` (NUMERIC)
  * `signatory_level` (Category A, Category B, Category C, Category D)
  * `date_of_birth` (DATE)

---

## Slide 5: Frontend Dashboard
### The Admin Experience
* **Teller Workspace**: A premium interface for register, search, and biometric status monitoring.
* **Biometric Status Matrix**: Real-time visual tracking of biometric completeness for each signatory:
  * Green "Done" badges for captured/approved biometrics.
  * Yellow "Pending" badges for incomplete captures.
* **Onboarding Launcher**: One-click to trigger webcam photo capture, Topaz signature tablet, document scanner, or fingerprint enrollment.

---

## Slide 6: Project Roadmap
### Four Phases to Delivery
* **Phase 1: DB & API Setup** (3 Days)
  * PostgreSQL standalone tables creation & JSON save APIs.
* **Phase 2: Fallback Retrieval Layer** (5 Days)
  * Refactoring retrieval endpoints to run dual-mode checks.
* **Phase 3: React Setup** (5 Days)
  * Standalone Account Dashboard and dynamic routing in React.
* **Phase 4: UAT & QA Sign-Off** (4 Days)
  * Sandboxed verification of standalone entries and core bank fallback.

---

## Slide 7: Recommendation & Actions
### Three Steps. One Decision.
1. **Gain Executive Approval**: Approve the coexistence technical approach to authorize the development team.
2. **Initialize UAT Environment**: Deploy the local PostgreSQL tables and save APIs to UAT testing sandbox.
3. **Authorize Phase 1**: Instruct the engineering team to commence Phase 1 database operations immediately.
