# VigiThink eTMF — Enterprise MongoDB Architecture

## Overview
**VigiThink eTMF** operates on a **100% NoSQL MongoDB Document Architecture**. All clinical trial data, 21 CFR Part 11 audit trails, DIA TMF Reference Model v3.1 taxonomies, user roles, workflows, and document metadata are stored as native BSON documents. 

There are **zero SQL or relational database dependencies** in this platform.

---

## Technical Specifications
- **Database Engine:** MongoDB 6.0+ / 7.0+
- **Storage Engine:** WiredTiger (supports 25-year immutable GxP digital archiving)
- **Object Data Modeling (ODM):** Mongoose 8.x
- **Primary Data Directory:** `server/data/db`
- **Default Connection URI:** `mongodb://127.0.0.1:27017/vigithink_etmf` (with automatic embedded persistent MongoDB failover)

---

## Native MongoDB Collections

| Collection Name | Mongoose Model | Purpose & Compliance Scope |
| :--- | :--- | :--- |
| `users` | `User` | 9 Industry roles, salted bcrypt hashed passwords, study/country/site 4D scoping |
| `studies` | `Study` | Clinical study protocols, phases, participating countries, investigational sites |
| `documents` | `Document` | 11 DIA zones, 11-stage regulatory lifecycle, SHA-256 hashes, concurrency checkout locks |
| `auditlogs` | `AuditLog` | Append-only immutable 21 CFR Part 11 electronic audit trail records with user IP & timestamp |
| `queries` | `Query` | QC inspection defects, ALCOA+ compliance queries, investigator remediation responses |
| `milestones` | `Milestone` | Clinical trial milestone schedules, binding artifact IDs, planned vs actual dates |
| `folders` | `Folder` | User custom repository subfolders and site folder trees |

---

## Clean-Slate Production Mode
In production clean-slate mode:
1. `studies` collection begins with **0 records**.
2. `documents` collection begins with **0 records**.
3. The **System Administrator** (`admin@vigithink.com`) creates live clinical trials, configures investigational sites, and provisions student credentials via the UI.
4. All database operations execute through RESTful Express API routes backed by Mongoose document operations.

---

## Commands
- **Run Seeder / Migration Check:**
  ```bash
  node database/seed_mongodb.js
  ```
- **Inspect Seed JSON Dataset:**
  ```bash
  cat database/seed_data.json
  ```
- **Inspect Schemas:**
  ```bash
  cat database/schemas/mongo_schemas.js
  ```
