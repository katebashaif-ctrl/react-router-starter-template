# Cloudflare R2 Production Synchronization & Storage Engine

Make the Cloudflare R2 cloud storage integration in the CMS production-ready, persistently configured on disk, and seamlessly synchronized in real-time across catalog changes and media uploads.

## User Review & Critical Decisions

> [!IMPORTANT]
> The following architectural decisions were confirmed by the user in Phase 1:

- **Confirmed Decision 1 (Credential Persistence)**: Store Cloudflare R2 credentials (Account ID, Access Key ID, Secret Access Key, Bucket name, and Public Domain) directly in the CMS with persistent server-side disk storage (`data/r2-config.json`) so settings survive server restarts and production redeployments.
- **Confirmed Decision 2 (Sync Triggering)**: Implement real-time automatic synchronization to Cloudflare R2 on every product creation, update, and deletion, paired with an instant manual sync trigger and live latency test in the CMS.
- **Confirmed Decision 3 (Image Delivery & CDN)**: Serve product image URLs via Cloudflare R2 custom public domain with automatic local file fallback (`/images/...`) whenever remote connectivity is unavailable.

---

## 1. Overview & Core Concept

- **What It Does**: Upgrades the CMS Cloudflare R2 storage module from an in-memory test implementation into a production-grade, highly available asset and catalog sync engine. It ensures that the product catalog (`data/store.json`), settings, and media assets in R2 remain in lockstep with the storefront at all times.
- **Target Audience / Persona**: Store administrators, inventory managers, and marketing coordinators who manage products, prices, stock levels, and marketing media across web and Meta ad channels.
- **Key Value**: Guarantees zero data loss, instant multi-region asset delivery via Cloudflare's global edge network, and removes the risk of out-of-sync catalog feeds.

---

## 2. User Experience & Visual Design

- **Key User Flows**:
  1. *Connection & Status Verification*: The administrator navigates to **CMS > R2 Cloud Storage**. A prominent live status header displays real-time connection state (`Connected · Synced` with green status dot vs. `Not Configured` with amber alert), total remote assets count, and active bucket identifier.
  2. *One-Click Test & Auto-Save*: Entering credentials in the form auto-validates against Cloudflare R2 S3 API via `aws4fetch`. On success, configuration is saved persistently to `data/r2-config.json` and a confirmation toast appears.
  3. *Zero-Effort Automatic Synchronization*: When a product is modified, added, or deleted in the catalog tab, a background worker automatically publishes the updated catalog payload to `data/store.json` on Cloudflare R2 with no manual intervention required.
  4. *Manual Force Sync*: An instant "Sync Now" button allows manual catalog re-push with a visual loading spinner, latency metric in milliseconds, and status report.
- **Visual Identity & Theme**:
  - *SaaS Admin Palette*: Deep charcoal borders (`#E8DCCB` / `border-stone-200`), warm parchment backgrounds (`#FAF7F2` / `#F5EFE6`), crisp white card containers, and emerald accents (`#16A34A`) for operational telemetry.
  - *Tabular Precision*: All latency timings, timestamp records, and asset count metrics are formatted with `font-mono tabular-nums`.
  - *Zero-Pill Discipline*: Unboxed status metadata with clean middle-dot separators (`·`).

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: File-System Credential Persistence (`data/r2-config.json`)**:
  - *Chosen Approach*: Persist active R2 configuration to a local JSON config file that merges with `process.env` on server startup.
  - *Why*: In containerized and serverless environments, in-memory variables reset on cold starts. File-backed persistence ensures that credentials saved via the CMS UI remain active permanently.
  - *Alternatives Considered*: Pure environment variables (inflexible for non-technical admins) vs. in-memory only (loses state on restart).
- **Decision 2: Dual-Strategy Image Serving (Custom Domain + Local Fallback)**:
  - *Chosen Approach*: If `publicUrl` is configured (e.g. `https://media.teenliwa.ae`), images resolve directly to Cloudflare's high-speed CDN. If an image has not yet been uploaded to R2 or the client is offline, it gracefully falls back to the local `/images/...` directory.
  - *Why*: Eliminates broken image placeholders and guarantees 100% storefront availability regardless of network hiccups.
