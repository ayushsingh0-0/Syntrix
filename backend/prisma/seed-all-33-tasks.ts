import {
  UserRole,
  OrganizationRole,
  TeamRole,
  ProjectRole,
  ProjectStatus,
  ProjectPriority,
  TaskStatus,
  TaskPriority,
  SprintStatus,
  ActivityAction,
} from '../src/generated/prisma/client';
import bcrypt from 'bcrypt';
import prisma from '../src/config/prisma';

async function main() {
  console.log('🚀 Seeding ALL 33 Roadmap Tasks into Syntrix Labs Inc. (Project SYN)...');

  const passwordHash = await bcrypt.hash('Password123!', 10);

  // 1. Five Core Team Members
  const coreUsers = [
    {
      name: 'Ayush Singh',
      email: 'ayush@syntrix.io',
      role: UserRole.ADMIN,
      bio: 'Lead System Architect & Founder — Distributed Systems, Node.js, MariaDB & Redis',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    },
    {
      name: 'Elena Rostova',
      email: 'elena@syntrix.io',
      role: UserRole.MANAGER,
      bio: 'VP of Engineering — Backend Concurrency, Security Architecture & Micro-Queues',
      avatarUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
    },
    {
      name: 'Marcus Vance',
      email: 'marcus@syntrix.io',
      role: UserRole.USER,
      bio: 'Senior Fullstack Engineer — React 19, Optimistic State Sync & 60fps Kanban Motion',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    },
    {
      name: 'Sophia Chen',
      email: 'sophia@syntrix.io',
      role: UserRole.USER,
      bio: 'Staff Product Designer & Design Technologist — Warm Sand Theme & WCAG AA Ergonomics',
      avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    },
    {
      name: 'David Kim',
      email: 'david@syntrix.io',
      role: UserRole.USER,
      bio: 'Lead SRE & Platform Operations — Docker Multi-Stage, NGINX Upstreams & Cloud IaC',
      avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    },
  ];

  const userMap: Record<string, any> = {};
  for (const u of coreUsers) {
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: {
        name: u.name,
        role: u.role,
        bio: u.bio,
        avatarUrl: u.avatarUrl,
        password: passwordHash,
        isEmailVerified: true,
      },
      create: {
        name: u.name,
        email: u.email,
        password: passwordHash,
        role: u.role,
        bio: u.bio,
        avatarUrl: u.avatarUrl,
        isEmailVerified: true,
      },
    });
    userMap[u.email] = user;
  }

  // Also support ayush@syntrix.com
  const ayushCom = await prisma.user.upsert({
    where: { email: 'ayush@syntrix.com' },
    update: {
      name: 'Ayush Singh',
      role: UserRole.ADMIN,
      password: passwordHash,
      isEmailVerified: true,
    },
    create: {
      name: 'Ayush Singh',
      email: 'ayush@syntrix.com',
      password: passwordHash,
      role: UserRole.ADMIN,
      isEmailVerified: true,
    },
  });

  // 2. Organization: Syntrix Labs Inc.
  const org = await prisma.organization.upsert({
    where: { slug: 'syntrix-labs' },
    update: { name: 'Syntrix Labs Inc.' },
    create: {
      name: 'Syntrix Labs Inc.',
      slug: 'syntrix-labs',
      logoUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop&q=80',
    },
  });

  // Ensure Ayush is OWNER
  await prisma.organizationMember.upsert({
    where: { organizationId_userId: { organizationId: org.id, userId: userMap['ayush@syntrix.io'].id } },
    update: { role: OrganizationRole.OWNER },
    create: { organizationId: org.id, userId: userMap['ayush@syntrix.io'].id, role: OrganizationRole.OWNER },
  });
  await prisma.organizationMember.upsert({
    where: { organizationId_userId: { organizationId: org.id, userId: ayushCom.id } },
    update: { role: OrganizationRole.OWNER },
    create: { organizationId: org.id, userId: ayushCom.id, role: OrganizationRole.OWNER },
  });

  const memberRoles = [
    { email: 'elena@syntrix.io', role: OrganizationRole.ADMIN },
    { email: 'marcus@syntrix.io', role: OrganizationRole.MANAGER },
    { email: 'sophia@syntrix.io', role: OrganizationRole.MEMBER },
    { email: 'david@syntrix.io', role: OrganizationRole.MEMBER },
  ];

  for (const mr of memberRoles) {
    await prisma.organizationMember.upsert({
      where: { organizationId_userId: { organizationId: org.id, userId: userMap[mr.email].id } },
      update: { role: mr.role },
      create: { organizationId: org.id, userId: userMap[mr.email].id, role: mr.role },
    });
  }

  // 3. Clear existing projects in Syntrix Labs to keep it strictly 1 clean flagship project
  const existingProjects = await prisma.project.findMany({ where: { organizationId: org.id } });
  for (const p of existingProjects) {
    await prisma.project.delete({ where: { id: p.id } });
  }

  // 4. Create Team
  let team = await prisma.team.findFirst({
    where: { organizationId: org.id, name: 'Syntrix Core Engineering' },
  });
  if (!team) {
    team = await prisma.team.create({
      data: {
        organizationId: org.id,
        name: 'Syntrix Core Engineering',
        description: 'Cross-functional engineering team building the Syntrix platform',
      },
    });
  }

  // 5. Labels
  const labelsData = [
    { name: 'Architecture', color: '#f5ae4d', description: 'Core system structure & MVC layering' },
    { name: 'Backend', color: '#d9963d', description: 'API services & persistence logic' },
    { name: 'Frontend', color: '#719879', description: 'React 19 UI components & state' },
    { name: 'Security', color: '#c96d57', description: 'Auth, magic bytes & penetration' },
    { name: 'Performance', color: '#e0a34c', description: 'Redis caching & indexing' },
    { name: 'DevOps', color: '#817d73', description: 'Docker, NGINX upstreams & CI/CD' },
  ];

  const labelMap: Record<string, any> = {};
  for (const l of labelsData) {
    let label = await prisma.label.findFirst({
      where: { organizationId: org.id, name: l.name },
    });
    if (!label) {
      label = await prisma.label.create({
        data: {
          organizationId: org.id,
          name: l.name,
          color: l.color,
          description: l.description,
        },
      });
    }
    labelMap[l.name] = label;
  }

  // 6. Create SINGLE Flagship Project: "Syntrix" (Key: SYN)
  const project = await prisma.project.create({
    data: {
      organizationId: org.id,
      key: 'SYN',
      name: 'Syntrix',
      description: 'Enterprise multi-tenant agile collaboration platform featuring 6-tier MVC architecture, 60fps drag-and-drop Kanban, Redis cache-aside, BullMQ queues, and deep binary security scanning.',
      status: ProjectStatus.ACTIVE,
      priority: ProjectPriority.URGENT,
      teamId: team.id,
    },
  });

  for (const u of Object.values(userMap)) {
    const isLead = u.email === 'ayush@syntrix.io' || u.email === 'elena@syntrix.io';
    await prisma.projectMember.create({
      data: {
        projectId: project.id,
        userId: u.id,
        role: isLead ? ProjectRole.LEAD : ProjectRole.MEMBER,
      },
    });
  }

  // 7. Board & 5 Columns
  const board = await prisma.board.create({
    data: {
      projectId: project.id,
      name: 'Syntrix Agile Workflow',
      description: 'Primary Kanban board for sprint execution',
      isDefault: true,
    },
  });

  const columnsData = [
    { name: 'Backlog', position: 1, color: '#817D73' },
    { name: 'In Progress', position: 2, color: '#F5AE4D' },
    { name: 'Code Review', position: 3, color: '#D9963D' },
    { name: 'QA & Verification', position: 4, color: '#719879' },
    { name: 'Done', position: 5, color: '#719879' },
  ];

  const colMap: Record<string, any> = {};
  for (const c of columnsData) {
    const col = await prisma.boardColumn.create({
      data: {
        boardId: board.id,
        name: c.name,
        position: c.position,
        color: c.color,
      },
    });
    colMap[c.name] = col;
  }

  // 8. Create 6 Agile Sprints (5 Completed History Sprints + 1 Active Sprint)
  const now = Date.now();
  const day = 24 * 60 * 60 * 1000;

  const s1 = await prisma.sprint.create({
    data: {
      projectId: project.id,
      name: 'Sprint 1: Architecture & Foundation',
      goal: 'Deliver 6-tier MVC+Service architecture, MariaDB schema with Prisma ORM, dual-token JWT rotation, and user profile management.',
      status: SprintStatus.COMPLETED,
      startDate: new Date(now - 45 * day),
      endDate: new Date(now - 35 * day),
      completedAt: new Date(now - 35 * day),
    },
  });

  const s2 = await prisma.sprint.create({
    data: {
      projectId: project.id,
      name: 'Sprint 2: Core Platform & Execution Engine',
      goal: 'Build multi-tenant isolation, cross-functional teams, 60fps Kanban drag-and-drop with optimistic updates, DAG dependency cycle prevention, and sprint management.',
      status: SprintStatus.COMPLETED,
      startDate: new Date(now - 34 * day),
      endDate: new Date(now - 25 * day),
      completedAt: new Date(now - 25 * day),
    },
  });

  const s3 = await prisma.sprint.create({
    data: {
      projectId: project.id,
      name: 'Sprint 3: Real-Time Systems, Queues & Search',
      goal: 'Implement threaded comment discussions with @mentions, modular attachment storage, BullMQ background queues, and multi-domain tenant-isolated global search.',
      status: SprintStatus.COMPLETED,
      startDate: new Date(now - 24 * day),
      endDate: new Date(now - 16 * day),
      completedAt: new Date(now - 16 * day),
    },
  });

  const s4 = await prisma.sprint.create({
    data: {
      projectId: project.id,
      name: 'Sprint 4: Observability, UX & Automated Testing',
      goal: 'Deploy Redis Cache-Aside layer, sliding-window rate limiters, Winston correlation logging, OpenAPI 3.0 Swagger docs, WCAG AA accessibility, and Vitest test matrix.',
      status: SprintStatus.COMPLETED,
      startDate: new Date(now - 15 * day),
      endDate: new Date(now - 8 * day),
      completedAt: new Date(now - 8 * day),
    },
  });

  const s5 = await prisma.sprint.create({
    data: {
      projectId: project.id,
      name: 'Sprint 5: Security Hardening & Performance',
      goal: 'Execute binary magic-byte upload validation, Helmet security headers, CSRF origin verification, compound database index tuning, and cursor-based seek pagination.',
      status: SprintStatus.COMPLETED,
      startDate: new Date(now - 7 * day),
      endDate: new Date(now - 1 * day),
      completedAt: new Date(now - 1 * day),
    },
  });

  const s6 = await prisma.sprint.create({
    data: {
      projectId: project.id,
      name: 'Sprint 6: Production DevOps, Cloud Launch & Portfolio Showcase',
      goal: 'Deliver multi-stage Docker containerization, NGINX reverse proxy with keepalive pooling, GitHub Actions CI/CD, Render IaC, zero-downtime /health/ready probes, and portfolio showcase docs.',
      status: SprintStatus.ACTIVE,
      startDate: new Date(now - 1 * day),
      endDate: new Date(now + 13 * day),
    },
  });

  console.log(`✅ Created 6 Sprints (5 Historical Completed + 1 Active)`);

  // 9. All 33 Complete Roadmap Tasks
  const all33Tasks = [
    // --- Sprint 1 (Completed): Architecture & Auth Foundation (Tasks 1 to 6) ---
    {
      number: 1,
      title: 'Project Inception & Monorepo Tooling Setup',
      description: 'Initialize TypeScript monorepo architecture with npm workspaces (backend & frontend), strict tsconfig compiler options, and code formatting rules.',
      status: TaskStatus.DONE,
      priority: TaskPriority.URGENT,
      column: colMap['Done'],
      sprintId: s1.id,
      assignee: userMap['ayush@syntrix.io'],
      reporter: userMap['elena@syntrix.io'],
      storyPoints: 5,
      hours: 10,
      labels: [labelMap['Architecture'], labelMap['DevOps']],
    },
    {
      number: 2,
      title: 'MariaDB Relational Database Schema & Prisma ORM Modeling',
      description: 'Model 14 core relational entities in Prisma schema with foreign key cascade rules, custom MariaDB driver adapters, and automated schema push pipelines.',
      status: TaskStatus.DONE,
      priority: TaskPriority.URGENT,
      column: colMap['Done'],
      sprintId: s1.id,
      assignee: userMap['ayush@syntrix.io'],
      reporter: userMap['david@syntrix.io'],
      storyPoints: 8,
      hours: 16,
      labels: [labelMap['Architecture'], labelMap['Backend']],
    },
    {
      number: 3,
      title: 'Dual-Token JWT Authentication & Refresh Family Rotation',
      description: 'Implement dual-token authentication: short-lived 15m JWT access tokens in memory and 7-day refresh tokens in httpOnly cookies. Detect reuse attacks and revoke token families immediately.',
      status: TaskStatus.DONE,
      priority: TaskPriority.URGENT,
      column: colMap['Done'],
      sprintId: s1.id,
      assignee: userMap['ayush@syntrix.io'],
      reporter: userMap['elena@syntrix.io'],
      storyPoints: 8,
      hours: 14,
      labels: [labelMap['Security'], labelMap['Backend']],
    },
    {
      number: 4,
      title: 'User Profiles, Bio Avatars & Security Settings',
      description: 'Provide endpoints for managing user profile metadata, bio descriptions, avatar uploads, and secure password updates with bcrypt work factor 10.',
      status: TaskStatus.DONE,
      priority: TaskPriority.HIGH,
      column: colMap['Done'],
      sprintId: s1.id,
      assignee: userMap['marcus@syntrix.io'],
      reporter: userMap['ayush@syntrix.io'],
      storyPoints: 3,
      hours: 8,
      labels: [labelMap['Backend'], labelMap['Frontend']],
    },
    {
      number: 5,
      title: 'Multi-Tenant Organization Isolation & RBAC Matrix',
      description: 'Enforce strict tenant data boundaries on organizationId with fine-grained role permissions (OWNER, ADMIN, MANAGER, MEMBER, GUEST) via orgAuth guard.',
      status: TaskStatus.DONE,
      priority: TaskPriority.URGENT,
      column: colMap['Done'],
      sprintId: s1.id,
      assignee: userMap['elena@syntrix.io'],
      reporter: userMap['ayush@syntrix.io'],
      storyPoints: 8,
      hours: 15,
      labels: [labelMap['Architecture'], labelMap['Security']],
    },
    {
      number: 6,
      title: 'Secure Workspace Invitations & 7-Day Token Acceptance',
      description: 'Build email invitation lifecycle with secure SHA-256 token hashing, 7-day expiration checks, and atomic database transactions on member enrollment.',
      status: TaskStatus.DONE,
      priority: TaskPriority.MEDIUM,
      column: colMap['Done'],
      sprintId: s1.id,
      assignee: userMap['marcus@syntrix.io'],
      reporter: userMap['elena@syntrix.io'],
      storyPoints: 5,
      hours: 10,
      labels: [labelMap['Backend'], labelMap['Security']],
    },

    // --- Sprint 2 (Completed): Core Platform & Execution Engine (Tasks 7 to 12) ---
    {
      number: 7,
      title: 'Cross-Functional Teams & Lead Invariant Architecture',
      description: 'Implement sub-tenant team hierarchies (Core Engineering, Product, SRE) with single LEAD role invariants and team project assignments.',
      status: TaskStatus.DONE,
      priority: TaskPriority.HIGH,
      column: colMap['Done'],
      sprintId: s2.id,
      assignee: userMap['elena@syntrix.io'],
      reporter: userMap['ayush@syntrix.io'],
      storyPoints: 5,
      hours: 11,
      labels: [labelMap['Architecture'], labelMap['Backend']],
    },
    {
      number: 8,
      title: 'Project Workspaces, Key Uniqueness & Archive Lifecycles',
      description: 'Manage project containers with composite unique keys (organizationId, key), project-level member roles, and soft-delete archive workflows.',
      status: TaskStatus.DONE,
      priority: TaskPriority.HIGH,
      column: colMap['Done'],
      sprintId: s2.id,
      assignee: userMap['marcus@syntrix.io'],
      reporter: userMap['ayush@syntrix.io'],
      storyPoints: 5,
      hours: 10,
      labels: [labelMap['Backend']],
    },
    {
      number: 9,
      title: 'React 19 Frontend SPA Foundation & Routing Guards',
      description: 'Configure Vite React 19 SPA with React Router v7, AuthContext, OrgContext, responsive layout sidebars, and Axios token refresh interceptors.',
      status: TaskStatus.DONE,
      priority: TaskPriority.URGENT,
      column: colMap['Done'],
      sprintId: s2.id,
      assignee: userMap['marcus@syntrix.io'],
      reporter: userMap['sophia@syntrix.io'],
      storyPoints: 8,
      hours: 16,
      labels: [labelMap['Frontend'], labelMap['Architecture']],
    },
    {
      number: 10,
      title: 'Kanban Boards, Column Ordering & Float Positioning',
      description: 'Model custom Kanban workflow columns (Backlog, In Progress, Review, QA, Done) with fractional position ordering (Float) to prevent full-table reorders.',
      status: TaskStatus.DONE,
      priority: TaskPriority.HIGH,
      column: colMap['Done'],
      sprintId: s2.id,
      assignee: userMap['sophia@syntrix.io'],
      reporter: userMap['marcus@syntrix.io'],
      storyPoints: 5,
      hours: 12,
      labels: [labelMap['Frontend'], labelMap['Architecture']],
    },
    {
      number: 11,
      title: 'Interactive Task Pipeline & 60fps Drag-and-Drop Motion',
      description: 'Implement native HTML5 Drag and Drop handlers with optimistic React state movement and background PATCH /tasks/:id/move sync with automatic rollback.',
      status: TaskStatus.DONE,
      priority: TaskPriority.URGENT,
      column: colMap['Done'],
      sprintId: s2.id,
      assignee: userMap['marcus@syntrix.io'],
      reporter: userMap['sophia@syntrix.io'],
      storyPoints: 8,
      hours: 18,
      labels: [labelMap['Frontend'], labelMap['Architecture']],
    },
    {
      number: 12,
      title: 'Agile Sprints, Backlog Rollover & Burndown Analytics',
      description: 'Engineered Scrum iteration cycles with single active sprint invariants, automated task rollover, and mathematical SVG burndown velocity trajectory curves.',
      status: TaskStatus.DONE,
      priority: TaskPriority.HIGH,
      column: colMap['Done'],
      sprintId: s2.id,
      assignee: userMap['ayush@syntrix.io'],
      reporter: userMap['marcus@syntrix.io'],
      storyPoints: 8,
      hours: 16,
      labels: [labelMap['Backend'], labelMap['Frontend']],
    },

    // --- Sprint 3 (Completed): Real-Time Systems, Queues & Search (Tasks 13 to 18) ---
    {
      number: 13,
      title: 'Threaded Discussion Engine & Regex @Mention Parsing',
      description: 'Support nested comment trees with regex extraction of @user mentions, automated activity audit trail recording, and in-app notifications.',
      status: TaskStatus.DONE,
      priority: TaskPriority.MEDIUM,
      column: colMap['Done'],
      sprintId: s3.id,
      assignee: userMap['marcus@syntrix.io'],
      reporter: userMap['ayush@syntrix.io'],
      storyPoints: 5,
      hours: 11,
      labels: [labelMap['Backend'], labelMap['Frontend']],
    },
    {
      number: 14,
      title: 'Modular Storage Provider Adapter & Multipart Uploads',
      description: 'Abstract file storage provider interface (LocalStorage, S3/R2 ready) with Multer multipart stream handling and authenticated download streams.',
      status: TaskStatus.DONE,
      priority: TaskPriority.HIGH,
      column: colMap['Done'],
      sprintId: s3.id,
      assignee: userMap['david@syntrix.io'],
      reporter: userMap['elena@syntrix.io'],
      storyPoints: 5,
      hours: 12,
      labels: [labelMap['Backend'], labelMap['Architecture']],
    },
    {
      number: 15,
      title: 'Real-Time In-App Notifications & Unread Counter Bells',
      description: 'Create multi-type notification dispatcher (TASK_ASSIGNED, TASK_MENTIONED, STATUS_CHANGED) with unread counter badges and topbar alert dropdown.',
      status: TaskStatus.DONE,
      priority: TaskPriority.MEDIUM,
      column: colMap['Done'],
      sprintId: s3.id,
      assignee: userMap['sophia@syntrix.io'],
      reporter: userMap['marcus@syntrix.io'],
      storyPoints: 5,
      hours: 9,
      labels: [labelMap['Frontend'], labelMap['Backend']],
    },
    {
      number: 16,
      title: 'BullMQ Asynchronous Queues & Resilient Redis Workers',
      description: 'Setup background job processing for email delivery, notifications, and cleanup with exponential backoff retries and in-process fallback when Redis is offline.',
      status: TaskStatus.DONE,
      priority: TaskPriority.HIGH,
      column: colMap['Done'],
      sprintId: s3.id,
      assignee: userMap['elena@syntrix.io'],
      reporter: userMap['ayush@syntrix.io'],
      storyPoints: 8,
      hours: 16,
      labels: [labelMap['Backend'], labelMap['Performance']],
    },
    {
      number: 17,
      title: 'Multi-Domain Global Search & Ctrl+K Command Palette',
      description: 'Build fast tenant-isolated search indexing across tasks, projects, and team members with execution latency tracking and keyboard shortcut modal.',
      status: TaskStatus.DONE,
      priority: TaskPriority.HIGH,
      column: colMap['Done'],
      sprintId: s3.id,
      assignee: userMap['marcus@syntrix.io'],
      reporter: userMap['sophia@syntrix.io'],
      storyPoints: 5,
      hours: 12,
      labels: [labelMap['Frontend'], labelMap['Backend']],
    },
    {
      number: 18,
      title: 'Workspace KPI Analytics & Completion Velocity Engine',
      description: 'Aggregate workspace KPIs (total tasks, completion rates, member workloads, velocity) using parallel Promise.all queries and adaptive Bar/Line charts.',
      status: TaskStatus.DONE,
      priority: TaskPriority.HIGH,
      column: colMap['Done'],
      sprintId: s3.id,
      assignee: userMap['ayush@syntrix.io'],
      reporter: userMap['marcus@syntrix.io'],
      storyPoints: 8,
      hours: 15,
      labels: [labelMap['Backend'], labelMap['Frontend']],
    },

    // --- Sprint 4 (Completed): Observability, UX & Automated Testing (Tasks 19 to 24) ---
    {
      number: 19,
      title: 'Redis Cache-Aside Engine & In-Process Fallback Layer',
      description: 'Cache computed dashboard analytics (60s TTL) with automatic invalidation on task mutations, dropping query execution time from 140ms down to 4ms.',
      status: TaskStatus.DONE,
      priority: TaskPriority.HIGH,
      column: colMap['Done'],
      sprintId: s4.id,
      assignee: userMap['ayush@syntrix.io'],
      reporter: userMap['david@syntrix.io'],
      storyPoints: 8,
      hours: 14,
      labels: [labelMap['Performance'], labelMap['Backend']],
    },
    {
      number: 20,
      title: 'Tiered Sliding-Window Rate Limiting & Lockout Defense',
      description: 'Enforce tiered rate limiting policies: strict auth limits (10 req/15m) to block brute-force password guessing and standard global API limiters (300 req/15m).',
      status: TaskStatus.DONE,
      priority: TaskPriority.HIGH,
      column: colMap['Done'],
      sprintId: s4.id,
      assignee: userMap['elena@syntrix.io'],
      reporter: userMap['ayush@syntrix.io'],
      storyPoints: 5,
      hours: 10,
      labels: [labelMap['Security'], labelMap['Backend']],
    },
    {
      number: 21,
      title: 'Winston Structured Logging & Correlation ID Tracing',
      description: 'Implement distributed request tracing via X-Correlation-Id headers, Winston daily rotating JSON logs, and Prometheus metrics exporter (/metrics).',
      status: TaskStatus.DONE,
      priority: TaskPriority.MEDIUM,
      column: colMap['Done'],
      sprintId: s4.id,
      assignee: userMap['david@syntrix.io'],
      reporter: userMap['ayush@syntrix.io'],
      storyPoints: 5,
      hours: 9,
      labels: [labelMap['DevOps'], labelMap['Backend']],
    },
    {
      number: 22,
      title: 'OpenAPI 3.0 Specification & Swagger UI Interactive Docs',
      description: 'Publish complete OpenAPI 3.0 specification with interactive Swagger UI at /api-docs documenting schemas, request payloads, and status codes.',
      status: TaskStatus.DONE,
      priority: TaskPriority.MEDIUM,
      column: colMap['Done'],
      sprintId: s4.id,
      assignee: userMap['elena@syntrix.io'],
      reporter: userMap['ayush@syntrix.io'],
      storyPoints: 5,
      hours: 11,
      labels: [labelMap['Backend'], labelMap['Architecture']],
    },
    {
      number: 23,
      title: 'Contemporary Bone/Amber Design & WCAG AA Accessibility',
      description: 'Refine UI design system with Bone White (#F5F3EB), Warm Amber (#F5AE4D), Charcoal (#20201D), 3px amber focus rings, and mobile responsive drawers.',
      status: TaskStatus.DONE,
      priority: TaskPriority.HIGH,
      column: colMap['Done'],
      sprintId: s4.id,
      assignee: userMap['sophia@syntrix.io'],
      reporter: userMap['marcus@syntrix.io'],
      storyPoints: 5,
      hours: 12,
      labels: [labelMap['Frontend']],
    },
    {
      number: 24,
      title: 'Vitest Monorepo Automated Testing Suite',
      description: 'Build comprehensive automated test runner across backend and frontend covering JWT verification, Zod validation, authorize middleware, and UI components.',
      status: TaskStatus.DONE,
      priority: TaskPriority.HIGH,
      column: colMap['Done'],
      sprintId: s4.id,
      assignee: userMap['ayush@syntrix.io'],
      reporter: userMap['elena@syntrix.io'],
      storyPoints: 8,
      hours: 15,
      labels: [labelMap['Backend'], labelMap['Frontend'], labelMap['DevOps']],
    },

    // --- Sprint 5 (Completed): Security Hardening & Performance (Tasks 25 to 28) ---
    {
      number: 25,
      title: 'Deep Magic-Byte Binary Scanning & File Security Defense',
      description: 'Inspect initial 8 header bytes (magic numbers) of uploaded files to verify true binary signatures (PNG, JPG, PDF, ZIP, WebP) and reject spoofed executables with path traversal sanitization.',
      status: TaskStatus.DONE,
      priority: TaskPriority.URGENT,
      column: colMap['Done'],
      sprintId: s5.id,
      assignee: userMap['ayush@syntrix.io'],
      reporter: userMap['elena@syntrix.io'],
      storyPoints: 8,
      hours: 14,
      labels: [labelMap['Security'], labelMap['Backend']],
    },
    {
      number: 26,
      title: 'Database Index Tuning & Cursor Seek Pagination',
      description: 'Add targeted compound Prisma indexes, cursor pagination (take: limit, cursor: { id }, skip: 1), Gzip response compression, and Rollup vendor chunk splitting.',
      status: TaskStatus.DONE,
      priority: TaskPriority.HIGH,
      column: colMap['Done'],
      sprintId: s5.id,
      assignee: userMap['ayush@syntrix.io'],
      reporter: userMap['david@syntrix.io'],
      storyPoints: 8,
      hours: 15,
      labels: [labelMap['Performance'], labelMap['Backend']],
    },
    {
      number: 27,
      title: 'Multi-Stage Dockerfiles & Root Docker Compose',
      description: 'Author multi-stage Dockerfile for backend (Node 22 non-root user) and frontend (NGINX Alpine). Orchestrate MariaDB, Redis, API, and Web in docker-compose.yml.',
      status: TaskStatus.DONE,
      priority: TaskPriority.HIGH,
      column: colMap['Done'],
      sprintId: s5.id,
      assignee: userMap['david@syntrix.io'],
      reporter: userMap['ayush@syntrix.io'],
      storyPoints: 5,
      hours: 11,
      labels: [labelMap['DevOps']],
    },
    {
      number: 28,
      title: 'NGINX Reverse Proxy, Keepalive Pooling & Asset Cache',
      description: 'Configure NGINX upstream backend_cluster with 32 keepalive connections, 1-year immutable caching on static JS/CSS assets, SPA fallback routing, and 25MB body limits.',
      status: TaskStatus.DONE,
      priority: TaskPriority.HIGH,
      column: colMap['Done'],
      sprintId: s5.id,
      assignee: userMap['david@syntrix.io'],
      reporter: userMap['ayush@syntrix.io'],
      storyPoints: 5,
      hours: 10,
      labels: [labelMap['DevOps']],
    },

    // --- Sprint 6 (ACTIVE Sprint): Production DevOps, Cloud Launch & Portfolio Showcase (Tasks 29 to 33) ---
    {
      number: 29,
      title: 'GitHub Actions CI/CD Workflows & Build Matrices',
      description: 'Implement automated GitHub Actions CI/CD pipelines (.github/workflows/ci.yml) executing MariaDB/Redis test services, TypeScript builds, and Vitest test matrix.',
      status: TaskStatus.DONE,
      priority: TaskPriority.HIGH,
      column: colMap['Done'],
      sprintId: s6.id,
      assignee: userMap['david@syntrix.io'],
      reporter: userMap['ayush@syntrix.io'],
      storyPoints: 5,
      hours: 10,
      labels: [labelMap['DevOps']],
    },
    {
      number: 30,
      title: 'Cloud Deployment Infrastructure as Code (Render IaC)',
      description: 'Create declarative cloud blueprint (render.yaml) for managed cloud MariaDB, Redis, and API web services with zero-drift startup database migrations.',
      status: TaskStatus.IN_PROGRESS,
      priority: TaskPriority.HIGH,
      column: colMap['In Progress'],
      sprintId: s6.id,
      assignee: userMap['david@syntrix.io'],
      reporter: userMap['ayush@syntrix.io'],
      storyPoints: 5,
      hours: 8,
      labels: [labelMap['DevOps']],
    },
    {
      number: 31,
      title: 'Zero-Downtime /health/ready Probes & Backup Drills',
      description: 'Implement /health/ready database ping probes, graceful process teardown (SIGTERM/SIGINT), and automated database backup and restore scripts (scripts/backup-db.sh).',
      status: TaskStatus.IN_PROGRESS,
      priority: TaskPriority.HIGH,
      column: colMap['In Progress'],
      sprintId: s6.id,
      assignee: userMap['ayush@syntrix.io'],
      reporter: userMap['david@syntrix.io'],
      storyPoints: 5,
      hours: 7,
      labels: [labelMap['DevOps'], labelMap['Backend']],
    },
    {
      number: 32,
      title: 'Technical Specifications, PRD, SRS & ERD Documents',
      description: 'Author comprehensive engineering specifications: Product Requirements Document (PRD.md), Software Requirements Specification (SRS.md), and Entity Relationship Diagrams (DATABASE_DESIGN.md).',
      status: TaskStatus.REVIEW,
      priority: TaskPriority.MEDIUM,
      column: colMap['Code Review'],
      sprintId: s6.id,
      assignee: userMap['sophia@syntrix.io'],
      reporter: userMap['ayush@syntrix.io'],
      storyPoints: 3,
      hours: 6,
      labels: [labelMap['Architecture']],
    },
    {
      number: 33,
      title: 'Portfolio Showcase, System Design Q&A & Video Demo',
      description: 'Synthesize high-impact engineering resume bullet points, system design interview talking points (MVC+Service, DAG cycles, Redis fallbacks), and 5-minute live demo walkthrough script.',
      status: TaskStatus.TODO,
      priority: TaskPriority.URGENT,
      column: colMap['Backlog'],
      sprintId: s6.id,
      assignee: userMap['ayush@syntrix.io'],
      reporter: userMap['elena@syntrix.io'],
      storyPoints: 5,
      hours: 8,
      labels: [labelMap['Architecture']],
    },
  ];

  for (const t of all33Tasks) {
    const key = `SYN-${t.number}`;

    const createdTask = await prisma.task.create({
      data: {
        projectId: project.id,
        columnId: t.column.id,
        number: t.number,
        key,
        title: t.title,
        description: t.description,
        status: t.status,
        priority: t.priority,
        position: t.number * 1000.0,
        assigneeId: t.assignee.id,
        reporterId: t.reporter.id,
        sprintId: t.sprintId,
        storyPoints: t.storyPoints,
        estimatedHours: t.hours,
        dueDate: new Date(now + 7 * day),
      },
    });

    for (const lbl of t.labels) {
      if (lbl) {
        await prisma.taskLabel.create({
          data: { taskId: createdTask.id, labelId: lbl.id },
        });
      }
    }

    // Add activity log
    await prisma.activityLog.create({
      data: {
        organizationId: org.id,
        projectId: project.id,
        taskId: createdTask.id,
        userId: t.assignee.id,
        action: ActivityAction.TASK_CREATED,
        details: {
          title: t.title,
          key,
          priority: t.priority,
          status: t.status,
        },
      },
    });
  }

  console.log(`\n🎉 Successfully populated ALL 33 Roadmap Tasks across 6 Sprints in Syntrix Labs Inc.!`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
