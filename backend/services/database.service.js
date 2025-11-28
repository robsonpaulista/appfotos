import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Serviço para interagir com Supabase/Postgres
 * Gerencia todas as operações de banco de dados
 */
class DatabaseService {
  constructor() {
    this.supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY
    );
  }

  /**
   * Insere ou atualiza uma foto no banco de dados
   */
  async upsertPhoto(photoData) {
    try {
      const { data, error } = await this.supabase
        .from('photos')
        .upsert(photoData, { onConflict: 'drive_id' })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erro ao salvar foto:', error);
      throw new Error('Falha ao salvar foto no banco: ' + error.message);
    }
  }

  /**
   * Busca fotos com filtros
   */
  async searchPhotos(filters = {}) {
    try {
      let query = this.supabase
        .from('photos')
        .select('*')
        .order('created_at', { ascending: false });

      // Filtro por pessoa
      if (filters.person) {
        query = query.ilike('person_tag', `%${filters.person}%`);
      }

      // Filtro por expressão (sorrindo)
      if (filters.joy) {
        query = query.eq('joy_likelihood', filters.joy);
      }

      // Filtro por número de rostos
      if (filters.minFaces) {
        query = query.gte('faces_detected', filters.minFaces);
      }

      // Filtro por ano
      if (filters.year) {
        const startDate = `${filters.year}-01-01`;
        const endDate = `${filters.year}-12-31`;
        query = query.gte('created_at', startDate).lte('created_at', endDate);
      }

      // Filtro por cidade/local
      if (filters.city) {
        query = query.ilike('location_name', `%${filters.city}%`);
      }

      // Filtro por coordenadas GPS (raio)
      if (filters.lat && filters.lng && filters.radius) {
        // Usando operador de distância do PostGIS se disponível
        // Por enquanto, implementação simplificada
        query = query.not('gps_lat', 'is', null);
      }

      // Paginação
      const page = filters.page || 1;
      const limit = filters.limit || 50;
      const from = (page - 1) * limit;
      const to = from + limit - 1;

      query = query.range(from, to);

      const { data, error, count } = await query;

      if (error) throw error;

      return {
        photos: data || [],
        page,
        limit,
        total: count
      };
    } catch (error) {
      console.error('Erro ao buscar fotos:', error);
      throw new Error('Falha ao buscar fotos: ' + error.message);
    }
  }

  /**
   * Obtém uma foto por ID
   */
  async getPhotoById(id) {
    try {
      const { data, error } = await this.supabase
        .from('photos')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erro ao buscar foto:', error);
      throw new Error('Falha ao buscar foto: ' + error.message);
    }
  }

  /**
   * Obtém uma foto por drive_id
   */
  async getPhotoByDriveId(driveId) {
    try {
      const { data, error } = await this.supabase
        .from('photos')
        .select('*')
        .eq('drive_id', driveId)
        .single();

      if (error && error.code !== 'PGRST116') throw error; // PGRST116 = not found
      return data;
    } catch (error) {
      console.error('Erro ao buscar foto por drive_id:', error);
      return null;
    }
  }

  /**
   * Atualiza tags de uma foto
   */
  async updatePhotoTags(id, tags) {
    try {
      // Construir objeto de atualização dinamicamente
      const updateData = {};
      
      if (tags.person !== undefined) updateData.person_tag = tags.person;
      if (tags.location !== undefined) updateData.location_name = tags.location;
      if (tags.event_type !== undefined) updateData.event_type = tags.event_type;
      if (tags.event_city !== undefined) updateData.event_city = tags.event_city;
      if (tags.event_year !== undefined) updateData.event_year = tags.event_year;
      if (tags.event_month !== undefined) updateData.event_month = tags.event_month;

      const { data, error } = await this.supabase
        .from('photos')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erro ao atualizar foto:', error);
      throw new Error('Falha ao atualizar foto: ' + error.message);
    }
  }

  /**
   * Obtém estatísticas gerais
   */
  async getStats() {
    try {
      const { count: totalPhotos } = await this.supabase
        .from('photos')
        .select('*', { count: 'exact', head: true });

      const { count: photosWithFaces } = await this.supabase
        .from('photos')
        .select('*', { count: 'exact', head: true })
        .gt('faces_detected', 0);

      const { count: smilingPhotos } = await this.supabase
        .from('photos')
        .select('*', { count: 'exact', head: true })
        .in('joy_likelihood', ['LIKELY', 'VERY_LIKELY']);

      const { count: photosWithGPS } = await this.supabase
        .from('photos')
        .select('*', { count: 'exact', head: true })
        .not('gps_lat', 'is', null);

      return {
        totalPhotos,
        photosWithFaces,
        smilingPhotos,
        photosWithGPS
      };
    } catch (error) {
      console.error('Erro ao obter estatísticas:', error);
      return null;
    }
  }

  /**
   * Lista todas as pessoas marcadas
   */
  async listPeople() {
    try {
      const { data, error } = await this.supabase
        .from('photos')
        .select('person_tag')
        .not('person_tag', 'is', null)
        .order('person_tag');

      if (error) throw error;

      // Remove duplicatas
      const uniquePeople = [...new Set(data.map(p => p.person_tag))];
      return uniquePeople;
    } catch (error) {
      console.error('Erro ao listar pessoas:', error);
      return [];
    }
  }

  /**
   * Lista todos os locais marcados
   */
  async listLocations() {
    try {
      const { data, error } = await this.supabase
        .from('photos')
        .select('location_name')
        .not('location_name', 'is', null)
        .order('location_name');

      if (error) throw error;

      // Remove duplicatas
      const uniqueLocations = [...new Set(data.map(l => l.location_name))];
      return uniqueLocations;
    } catch (error) {
      console.error('Erro ao listar locais:', error);
      return [];
    }
  }
}

export default new DatabaseService();

