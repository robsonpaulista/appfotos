export interface Photo {
  id: string;
  drive_id: string;
  name: string;
  mime_type: string;
  width: number | null;
  height: number | null;
  size_bytes: number;
  created_at: string;
  modified_at: string;
  gps_lat: number | null;
  gps_lng: number | null;
  location_name: string | null;
  person_tag: string | null;
  joy_likelihood: EmotionLikelihood | null;
  sorrow_likelihood: EmotionLikelihood | null;
  anger_likelihood: EmotionLikelihood | null;
  surprise_likelihood: EmotionLikelihood | null;
  faces_detected: number;
  storage_url: string | null;
  thumbnail_url: string | null;
  analyzed: boolean;
  user_id: string;
  indexed_at: string;
  updated_at: string;
  // Campos de auto-tags
  event_year: number | null;
  event_month: number | null;
  event_city: string | null;
  event_type: string | null;
  folder_path: string | null;
}

export type EmotionLikelihood = 
  | 'VERY_LIKELY' 
  | 'LIKELY' 
  | 'POSSIBLE' 
  | 'UNLIKELY' 
  | 'VERY_UNLIKELY' 
  | 'UNKNOWN';

export interface PhotoTag {
  id: string;
  photo_id: string;
  tag: string;
  tag_type: 'person' | 'event' | 'location' | 'custom';
  created_at: string;
}

export interface PhotoFilters {
  search?: string;
  person?: string;
  withoutPerson?: boolean;
  joy?: EmotionLikelihood;
  city?: string;
  dateFrom?: string;
  dateTo?: string;
  minFaces?: number;
  maxFaces?: number;
  eventType?: string;
  page?: number;
  limit?: number;
}

export interface PhotosResponse {
  photos: Photo[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface SyncEvent {
  id: string;
  user_id: string;
  status: 'started' | 'in_progress' | 'completed' | 'failed';
  photos_processed: number;
  photos_added: number;
  photos_updated: number;
  error_message: string | null;
  started_at: string;
  completed_at: string | null;
}

export interface User {
  id: string;
  email: string;
  name: string;
}

export interface AuthStatus {
  authenticated: boolean;
  user?: User;
  imageToken?: string; // Token temporário para requisições de imagem
}
