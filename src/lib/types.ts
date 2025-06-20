export interface GenerationJob {
  id: string;
  sequence_id: string;
  chapter_id: string;
  user_id: string;
  user_preferences: Record<string, any>;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  current_step?: string;
  progress: number;
  error_message?: string;
  created_at: string;
  started_at?: string;
  completed_at?: string;
  updated_at: string;
}

export interface Chapter {
  id: string;
  sequence_id: string;
  title: string;
  content: string;
  chapter_number: number;
  created_at: string;
  updated_at: string;
}

export interface Sequence {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  status: 'draft' | 'published' | 'archived';
  created_at: string;
  updated_at: string;
}

export interface WorkerConfig {
  pollIntervalMs: number;
  maxRetries: number;
  workerConcurrency: number;
}