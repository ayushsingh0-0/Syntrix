export interface CreateAttachmentDTO {
  organizationId: string;
  projectId?: string | null;
  taskId?: string | null;
  userId: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  path: string;
}

export interface AttachmentUploader {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string | null;
}

export interface AttachmentResponse {
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
  uploader: AttachmentUploader;
  createdAt: Date;
  updatedAt: Date;
}
