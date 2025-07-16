export interface User {
  id: string;
  email: string;
  username: string;
  is_active: boolean;
}

export interface Project {
  id: string;
  creator_id: string;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
  manual_count?: number;
}

export enum ManualStatus {
  DRAFT = 'draft',
  REVIEW = 'review',
  PUBLISHED = 'published',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

export interface Manual {
  id: string;
  project_id: string;
  title: string;
  content?: any;
  status: ManualStatus;
  version: string;
  video_file_path?: string;
  created_at: string;
  updated_at: string;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface RegisterData {
  email: string;
  username: string;
  password: string;
}