export type SearchCategory = 'ALL' | 'PROJECTS' | 'TASKS' | 'COMMENTS' | 'MEMBERS';

export interface ProjectSearchResult {
  id: string;
  name: string;
  key: string;
  description?: string | null;
  status: string;
  priority: string;
  isArchived: boolean;
  updatedAt: string;
  _count?: {
    tasks: number;
    members: number;
  };
}

export interface TaskSearchResult {
  id: string;
  key: string;
  number: number;
  title: string;
  status: string;
  priority: string;
  dueDate?: string | null;
  projectId: string;
  updatedAt: string;
  project: {
    id: string;
    name: string;
    key: string;
  };
  assignee?: {
    id: string;
    name: string;
    avatarUrl?: string | null;
  } | null;
}

export interface CommentSearchResult {
  id: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  task: {
    id: string;
    key: string;
    title: string;
    projectId: string;
    project: {
      id: string;
      name: string;
      key: string;
    };
  };
  user: {
    id: string;
    name: string;
    avatarUrl?: string | null;
  };
}

export interface MemberSearchResult {
  id: string;
  role: string;
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    avatarUrl?: string | null;
  };
}

export interface SearchResultsData {
  query: string;
  totalResults: number;
  durationMs: number;
  counts: {
    projects: number;
    tasks: number;
    comments: number;
    members: number;
  };
  projects: ProjectSearchResult[];
  tasks: TaskSearchResult[];
  comments: CommentSearchResult[];
  members: MemberSearchResult[];
}
