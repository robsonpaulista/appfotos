import axios from 'axios';

/**
 * Serviço de Geocoding Reverso (GPS → Cidade)
 * Usa OpenStreetMap Nominatim (100% GRATUITO, sem API key)
 */
class GeocodingService {
  constructor() {
    // OpenStreetMap Nominatim - GRATUITO
    this.baseUrl = 'https://nominatim.openstreetmap.org';
    this.cache = new Map(); // Cache para evitar requisições repetidas
  }

  /**
   * Converte coordenadas GPS em nome de cidade
   * @param {number} lat - Latitude
   * @param {number} lng - Longitude
   * @returns {Promise<Object>} Informações de localização
   */
  async reverseGeocode(lat, lng) {
    if (!lat || !lng) return null;

    // Verificar cache
    const cacheKey = `${lat.toFixed(3)},${lng.toFixed(3)}`; // Precisão de ~100m
    if (this.cache.has(cacheKey)) {
      console.log(`📍 Geocoding (cache): ${cacheKey}`);
      return this.cache.get(cacheKey);
    }

    try {
      console.log(`🌍 Geocoding: ${lat}, ${lng}`);
      
      const response = await axios.get(`${this.baseUrl}/reverse`, {
        params: {
          lat,
          lon: lng,
          format: 'json',
          addressdetails: 1,
          'accept-language': 'pt-BR'
        },
        headers: {
          'User-Agent': 'PhotoFinder/1.0' // Nominatim requer User-Agent
        },
        timeout: 5000 // 5 segundos timeout
      });

      const data = response.data;
      
      if (!data || !data.address) {
        console.log('⚠️  Nenhuma informação de endereço encontrada');
        return null;
      }

      const address = data.address;
      
      // Extrair cidade (tentar várias propriedades)
      const city = address.city 
        || address.town 
        || address.village 
        || address.municipality 
        || address.county
        || address.state_district;

      const state = address.state;
      const country = address.country;

      const result = {
        city: city || null,
        state: state || null,
        country: country || null,
        displayName: data.display_name || null,
        fullAddress: this.formatAddress(address)
      };

      // Salvar no cache
      this.cache.set(cacheKey, result);
      
      console.log(`✅ Localização encontrada: ${result.city}, ${result.state}`);
      
      return result;
    } catch (error) {
      console.error('Erro no geocoding:', error.message);
      
      // Em caso de erro, retornar null ao invés de falhar
      return null;
    }
  }

  /**
   * Formata endereço de forma legível
   * @param {Object} address - Objeto de endereço do Nominatim
   * @returns {string} Endereço formatado
   */
  formatAddress(address) {
    const parts = [];
    
    if (address.city || address.town || address.village) {
      parts.push(address.city || address.town || address.village);
    }
    
    if (address.state) {
      parts.push(address.state);
    }
    
    if (address.country) {
      parts.push(address.country);
    }

    return parts.join(', ');
  }

  /**
   * Processa várias fotos em lote com delay (para não sobrecarregar API)
   * @param {Array} photos - Array de fotos com GPS
   * @returns {Promise<Array>} Fotos com localização preenchida
   */
  async batchReverseGeocode(photos) {
    const results = [];
    
    for (let i = 0; i < photos.length; i++) {
      const photo = photos[i];
      
      if (photo.gps_lat && photo.gps_lng) {
        try {
          const location = await this.reverseGeocode(photo.gps_lat, photo.gps_lng);
          
          if (location && location.city) {
            results.push({
              photo_id: photo.id,
              drive_id: photo.drive_id,
              city: location.city,
              state: location.state,
              country: location.country,
              location_name: location.fullAddress
            });
          }

          // Delay de 1 segundo entre requisições (política do Nominatim)
          if (i < photos.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        } catch (error) {
          console.error(`Erro ao processar foto ${photo.id}:`, error.message);
        }
      }
    }

    return results;
  }

  /**
   * Limpa cache
   */
  clearCache() {
    this.cache.clear();
    console.log('🗑️  Cache de geocoding limpo');
  }

  /**
   * Retorna tamanho do cache
   */
  getCacheSize() {
    return this.cache.size;
  }
}

export default new GeocodingService();

