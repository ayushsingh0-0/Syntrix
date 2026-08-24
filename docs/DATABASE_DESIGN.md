# Syntrix — Database Design Document & ERD

## 1. High-Level Entity Relationship Diagram (ERD)

```mermaid
erDiagram
    User ||--o{ OrganizationMember : "belongs to"
    User ||--o{ ProjectMember : "assigned to"
    User ||--o{ TeamMember : "member of"
    User ||--o{ Task : "assignee/reporter"
    User ||--o{ Comment : "authors"
    User ||--o{ Notification : "receives"
    User ||--o{ RefreshToken : "owns"

    Organization ||--o{ OrganizationMember : "contains"
    Organization ||--o{ Team : "groups"
    Organization ||--o{ Project : "owns"
    Organization ||--o{ Label : "defines"
    Organization ||--o{ ActivityLog : "logs"

    Project ||--o{ Board : "has"
    Project ||--o{ Sprint : "schedules"
    Project ||--o{ Task : "tracks"
    Project ||--o{ ProjectMember : "enrolls"

    Board ||--o{ BoardColumn : "defines"
    BoardColumn ||--o{ Task : "contains"

    Task ||--o{ Comment : "has"
    Task ||--o{ Attachment : "attaches"
    Task ||--o{ TaskLabel : "tagged with"
    Task ||--o{ TaskDependency : "links"
    Task ||--o{ TaskWatcher : "watched by"

    Sprint ||--o{ Task : "allocates"
    Label ||--o{ TaskLabel : "categorizes"
```

---

## 2. Core Tables & Indexing Strategy

### 2.1 `User` & `RefreshToken`
- `User`: Primary identity table (`id`, `email UNIQUE`, `password`, `role`, `avatarUrl`).
- `RefreshToken`: Stored hashed refresh tokens (`token UNIQUE`, `userId`, `expiresAt`, `isRevoked`).

### 2.2 `Organization`, `OrganizationMember`, `Team`, `TeamMember`
- `Organization`: Workspace tenant root (`id`, `slug UNIQUE`, `name`, `logoUrl`).
- `OrganizationMember`: Composite unique `[organizationId, userId]`, role enum (`OWNER`, `ADMIN`, `MANAGER`, `MEMBER`, `GUEST`).
- `Team`: Sub-tenant team structures (`[organizationId, name]`).

### 2.3 `Project`, `Board`, `BoardColumn`, `Sprint`
- `Project`: Project workspaces with unique key per org `[organizationId, key]`, status index `[organizationId, status]`.
- `Board`: Kanban boards partitioned by project `[projectId]`.
- `BoardColumn`: Workflow columns indexed on `[boardId, position]`.
- `Sprint`: Iteration cycles indexed on `[projectId, status]`.

### 2.4 `Task`, `TaskLabel`, `TaskDependency`, `TaskWatcher`
- `Task`: Central work items indexed on:
  - `@@unique([projectId, number])`
  - `@@index([projectId, status])`
  - `@@index([projectId, createdAt])`
  - `@@index([assigneeId, status])`
  - `@@index([sprintId, status])`
  - `@@index([columnId, position])`
- `TaskDependency`: Directed relationship links with cycle prevention `[taskId, dependsOnTaskId, type]`.

### 2.5 `Comment`, `ActivityLog`, `Attachment`, `Notification`
- `Comment`: Nested threaded discussions indexed on `[taskId, createdAt]` and `[parentId]`.
- `ActivityLog`: Audit trail indexed on `[taskId, createdAt]`, `[projectId, createdAt]`, and `[organizationId, createdAt]`.
- `Attachment`: File uploads indexed on `[taskId, createdAt]`, `[projectId, createdAt]`, and `[organizationId, createdAt]`.
- `Notification`: In-app notifications indexed on `[userId, isRead, createdAt]`.
