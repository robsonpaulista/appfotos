'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { FaTimes, FaMapMarkerAlt, FaCalendar, FaUser, FaEdit, FaSave } from 'react-icons/fa';
import type { Photo } from '@/types/photo';
import { photosApi } from '@/utils/api';
import { formatDate, formatDateTime, formatFacesCount, formatCoordinates } from '@/utils/formatters';
import { useAuth } from '@/hooks/useAuth';

interface PhotoModalProps {
  photo: Photo;
  onClose: () => void;
}

export default function PhotoModal({ photo, onClose }: PhotoModalProps) {
  const { imageToken } = useAuth();
  const [editMode, setEditMode] = useState<boolean>(false);
  const [personTag, setPersonTag] = useState<string>(photo.person_tag || '');
  const [locationName, setLocationName] = useState<string>(photo.location_name || '');
  const [saving, setSaving] = useState<boolean>(false);

  useEffect(() => {
    // Previne scroll do body quando o modal está aberto
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await photosApi.updateTags(photo.id, {
        person: personTag,
        location: locationName,
      });
      photo.person_tag = personTag;
      photo.location_name = locationName;
      setEditMode(false);
    } catch (error) {
      console.error('Erro ao salvar tags:', error);
      alert('Erro ao salvar tags');
    } finally {
      setSaving(false);
    }
  };

  // Determinar expressão principal baseada nas likelihoods
  const getMainExpression = () => {
    if (photo.joy_likelihood === 'VERY_LIKELY' || photo.joy_likelihood === 'LIKELY') {
      return { emoji: '😊', text: 'Feliz' };
    }
    if (photo.sorrow_likelihood === 'VERY_LIKELY' || photo.sorrow_likelihood === 'LIKELY') {
      return { emoji: '😢', text: 'Triste' };
    }
    if (photo.anger_likelihood === 'VERY_LIKELY' || photo.anger_likelihood === 'LIKELY') {
      return { emoji: '😠', text: 'Bravo' };
    }
    if (photo.surprise_likelihood === 'VERY_LIKELY' || photo.surprise_likelihood === 'LIKELY') {
      return { emoji: '😮', text: 'Surpreso' };
    }
    return { emoji: '😐', text: 'Neutro' };
  };
  
  const expression = getMainExpression();

  return (
    <div
      className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col md:flex-row"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Imagem */}
        <div className="md:w-2/3 bg-black relative">
          <Image
            src={photosApi.getImageUrl(photo.id, imageToken)}
            alt={photo.name}
            width={photo.width || 1200}
            height={photo.height || 800}
            className="w-full h-full object-contain"
          />
        </div>

        {/* Detalhes */}
        <div className="md:w-1/3 p-6 overflow-y-auto">
          <div className="flex justify-between items-start mb-4">
            <h2 className="text-xl font-bold text-gray-900 flex-1 pr-4">
              {photo.name}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 flex-shrink-0"
            >
              <FaTimes size={24} />
            </button>
          </div>

          {/* Informações editáveis */}
          <div className="space-y-4 mb-6">
            <div>
              <label className="flex items-center text-sm font-medium text-gray-700 mb-1">
                <FaUser className="mr-2 text-gray-500" />
                Pessoa
                {!editMode && (
                  <button
                    onClick={() => setEditMode(true)}
                    className="ml-auto text-primary-600 hover:text-primary-700"
                  >
                    <FaEdit size={14} />
                  </button>
                )}
              </label>
              {editMode ? (
                <input
                  type="text"
                  value={personTag}
                  onChange={(e) => setPersonTag(e.target.value)}
                  placeholder="Nome da pessoa"
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                />
              ) : (
                <p className="text-gray-900">{photo.person_tag || 'Não marcado'}</p>
              )}
            </div>

            <div>
              <label className="flex items-center text-sm font-medium text-gray-700 mb-1">
                <FaMapMarkerAlt className="mr-2 text-gray-500" />
                Local
              </label>
              {editMode ? (
                <input
                  type="text"
                  value={locationName}
                  onChange={(e) => setLocationName(e.target.value)}
                  placeholder="Nome do local"
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                />
              ) : (
                <p className="text-gray-900">{photo.location_name || 'Não marcado'}</p>
              )}
            </div>

            {editMode && (
              <div className="flex gap-2">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 disabled:bg-gray-400 flex items-center justify-center"
                >
                  <FaSave className="mr-2" />
                  {saving ? 'Salvando...' : 'Salvar'}
                </button>
                <button
                  onClick={() => {
                    setEditMode(false);
                    setPersonTag(photo.person_tag || '');
                    setLocationName(photo.location_name || '');
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancelar
                </button>
              </div>
            )}
          </div>

          {/* Metadados */}
          <div className="space-y-3 border-t pt-4">
            <h3 className="font-semibold text-gray-900 mb-2">Metadados</h3>

            <div>
              <p className="text-sm text-gray-500 flex items-center">
                <FaCalendar className="mr-2" />
                Data
              </p>
              <p className="text-gray-900">{formatDateTime(photo.created_at)}</p>
            </div>

            {photo.width && photo.height && (
              <div>
                <p className="text-sm text-gray-500">Dimensões</p>
                <p className="text-gray-900">
                  {photo.width} × {photo.height} px
                </p>
              </div>
            )}

            {(photo.gps_lat || photo.gps_lng) && (
              <div>
                <p className="text-sm text-gray-500">Coordenadas GPS</p>
                <p className="text-gray-900 font-mono text-xs">
                  {formatCoordinates(photo.gps_lat, photo.gps_lng)}
                </p>
              </div>
            )}
          </div>

          {/* Análise de IA */}
          {photo.faces_detected > 0 && (
            <div className="space-y-3 border-t pt-4 mt-4">
              <h3 className="font-semibold text-gray-900 mb-2">Análise de IA</h3>

              <div>
                <p className="text-sm text-gray-500">Rostos detectados</p>
                <p className="text-gray-900">{formatFacesCount(photo.faces_detected)}</p>
              </div>

              {(photo.joy_likelihood === 'VERY_LIKELY' || photo.joy_likelihood === 'LIKELY' ||
                photo.sorrow_likelihood === 'VERY_LIKELY' || photo.sorrow_likelihood === 'LIKELY' ||
                photo.anger_likelihood === 'VERY_LIKELY' || photo.anger_likelihood === 'LIKELY' ||
                photo.surprise_likelihood === 'VERY_LIKELY' || photo.surprise_likelihood === 'LIKELY') && (
                <div>
                  <p className="text-sm text-gray-500">Expressão</p>
                  <p className="text-gray-900">
                    {expression.emoji} {expression.text}
                  </p>
                </div>
              )}

            </div>
          )}
        </div>
      </div>
    </div>
  );
}

