# Technical Proposal: Standalone Banking Biometric Onboarding & Management Suite

**Prepared For**: Executive Management & Bank Operations  
**Project Name**: Biometric Glide Standalone Extension  
**Status**: Technical Draft  
**Date**: May 30, 2026  

---

## 1. Executive Summary

Our current Biometric Imaging System operates hand-in-hand with our Core Banking suite (**x100**). While this tight integration has served us well, it creates a hard dependency: our biometric capture, search, approval, and enquiry services cannot function independently or easily link with other bank systems, CRMs, or third-party suites without manual development or complex direct database connections.

This proposal outlines the strategy to transition our biometric system into a **fully standalone platform**. The standalone system will maintain its core focus: **capturing, linking, and managing high-quality customer biometric records** (photos, signatures, ID documents, and fingerprints). It will allow tellers to manually input accounts and signatory relations from any external software system and secure them locally.

Most importantly, our proposed design implements a **Dual-Mode Coexistence Architecture** which ensures **100% backward compatible** operation. The system will continue to work flawlessly with our existing x100 Core Banking suite without requiring any code changes on the x100 side, while opening up the capabilities to serve as a secure centralized biometric registry for any other software application in the bank.

---

## 2. Business Objectives & Benefits

* **Zero Operational Disruption**: Complete backward compatibility ensures that our daily x100 teller flows are unaffected. Tellers can use the new standalone dashboard for UAT/non-x100 customers while using the existing integrated flow for regular customers.
* **Intranet Freedom & Vendor Independence**: Decoupling the front-end capture logic from core banking database views allows the biometric suite to remain highly resilient even if the core banking database goes offline.
* **Unified Centralized Registry**: The system will serve as a single, centralized intranet registry for all customer biometrics (signatures, photos, fingerprints, and ID scans), accessible via secure APIs by any bank application (e.g., mobile banking backend, teller cash withdrawal modules, or loan processing systems).
* **Auditability & Compliance**: Simplified tracking of who captured and who approved standalone biometrics, ensuring complete AML/KYC regulatory alignment.

---

## 3. The Dual-Mode Coexistence Architecture

Instead of developing a separate standalone application—which would double maintenance overhead—we will implement a **Unified Data Retrieval Layer** in the PHP backend.

```
                  [ Biometric Glide Front-End ]
                               │
                               ▼
               [ PHP Unified Data Retrieval Layer ]
                               │
             ┌─────────────────┴─────────────────┐
             ▼ (1st Check)                       ▼ (2nd Check - Fallback)
   [ Local PostgreSQL DB ]              [ Oracle Core Banking DB ]
   (Standalone Accounts/Relations)      (x100 Views & Packages)
```

1. **Integrated x100 Mode**: Tellers opening a client through standard x100 URL parameters will be routed automatically. The API will query the Oracle core banking database.
2. **Standalone Mode**: Tellers opening the new "Standalone Setup" dashboard will manually type the Account Number and its corresponding Relation Numbers and Names retrieved from any external software. The system saves this metadata locally. 
3. **Automated Query Routing**: When fetching customer metadata, the backend will first check our local PostgreSQL tables. If found, it serves it. If not found, it falls back to the Oracle core banking view. This makes our biometric capture and review screens **100% reusable** for both modes.

---

## 4. Technical Design Details

### A. Local Metadata Schema (PostgreSQL)
We will introduce two lightweight, indexed tables in our local PostgreSQL database to store standalone metadata. This keeps the metadata closely coupled with the raw base64 binaries (photos, signatures, and ID PDFs) already stored in our database.

```sql
-- Stores account type, categories, and mandate instructions
CREATE TABLE PUBLIC.TB_STANDALONE_ACCOUNTS (
    account_number VARCHAR(50) PRIMARY KEY,
    account_category VARCHAR(100) NOT NULL, -- e.g., Joint, Shareholder, Individuals, Corporate, etc.
    mandate VARCHAR(500) NOT NULL,          -- e.g., Sole Signatory, Any two to sign, etc.
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Stores signatory relation numbers, limits, names, and signing levels
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

### B. Setup Dropdowns & Input Fields
The standalone setup interface will constrain entries to our exact business rules to guarantee uniform data standards across all teller points:

1. **Account Category Options**:
   * Joint
   * Shareholder
   * Individuals
   * Shareholder Related
   * Director
   * Director Related
   * Staff Related
2. **Account Mandates**:
   * Sole Signatory
   * Any two to sign
   * All Three to sign
   * Either to Sign
   * Both to Sign
3. **Signatory Levels (Relation Category)**:
   * Category A
   * Category B
   * Category C
   * Category D

### C. New Frontend Administration Dashboard
We will add a beautiful, premium **Standalone Setup & Management Dashboard** in the React application:
* **Biometric Status Matrix**: Displays a clear visual matrix for each relation under an account, showing whether their Photo, Signature, ID scanned documents, or Fingerprints have been successfully captured and approved.
* **Biometric Onboarding Launcher**: Tellers can click "Capture Biometrics" next to a signatory's name to automatically launch the unified 4-step biometric onboarding flow.

---

## 5. Project Roadmap & Delivery Phases

We estimate the project can be safely completed and verified in four focused phases:

| Phase | Description | Key Deliverables | Estimated Duration |
| :--- | :--- | :--- | :--- |
| **Phase 1: DB & API** | Initialize PostgreSQL standalone tables and write the new `save_standalone_account.php` API. | SQL Migration Script, Save API | 3 Days |
| **Phase 2: Fallback Layer** | Modify existing backend endpoints (`get-acc-details`, `getcustomers`, `img_enquiry`, etc.) to support local lookup + Oracle fallback. | Updated PHP Backend APIs | 5 Days |
| **Phase 3: React Setup** | Create the premium "Standalone Setup & Management Dashboard" in the React client and update routing. | Dashboard UI, Gateway Updates | 5 Days |
| **Phase 4: QA & Sign-Off** | Perform end-to-end sandbox testing of both standalone captures and backward-compatible x100 captures. | Walkthrough Report, Final Deployment | 4 Days |

**Total Estimated Duration**: Approximately 17 working days.

---

## 6. Recommendations & Next Steps

This project will modernize our branch onboarding capability, transforming our biometric solution from a core banking dependency into an independent enterprise asset.

**Recommended Action**:
1. Gain executive approval on this technical approach.
2. Initialize database changes in the UAT / testing environment.
3. Authorize our UAT team and developers to begin the Phase 1 database and PHP save implementations.
