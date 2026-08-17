export interface User {
  id: string;
  email: string;
  name: string;
  role: 'USER' | 'ADMIN' | 'SUPPORT';
  bio?: string | null;
  avatarUrl?: string | null;
  phone?: string | null;
  isEmailVerified: boolean;
  createdAt: string;
}

export type OrganizationRole = 'OWNER' | 'ADMIN' | 'MANAGER' | 'MEMBER' | 'GUEST';

export type OrgPermission =
  | 'ORG_READ'
  | 'ORG_UPDATE'
  | 'ORG_DELETE'
  | 'ORG_TRANSFER'
  | 'MEMBER_INVITE'
  | 'MEMBER_REMOVE'
  | 'MEMBER_ROLE_UPDATE'
  | 'TEAM_MANAGE'
  | 'PROJECT_CREATE'
  | 'PROJECT_READ'
  | 'PROJECT_UPDATE'
  | 'PROJECT_DELETE'
  | 'AUDIT_VIEW';

export interface Organization {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string | null;
  isArchived: boolean;
  myRole?: OrganizationRole;
  createdAt: string;
}

export interface OrganizationMember {
  id: string;
  organizationId: string;
  userId: string;
  role: OrganizationRole;
  user: User;
  joinedAt: string;
}

export interface Invitation {
  id: string;
  organizationId: string;
  email: string;
  role: OrganizationRole;
  token?: string;
  invitationLink?: string;
  expiresAt: string;
  createdAt: string;
  organization?: {
    id: string;
    name: string;
    slug: string;
  };
}

export type TeamRole = 'LEAD' | 'MEMBER';

export interface Team {
  id: string;
  organizationId: string;
  name: string;
  description?: string | null;
  memberCount?: number;
  myRole?: TeamRole | null;
  createdAt: string;
}

export interface TeamMember {
  id: string;
  teamId: string;
  userId: string;
  role: TeamRole;
  user: User;
  joinedAt: string;
}

export type ProjectStatus = 'PLANNING' | 'ACTIVE' | 'ON_HOLD' | 'COMPLETED' | 'ARCHIVED';
export type ProjectPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
export type ProjectRole = 'LEAD' | 'MEMBER' | 'VIEWER';

export interface Project {
  id: string;
  organizationId: string;
  teamId?: string | null;
  name: string;
  key: string;
  description?: string | null;
  status: ProjectStatus;
  priority: ProjectPriority;
  isArchived: boolean;
  memberCount?: number;
  myRole?: ProjectRole | null;
  team?: {
    id: string;
    name: string;
  } | null;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectMember {
  id: string;
  projectId: string;
  userId: string;
  role: ProjectRole;
  user: User;
  joinedAt: string;
}

export interface ApiErrorResponse {
  statusCode: number;
  message: string;
  errors?: Record<string, string[]>;
}

export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'DONE' | 'CANCELLED';

export interface Label {
  id: string;
  organizationId: string;
  name: string;
  color: string;
  description?: string | null;
  createdAt: string;
}

export type DependencyType = 'BLOCKS' | 'BLOCKED_BY' | 'RELATES_TO';

export interface TaskDependency {
  id: string;
  taskId: string;
  dependsOnTaskId: string;
  type: DependencyType;
  dependsOnTask?: {
    id: string;
    key: string;
    title: string;
    status: TaskStatus;
    priority: TaskPriority;
  };
  task?: {
    id: string;
    key: string;
    title: string;
    status: TaskStatus;
    priority: TaskPriority;
  };
  createdAt: string;
}

export interface TaskWatcher {
  id: string;
  taskId: string;
  userId: string;
  user: User;
  createdAt: string;
}

export interface Task {
  id: string;
  projectId: string;
  columnId?: string | null;
  number: number;
  key: string;
  title: string;
  description?: string | null;
  priority: TaskPriority;
  status: TaskStatus;
  position: number;
  assigneeId?: string | null;
  reporterId: string;
  sprintId?: string | null;
  storyPoints?: number | null;

  dueDate?: string | null;
  estimatedHours?: number | null;
  assignee?: User | null;
  reporter?: User | null;
  labels?: { label: Label }[];
  watchers?: TaskWatcher[];
  dependencies?: TaskDependency[];
  blockingTasks?: TaskDependency[];
  attachments?: Attachment[];
  createdAt: string;
  updatedAt: string;
}

export type SprintStatus = 'PLANNED' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';

export interface Sprint {
  id: string;
  projectId: string;
  name: string;
  goal?: string | null;
  status: SprintStatus;
  startDate?: string | null;
  endDate?: string | null;
  completedAt?: string | null;
  tasks: Task[];
  _count?: {
    tasks: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface BurndownPoint {
  date: string;
  idealRemainingPoints: number;
  actualRemainingPoints: number;
  idealRemainingTasks: number;
  actualRemainingTasks: number;
}

export interface BurndownData {
  sprint: {
    id: string;
    name: string;
    status: SprintStatus;
    startDate: string;
    endDate: string;
    totalStoryPoints: number;
    completedStoryPoints: number;
    totalTasks: number;
    completedTasks: number;
  };
  timeline: BurndownPoint[];
}

export interface BoardColumn {
  id: string;
  boardId: string;
  name: string;
  position: number;
  color?: string | null;
  wipLimit?: number | null;
  tasks: Task[];
  createdAt: string;
  updatedAt: string;
}

export interface Board {
  id: string;
  projectId: string;
  name: string;
  description?: string | null;
  isDefault: boolean;
  columns: BoardColumn[];
  createdAt: string;
  updatedAt: string;
}

export interface CommentMention {
  id: string;
  commentId: string;
  userId: string;
  user: User;
  createdAt: string;
}

export interface Comment {
  id: string;
  taskId: string;
  userId: string;
  parentId?: string | null;
  content: string;
  isEdited: boolean;
  user: User;
  mentions: CommentMention[];
  replies?: Comment[];
  createdAt: string;
  updatedAt: string;
}

export type ActivityAction =
  | 'TASK_CREATED'
  | 'TASK_UPDATED'
  | 'STATUS_CHANGED'
  | 'PRIORITY_CHANGED'
  | 'ASSIGNEE_CHANGED'
  | 'SPRINT_CHANGED'
  | 'COMMENT_ADDED'
  | 'COMMENT_DELETED'
  | 'ATTACHMENT_ADDED'
  | 'ATTACHMENT_DELETED';

export interface ActivityLog {
  id: string;
  organizationId: string;
  projectId?: string | null;
  taskId?: string | null;
  userId: string;
  action: ActivityAction;
  details?: Record<string, unknown> | null;
  user: User;
  createdAt: string;
}

export interface Attachment {
  id: string;
  organizationId: string;
  projectId?: string | null;
  taskId?: string | null;
  userId: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  uploader: User;
  createdAt: string;
  updatedAt: string;
}

export type NotificationType =
  | 'TASK_ASSIGNED'
  | 'TASK_MENTIONED'
  | 'COMMENT_MENTIONED'
  | 'TASK_STATUS_CHANGED'
  | 'TASK_DUE_SOON'
  | 'INVITATION_RECEIVED';

export interface Notification {
  id: string;
  userId: string;
  actorId?: string | null;
  organizationId?: string | null;
  projectId?: string | null;
  taskId?: string | null;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, unknown> | null;
  isRead: boolean;
  readAt?: string | null;
  actor?: User | null;
  createdAt: string;
}

export * from './search.types';
export * from './dashboard.types';
