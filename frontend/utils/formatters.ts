/**
 * Funções auxiliares para formatação de dados
 */

import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

/**
 * Formata uma data no padrão brasileiro
 */
export function formatDate(date: string | Date, pattern: string = 'dd/MM/yyyy'): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return format(dateObj, pattern, { locale: ptBR });
}

/**
 * Formata data e hora
 */
export function formatDateTime(date: string | Date): string {
  return formatDate(date, "dd/MM/yyyy 'às' HH:mm");
}

/**
 * Converte likelihood em texto legível
 */
export function formatLikelihood(likelihood?: string | null): string {
  const map: Record<string, string> = {
    'VERY_LIKELY': 'Muito provável',
    'LIKELY': 'Provável',
    'POSSIBLE': 'Possível',
    'UNLIKELY': 'Improvável',
    'VERY_UNLIKELY': 'Muito improvável',
    'UNKNOWN': 'Desconhecido',
  };

  return likelihood ? map[likelihood] || likelihood : 'Desconhecido';
}

/**
 * Converte expressão em emoji e texto
 */
export function formatExpression(expression?: string | null): { emoji: string; text: string } {
  const map: Record<string, { emoji: string; text: string }> = {
    'joy': { emoji: '😊', text: 'Feliz' },
    'sorrow': { emoji: '😢', text: 'Triste' },
    'anger': { emoji: '😠', text: 'Bravo' },
    'surprise': { emoji: '😮', text: 'Surpreso' },
    'neutral': { emoji: '😐', text: 'Neutro' },
    'unknown': { emoji: '❓', text: 'Desconhecido' },
  };

  return expression ? map[expression] || map.unknown : map.unknown;
}

/**
 * Formata tamanho de arquivo
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Formata coordenadas GPS
 */
export function formatCoordinates(lat: number | null, lng: number | null): string {
  if (lat === null || lng === null) return 'Sem localização';
  
  return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
}

/**
 * Formata número de rostos detectados
 */
export function formatFacesCount(count: number): string {
  if (count === 0) return 'Nenhum rosto detectado';
  if (count === 1) return '1 rosto detectado';
  return `${count} rostos detectados`;
}

/**
 * Trunca texto com reticências
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
}