- **Decision 3: Non-Blocking Real-Time Background Synchronization**:
  - *Chosen Approach*: When an admin modifies a product in the CMS, the local state and D1/JSON update immediately (0ms UI latency), while a non-blocking asynchronous call dispatches the updated catalog to Cloudflare R2.
  - *Why*: Prevents slow network calls to external cloud APIs from freezing the admin interface while keeping remote storage up to date.

---

## 4. Technical Architecture & Data Strategy

```
┌─────────────────────────────────────────────────────────────┐
│                 CMS Admin Dashboard                         │
│  ┌─────────────────────────┐   ┌─────────────────────────┐  │
│  │   R2 Cloud Sync Tab     │   │   Product Inventory     │  │
│  │  - Live Status & Ping   │   │  - Add / Edit / Delete  │  │
│  │  - Credential Form      │   │  - Stock & Price Tuning │  │
│  │  - Instant Sync Button  │   └────────────┬────────────┘  │
│  └────────────┬────────────┘                │               │
└───────────────┼─────────────────────────────┼───────────────┘
                │ HTTP POST /api/r2           │ (triggers auto-sync)
                ▼                             ▼
┌─────────────────────────────────────────────────────────────┐
│            Backend Router & Endpoints                       │
│  app/routes/api.r2.ts ──> app/backend/enterpoints/r2...     │
│                            │                                │
│                            ▼                                │
│               app/backend/apis/r2Api.ts                     │
│               app/backend/endpoints/r2Endpoint.ts           │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ 1. Load config from data/r2-config.json               │  │
│  │ 2. Authenticate via aws4fetch (S3 v4 signature)       │  │
│  │ 3. Dispatch data/store.json to Cloudflare R2 Bucket   │  │
│  │ 4. Fallback gracefully to local catalog on error      │  │
│  └─────────────────────────┬─────────────────────────────┘  │
└────────────────────────────┼────────────────────────────────┘
                             │ HTTPS (TLS 1.3)
                             ▼
┌─────────────────────────────────────────────────────────────┐
│                 Cloudflare R2 Bucket                        │
│  - Endpoint: https://<account_id>.r2.cloudflarestorage.com  │
│  - Object: data/store.json (Live store catalog & settings)  │
│  - Prefix: products/ (Media library images & assets)        │
│  - Custom Public Domain: https://<custom_domain>            │
└─────────────────────────────────────────────────────────────┘
```

### Data Model & State Strategy

- **R2 Config Schema (`data/r2-config.json`)**:
  - `accountId`: Cloudflare Account Hash (e.g. `0b7dc087410628baa1f652ea0fb8bd57`)
  - `accessKeyId`: S3 Access Key ID
  - `secretAccessKey`: S3 Secret Access Key
  - `bucket`: Bucket name (e.g. `bt-liwa`)
  - `publicUrl`: Custom domain URL (e.g. `https://pub-xyz.r2.dev` or custom branded domain)
  - `endpoint`: Calculated R2 S3 endpoint URL
- **Automatic Catalog Sync Payload**:
  - Serializes current active products list, store settings, stock status, and `lastUpdated` timestamp into standard JSON.
  - Pushes to `{endpoint}/{bucket}/data/store.json` with `Content-Type: application/json` and `Cache-Control: no-cache`.

### Interactive Component & State Mapping

- `handleSaveR2Config`: Validates input fields, invokes `/api/r2` with `intent: "save_r2_config"`, persists credentials to `data/r2-config.json`, triggers immediate live connection test, and updates the status badge.
- `handleSyncCatalogToR2`: Dispatches the full catalog to R2, updates `isR2Synced = true`, records sync timestamp, and displays response latency in the UI.
- `StoreContext.tsx`: Whenever `setProducts` or product mutations occur in admin mode, an automated debounced sync call ensures R2 receives the latest catalog snapshot.
- Zero Arabic unicode characters in any `.ts` or `.tsx` file — all localized strings continue to resolve through `cmsT(...)` and `t(...)`.
