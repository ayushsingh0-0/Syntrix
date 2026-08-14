export interface CreateCommentDTO {
  content: string;
  parentId?: string | null;
}

export interface UpdateCommentDTO {
  content: string;
}

export interface CommentAuthor {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string | null;
}

export interface CommentResponse {
  id: string;
  taskId: string;
  userId: string;
  parentId?: string | null;
  content: string;
  isEdited: boolean;
  user: CommentAuthor;
  mentions: { id: string; userId: string; user: CommentAuthor }[];
  replies?: CommentResponse[];
  createdAt: Date;
  updatedAt: Date;
}
