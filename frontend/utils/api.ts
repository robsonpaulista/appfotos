import axios, { AxiosInstance } from 'axios';
import type { PhotosResponse, Photo, PhotoFilters, AuthStatus, SyncEvent } from '@/types/photo';

// No Vercel, as rotas da API estão no mesmo domínio (rotas relativas)
// Em desenvolvimento, pode usar um backend separado
function getBaseUrl(): string {
  // Se estiver em produção no Vercel, usar rotas relativas
  if (typeof window !== 'undefined' && window.location.hostname.includes('vercel.app')) {
    return ''; // Rotas relativas
  }
  
  // Em desenvolvimento, usar backend separado se configurado
  return process.env.NEXT_PUBLIC_BACKEND_URL || '';
}

const BASE_URL = getBaseUrl();

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: BASE_URL,
      withCredentials: true,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  // Auth endpoints
  async getAuthUrl(): Promise<{ authUrl: string }> {
    const { data } = await this.client.get('/api/auth/url');
    return data;
  }

  async getAuthStatus(): Promise<AuthStatus> {
    const { data } = await this.client.get('/api/auth/status');
    return data;
  }

  async logout(): Promise<void> {
    await this.client.post('/api/auth/logout');
  }

  // Photo endpoints
  async getPhotos(filters: PhotoFilters = {}): Promise<PhotosResponse> {
    const { data } = await this.client.get('/api/photos', { params: filters });
    return data;
  }

  async getPhoto(id: string): Promise<Photo> {
    const { data } = await this.client.get(`/api/photos/${id}`);
    return data;
  }

  async updatePhoto(id: string, updates: Partial<Photo>): Promise<Photo> {
    const { data } = await this.client.put(`/api/photos/${id}`, updates);
    return data;
  }

  async addPhotoTag(photoId: string, tag: string, tagType: string = 'custom'): Promise<void> {
    await this.client.post(`/api/photos/${photoId}/tags`, { tag, tag_type: tagType });
  }

  async setCustomTags(photoId: string, tags: string[]): Promise<string[]> {
    const { data } = await this.client.put(`/api/photos/${photoId}/custom-tags`, { tags });
    return data.tags;
  }

  getPhotoStreamUrl(driveId: string): string {
    return `${BASE_URL || '/api'}/photos/stream/${driveId}`;
  }

  // Folder endpoints
  async getFolders(): Promise<any> {
    const { data } = await this.client.get('/api/folders');
    return data;
  }

  // Stats endpoints
  async getStats(): Promise<any> {
    const { data } = await this.client.get('/api/stats/summary');
    return data;
  }

  async getCities(): Promise<string[]> {
    const { data } = await this.client.get('/api/stats/cities');
    return data;
  }

  async getEventTypes(): Promise<string[]> {
    const { data } = await this.client.get('/api/stats/types');
    return data;
  }

  async getTags(): Promise<string[]> {
    const { data } = await this.client.get('/api/photos/tags');
    return data;
  }

  // Sync endpoints
  async startSync(analyzeWithVision: boolean = false, folderId?: string, tags?: { person?: string; location?: string; event?: string }): Promise<{ syncId: string }> {
    const { data } = await this.client.post('/api/sync/start', { analyzeWithVision, folderId, tags });
    return data;
  }

  async getSyncStatus(): Promise<SyncEvent> {
    const { data } = await this.client.get('/api/sync/status');
    return data;
  }

  async getSyncHistory(limit: number = 10): Promise<SyncEvent[]> {
    const { data } = await this.client.get('/api/sync/history', { params: { limit } });
    return data;
  }

  async analyzePhotos(limit: number = 100): Promise<void> {
    await this.client.post('/api/sync/analyze', { limit });
  }

  async cancelSync(): Promise<void> {
    await this.client.post('/api/sync/cancel');
  }

  async processChunk(syncId: string, pageToken?: string): Promise<any> {
    const { data } = await this.client.post('/api/sync/process-chunk', { syncId, pageToken });
    return data;
  }

  // Analysis endpoints
  async reanalyzePhotos(photoIds?: string[], force: boolean = false): Promise<any> {
    const { data } = await this.client.post('/api/analysis/reanalyze', { 
      photoIds, 
      force 
    });
    return data;
  }

  async getAnalysisStats(): Promise<any> {
    const { data } = await this.client.get('/api/analysis/stats');
    return data;
  }

  // Dev endpoints (apenas desenvolvimento)
  async clearAllData(): Promise<void> {
    await this.client.delete('/api/dev/clear-all', {
      data: { confirm: 'DELETE_ALL_DATA' }
    });
  }

  async getDevStats(): Promise<any> {
    const { data } = await this.client.get('/api/dev/stats');
    return data;
  }
}

export const api = new ApiClient();

// Alias para compatibilidade com código existente
export const photosApi = {
  getPhotos: (filters?: PhotoFilters) => api.getPhotos(filters),
  getPhoto: (id: string) => api.getPhoto(id),
  updatePhoto: async (id: string, updates: Partial<Photo>) => {
    // Mapear campos do Photo para os campos esperados pelo backend
    const mappedUpdates: any = {};
    
    if (updates.person_tag !== undefined) mappedUpdates.person = updates.person_tag;
    if (updates.location_name !== undefined) mappedUpdates.location = updates.location_name;
    if (updates.event_type !== undefined) mappedUpdates.event_type = updates.event_type;
    if (updates.event_city !== undefined) mappedUpdates.event_city = updates.event_city;
    if (updates.event_year !== undefined) mappedUpdates.event_year = updates.event_year;
    if (updates.event_month !== undefined) mappedUpdates.event_month = updates.event_month;
    if ((updates as any).role_tag !== undefined) mappedUpdates.role_tag = (updates as any).role_tag;
    if ((updates as any).role !== undefined) mappedUpdates.role_tag = (updates as any).role;
    if ((updates as any).cargo !== undefined) mappedUpdates.role_tag = (updates as any).cargo;
    
    // Fazer requisição PUT para /api/photos/:id
    const backendUrl = BASE_URL || '/api';
    const response = await axios.put(`${backendUrl}/photos/${id}`, mappedUpdates, {
      withCredentials: true,
      headers: { 'Content-Type': 'application/json' }
    });
    
    return response.data;
  },
  updateTags: async (photoId: string, tags: { person?: string; location?: string; event_type?: string }) => {
    const updates: any = {};
    if (tags.person !== undefined) updates.person = tags.person;
    if (tags.location !== undefined) updates.location = tags.location;
    if (tags.event_type !== undefined) updates.event_type = tags.event_type;
    
    const backendUrl = BASE_URL || '/api';
    const response = await axios.put(`${backendUrl}/photos/${photoId}`, updates, {
      withCredentials: true,
      headers: { 'Content-Type': 'application/json' }
    });
    
    return response.data;
  },
  getImageUrl: (photoId: string, token?: string) => {
    const backendUrl = BASE_URL || '/api';
    const baseUrl = `${backendUrl}/photos/${photoId}/image`;
    if (token) {
      return `${baseUrl}?token=${encodeURIComponent(token)}`;
    }
    return baseUrl;
  },
  reanalyzePhotos: (photoIds?: string[], force?: boolean) => api.reanalyzePhotos(photoIds, force),
};
