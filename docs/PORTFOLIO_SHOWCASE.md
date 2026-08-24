# Syntrix — Portfolio & Resume Showcase Guide

## 1. High-Impact Resume Bullet Points

### Full-Stack / Backend Engineering Highlights:
- **Architected and built Syntrix**, a production-grade multi-tenant collaboration platform with a 6-tier MVC + Service Layer architecture in TypeScript, Node.js, Express, Prisma ORM, and MariaDB.
- **Implemented real-time 60fps Kanban board drag-and-drop** with native HTML5 drag events, optimistic React state updates, and asynchronous `PATCH` sync with automatic rollback on network failure.
- **Engineered an enterprise security layer** featuring JWT token family rotation, reuse attack detection, strict Helmet HTTP headers, CORS origin verification, and binary magic-byte file signature validation.
- **Optimized database and query execution latency to <50ms** using compound Prisma indexing, cursor-based seek pagination, Gzip response compression, and a resilient Redis cache-aside engine.
- **Built Directed Acyclic Graph (DAG) task dependency engine** with cycle detection algorithms preventing circular blocking states across complex project roadmaps.
- **Containerized entire multi-service stack with Docker Compose and NGINX**, configuring health checks, zero-downtime reverse proxies, static asset caching, and automated GitHub Actions CI/CD.

---

## 2. System Architecture & Technical Trade-Offs (Interview Q&A)

### Q: Why MVC + Service Layer instead of pure Controller-Repository?
**A:** In enterprise multi-tenant systems, business logic often spans multiple entities (e.g. creating a task creates an activity log entry, checks DAG cycles, updates sprint point totals, and invalidates Redis cache keys). Putting this in controllers violates separation of concerns and leads to fat, untestable controllers; putting it in repositories couples database queries with orchestration. A dedicated Service Layer decouples business transactions from HTTP transport and database drivers.

### Q: How is Multi-Tenant Data Isolation Guaranteed?
**A:** Every database query in Syntrix filters on `organizationId`. The `orgAuth` guard and `AttachmentService` verify organization membership via `findOrgMember` before executing mutations, preventing horizontal privilege escalation and cross-tenant data leakage.

### Q: How does Optimistic UI update work on Kanban Drag & Drop?
**A:** When a card is dragged from "In Progress" to "Done", React column state instantly transitions the card and displays a micro-animation. In parallel, a background `PATCH /tasks/:id/move` request is dispatched. If the network call fails, the client catches the error, displays an error toast, and reverts the card to its original position without UI jitter.

### Q: How does Syntrix handle Redis Downtime?
**A:** Syntrix implements a **graceful degradation pattern**: the Redis client listens for error/disconnect events without crashing the Node process. When Redis is offline, the cache-aside engine transparently queries the primary database and BullMQ tasks execute in-process via fallback worker handlers.

---

## 3. 5-Minute Live Video Demo Script

1. **Minute 0:00 - 1:00: Overview & Warm Sand Design System**
   - Introduce Syntrix's brand palette (Warm Sand `#F5F3EB`, Warm Amber `#F5AE4D`, Charcoal `#20201D`).
   - Showcase Workspace Switcher, Organization KPI Analytics, and Activity Timeline.
2. **Minute 1:00 - 2:30: Interactive Kanban & Drag-and-Drop**
   - Navigate to Project Board (`SYN`).
   - Demonstrate dragging a task card between columns with optimistic UI updates and drop indicators.
   - Open Task Modal: show markdown descriptions, labels, assignees, and DAG dependencies.
3. **Minute 2:30 - 3:30: Sprints & Agile Velocity Analytics**
   - Open Sprints view: show active sprint, point estimation, and dynamic SVG burndown chart.
4. **Minute 3:30 - 4:15: Security & File Upload Scanning**
   - Demonstrate attachment uploads: magic byte binary verification, malware extension rejection, and authenticated secure downloads.
5. **Minute 4:15 - 5:00: Production DevOps & Test Matrix**
   - Highlight Swagger `/api-docs` interactive documentation, Docker container orchestration, and 27 automated Vitest unit/component/benchmark tests passing in <2.2s.
