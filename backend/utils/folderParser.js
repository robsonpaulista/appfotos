/**
 * Utilitário para extrair informações de nomes de pastas
 * Padrão esperado: ano-mes-cidade-tipo
 * Exemplo: 2024-11-Teresina-Eventos
 */

/**
 * Extrai tags do nome da pasta
 * @param {string} folderName - Nome da pasta
 * @returns {Object} Tags extraídas
 */
export function extractTagsFromFolderName(folderName) {
  if (!folderName) return {};

  // Padrão: ano-mes-cidade-tipo
  // Exemplos:
  // - 2024-11-Teresina-Eventos
  // - 2024-01-PicosDoCerrado-Agenda
  // - 2023-12-Teresina-Casamento
  
  const pattern = /^(\d{4})-(\d{1,2})-([^-]+)-(.+)$/;
  const match = folderName.match(pattern);

  if (match) {
    const [_, year, month, city, type] = match;
    
    return {
      event_year: parseInt(year),
      event_month: parseInt(month),
      event_city: city.replace(/([A-Z])/g, ' $1').trim(), // PicosDoCerrado → Picos Do Cerrado
      event_type: type,
      folder_path: folderName
    };
  }

  // Tentar padrões alternativos
  
  // Padrão: ano-mes-cidade (sem tipo)
  const pattern2 = /^(\d{4})-(\d{1,2})-(.+)$/;
  const match2 = folderName.match(pattern2);
  
  if (match2) {
    const [_, year, month, city] = match2;
    return {
      event_year: parseInt(year),
      event_month: parseInt(month),
      event_city: city.replace(/([A-Z])/g, ' $1').trim(),
      folder_path: folderName
    };
  }

  // Padrão: apenas ano-cidade-tipo
  const pattern3 = /^(\d{4})-([^-]+)-(.+)$/;
  const match3 = folderName.match(pattern3);
  
  if (match3) {
    const [_, year, city, type] = match3;
    return {
      event_year: parseInt(year),
      event_city: city.replace(/([A-Z])/g, ' $1').trim(),
      event_type: type,
      folder_path: folderName
    };
  }

  // Se não encontrar padrão, salvar apenas o caminho
  return {
    folder_path: folderName
  };
}

/**
 * Extrai tags do caminho completo da pasta
 * @param {string} folderPath - Caminho completo (pode ter subpastas)
 * @returns {Object} Tags extraídas
 */
export function extractTagsFromPath(folderPath) {
  if (!folderPath) return {};

  // Pegar apenas a última parte do caminho
  const parts = folderPath.split('/');
  const folderName = parts[parts.length - 1];

  return extractTagsFromFolderName(folderName);
}

/**
 * Normaliza nome de cidade (remove espaços extras, capitaliza)
 * @param {string} city - Nome da cidade
 * @returns {string} Nome normalizado
 */
export function normalizeCity(city) {
  if (!city) return null;
  
  return city
    .replace(/([A-Z])/g, ' $1') // PicosDoCerrado → Picos Do Cerrado
    .trim()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Lista todos os padrões válidos
 */
export const VALID_PATTERNS = [
  '2024-11-Teresina-Eventos',
  '2024-01-PicosDoCerrado-Agenda',
  '2024-12-Teresina',
  '2024-Teresina-Casamento'
];

/**
 * Testa se um nome de pasta é válido
 * @param {string} folderName - Nome da pasta
 * @returns {boolean} Se é válido
 */
export function isValidFolderPattern(folderName) {
  if (!folderName) return false;
  
  const tags = extractTagsFromFolderName(folderName);
  return tags.event_year !== undefined;
}

