import axios, { AxiosInstance } from 'axios';
import type {
  PhotosResponse,
  Photo,
  PhotoFilters,
  AuthStatus,
  SyncEvent,
  User,
  Leader,
  FaceSearchResult,
} from '@/types/photo';

// No Vercel, as rotas da API estão no mesmo domínio (rotas relativas)
// Em desenvolvimento, pode usar um backend separado
function getBaseUrl(): string {
  // Se estiver em produção no Vercel, usar rotas relativas
  if (typeof window !== 'undefined' && window.location.hostname.includes('vercel.app')) {
    return ''; // Rotas relativas
  }
  
  // Em desenvolvimento, auth/fotos via Next (rotas relativas) por padrão
  return process.env.NEXT_PUBLIC_API_URL || '';
}

/**
 * Express (Face-API / indexação).
 * - localhost → NEXT_PUBLIC_BACKEND_URL ou :4000
 * - IP na LAN → mesmo host :4000
 * - Vercel/domínio → só se NEXT_PUBLIC_BACKEND_URL for URL pública (ignora localhost do build)
 */
function getExpressBaseUrl(): string {
  const configured = (process.env.NEXT_PUBLIC_BACKEND_URL || '').trim();
  const isConfiguredLocal =
    !configured ||
    /localhost|127\.0\.0\.1/i.test(configured);

  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    const isLocalhost = host === 'localhost' || host === '127.0.0.1';
    const isLanIp = /^\d{1,3}(\.\d{1,3}){3}$/.test(host);

    if (isLanIp) {
      return `${window.location.protocol}//${host}:4000`;
    }
    if (!isLocalhost) {
      return isConfiguredLocal ? '' : configured;
    }
  }
  return configured || 'http://localhost:4000';
}

function fileToDataUrl(file: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') resolve(reader.result);
      else reject(new Error('Falha ao ler a foto'));
    };
    reader.onerror = () => reject(new Error('Falha ao ler a foto'));
    reader.readAsDataURL(file);
  });
}

const BASE_URL = getBaseUrl();

class ApiClient {
  private client: AxiosInstance;
  private express: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: BASE_URL,
      withCredentials: true,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.express = axios.create({
      baseURL: getExpressBaseUrl(),
      withCredentials: true,
    });

    // Em rede local o hostname só existe no browser — ajusta a base do Express
    if (typeof window !== 'undefined') {
      this.express.defaults.baseURL = getExpressBaseUrl();
    }
  }

  // Auth endpoints
  async login(email: string, password: string): Promise<AuthStatus> {
    const { data } = await this.client.post('/api/auth/login', { email, password });
    return data;
  }

  async getAuthStatus(): Promise<AuthStatus> {
    const { data } = await this.client.get('/api/auth/status');
    return data;
  }

  async logout(): Promise<void> {
    await this.client.post('/api/auth/logout');
  }

  async getAppUsers(): Promise<User[]> {
    const { data } = await this.client.get('/api/auth/users');
    return data.users || [];
  }

  async createAppUser(payload: {
    email: string;
    password: string;
    name?: string;
    role?: 'admin' | 'viewer';
  }): Promise<{ user: User }> {
    const { data } = await this.client.post('/api/auth/users', payload);
    return data;
  }

  async updateAppUser(
    id: string,
    payload: { name?: string; role?: 'admin' | 'viewer'; password?: string }
  ): Promise<{ user: User }> {
    const { data } = await this.client.put(`/api/auth/users/${id}`, payload);
    return data;
  }

  async deleteAppUser(id: string): Promise<void> {
    await this.client.delete(`/api/auth/users/${id}`);
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
  async getFolders(parentId?: string): Promise<{
    tree: Array<{
      id: string;
      name: string;
      parents?: string[];
      children?: unknown[];
      childrenLoaded?: boolean;
      mayHaveChildren?: boolean;
    }>;
    folders?: unknown[];
    total?: number;
    rootFolderId?: string;
    parentId?: string;
  }> {
    const { data } = await this.client.get('/api/folders', {
      params: parentId ? { parentId } : undefined,
    });
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

  async processChunk(
    syncId: string,
    pageToken?: string,
    options?: {
      folderId?: string;
      folderName?: string;
      tags?: { person?: string; location?: string; event?: string };
      folderMap?: Record<string, string>;
    }
  ): Promise<{
    done: boolean;
    nextPageToken?: string | null;
    folderMap?: Record<string, string>;
    folderId?: string;
    folderName?: string;
    tags?: { person?: string; location?: string; event?: string } | null;
    stats?: { processed: number; added: number; updated: number; errors?: number };
  }> {
    const { data } = await this.client.post('/api/sync/process-chunk', {
      syncId,
      pageToken,
      ...options,
    });
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

  // Face search — busca por liderança no Next; imagem/indexação no Express
  async searchByImage(file: Blob, threshold?: number): Promise<FaceSearchResult> {
    if (!this.express.defaults.baseURL) {
      return {
        error: 'backend_offline',
        message:
          'Busca por selfie/upload precisa do backend Face-API. Defina NEXT_PUBLIC_BACKEND_URL no Vercel (URL pública do Express).',
        matches: [],
      };
    }
    const form = new FormData();
    form.append('image', file, file instanceof File ? file.name : 'capture.jpg');
    if (threshold != null) form.append('threshold', String(threshold));
    const { data } = await this.express.post('/api/faces/search-by-image', form);
    return data;
  }

  async searchByLeader(leaderId: string, threshold?: number): Promise<FaceSearchResult> {
    const { data } = await this.client.post('/api/faces/search-by-leader', {
      leaderId,
      threshold,
    });
    return data;
  }

  async indexLibraryFaces(limit: number = 30): Promise<{
    processed: number;
    facesTotal: number;
    message?: string;
  }> {
    if (!this.express.defaults.baseURL) {
      throw new Error(
        'Indexação facial precisa do backend Express. Defina NEXT_PUBLIC_BACKEND_URL no Vercel.'
      );
    }
    const { data } = await this.express.post(
      '/api/faces/index-library',
      { limit },
      { headers: { 'Content-Type': 'application/json' } }
    );
    return data;
  }

  // Leaders CRUD (Next.js / Supabase — funciona no Vercel)
  async getLeaders(params?: { q?: string; city?: string }): Promise<Leader[]> {
    const { data } = await this.client.get('/api/leaders', { params });
    return data.leaders || [];
  }

  async createLeader(payload: {
    name: string;
    city?: string;
    role_title?: string;
    photo: File;
  }): Promise<Leader> {
    const photo_data = await fileToDataUrl(payload.photo);
    const { data } = await this.client.post('/api/leaders', {
      name: payload.name,
      city: payload.city,
      role_title: payload.role_title,
      photo_data,
    });
    return data.leader;
  }

  async deleteLeader(id: string): Promise<void> {
    await this.client.delete(`/api/leaders/${id}`);
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
