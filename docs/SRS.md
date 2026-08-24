# Syntrix — Software Requirements Specification (SRS)

## 1. System Architecture
Syntrix is structured as a **6-Tier Layered Architecture with MVC and Dedicated Service Layer**:
`Client (React 19 SPA) → NGINX Reverse Proxy → Routes & Middleware Guards → Controllers → Services (Business Logic) → Repositories / Prisma ORM → MariaDB & Redis`

---

## 2. Functional Requirements (FR)

### FR-01: Authentication & Identity
- System must hash passwords using `bcrypt` (work factor 10+).
- System must issue short-lived JWT Access Tokens (15m) and long-lived Refresh Tokens (7d).
- System must automatically detect refresh token reuse, revoke the entire token lineage, and block compromised sessions.

### FR-02: Multi-Tenancy & Authorization
- Every organization must be partitioned by unique `organizationId`.
- Access to organization resources must verify `findOrgMember` membership.
- RBAC permissions must be validated through explicit permission matrices (`permissions.ts`).

### FR-03: Kanban & Task Pipeline
- Tasks must have sequential numeric keys per project (e.g. `SYN-104`).
- Card position must support floating-point fractional index ordering (`position: Float`).
- Task drag-and-drop state must update optimistically in React state before syncing with `PATCH /tasks/:taskId/move`.

### FR-04: Task Dependencies & Cycle Detection
- Task relationships support `BLOCKS`, `BLOCKED_BY`, and `RELATES_TO`.
- The system must traverse dependency chains using DFS to reject circular dependency loops before insertion.

### FR-05: File Upload & Binary Verification
- Uploads are capped at 10MB per file.
- Disallowed script extensions (`.exe`, `.sh`, `.bat`, `.php`, `.js`, `.html`) must be rejected.
- Files must undergo binary magic byte verification (PNG, JPG, PDF, ZIP, WebP).
- Direct static file access is disallowed; downloads require authenticated tenant checks.

---

## 3. Non-Functional Requirements (NFR)

### NFR-01: Performance & Latency
- Response compression (`compression`) must be active for all responses > 1KB.
- API endpoints must maintain execution latency < 50ms.
- High-volume task queries must support cursor-based pagination.

### NFR-02: Security & Transport
- HTTP security headers (`nosniff`, `DENY`, `HSTS`, `COOP`, `CORP`) enforced via Helmet.
- CORS policy restricted to whitelist client domains.
- CSRF verification middleware active on all state-changing endpoints.

### NFR-03: Reliability & Availability
- Node server must handle `SIGTERM` / `SIGINT` with graceful teardown.
- System must provide `/health` and `/ready` endpoints for container orchestration probes.
- BullMQ workers and Redis operations must fall back to in-process resilient handlers when Redis is offline.
