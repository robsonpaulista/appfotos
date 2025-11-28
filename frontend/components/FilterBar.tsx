'use client';

import { useState, useEffect } from 'react';
import { FaSearch, FaSmile, FaMapMarkerAlt, FaCalendar, FaUser } from 'react-icons/fa';
import { photosApi, api } from '@/utils/api';
import type { PhotoFilters } from '@/types/photo';

interface FilterBarProps {
  onFilterChange: (filters: PhotoFilters) => void;
}

export default function FilterBar({ onFilterChange }: FilterBarProps) {
  const [people, setPeople] = useState<string[]>([]);
  const [locations, setLocations] = useState<string[]>([]);
  const [year, setYear] = useState<number | undefined>(undefined);
  const [filters, setFilters] = useState<PhotoFilters>({
    person: undefined,
    joy: undefined,
    city: undefined,
    minFaces: undefined,
  });

  useEffect(() => {
    loadFilterOptions();
  }, []);

  const loadFilterOptions = async () => {
    try {
      const [peopleData, locationsData] = await Promise.all([
        api.getTags(),
        api.getCities(),
      ]);
      setPeople(peopleData || []);
      setLocations(locationsData || []);
    } catch (error) {
      console.error('Erro ao carregar opções de filtro:', error);
    }
  };

  const handleFilterChange = (key: keyof PhotoFilters, value: string | number | undefined) => {
    const newFilters = { ...filters, [key]: value || undefined };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleYearChange = (yearValue: number | undefined) => {
    setYear(yearValue);
    const newFilters = { ...filters };
    if (yearValue) {
      newFilters.dateFrom = `${yearValue}-01-01`;
      newFilters.dateTo = `${yearValue}-12-31`;
    } else {
      delete newFilters.dateFrom;
      delete newFilters.dateTo;
    }
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const clearFilters = () => {
    setYear(undefined);
    const emptyFilters: PhotoFilters = {};
    setFilters(emptyFilters);
    onFilterChange(emptyFilters);
  };

  const hasActiveFilters = Object.values(filters).some(v => v !== undefined) || year !== undefined;

  return (
    <div className="bg-white shadow-sm rounded-lg p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900 flex items-center">
          <FaSearch className="mr-2 text-primary-600" />
          Filtros
        </h2>
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="text-sm text-gray-600 hover:text-primary-600"
          >
            Limpar filtros
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Filtro de Pessoa */}
        <div className="flex flex-col">
          <label className="text-sm font-medium text-gray-700 mb-1 flex items-center">
            <FaUser className="mr-1 text-gray-500" />
            Pessoa
          </label>
          <select
            value={filters.person || ''}
            onChange={(e) => handleFilterChange('person', e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="">Todas</option>
            {people.map((person) => (
              <option key={person} value={person}>
                {person}
              </option>
            ))}
          </select>
        </div>

        {/* Filtro de Expressão */}
        <div className="flex flex-col">
          <label className="text-sm font-medium text-gray-700 mb-1 flex items-center">
            <FaSmile className="mr-1 text-gray-500" />
            Expressão
          </label>
          <select
            value={filters.joy || ''}
            onChange={(e) => handleFilterChange('joy', e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="">Todas</option>
            <option value="VERY_LIKELY">Muito sorridente</option>
            <option value="LIKELY">Sorridente</option>
            <option value="POSSIBLE">Possível sorriso</option>
          </select>
        </div>

        {/* Filtro de Local */}
        <div className="flex flex-col">
          <label className="text-sm font-medium text-gray-700 mb-1 flex items-center">
            <FaMapMarkerAlt className="mr-1 text-gray-500" />
            Local
          </label>
          <select
            value={filters.city || ''}
            onChange={(e) => handleFilterChange('city', e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="">Todos</option>
            {locations.map((location) => (
              <option key={location} value={location}>
                {location}
              </option>
            ))}
          </select>
        </div>

        {/* Filtro de Ano */}
        <div className="flex flex-col">
          <label className="text-sm font-medium text-gray-700 mb-1 flex items-center">
            <FaCalendar className="mr-1 text-gray-500" />
            Ano
          </label>
          <input
            type="number"
            value={year || ''}
            onChange={(e) => handleYearChange(e.target.value ? parseInt(e.target.value) : undefined)}
            placeholder="Ex: 2024"
            min="2000"
            max={new Date().getFullYear()}
            className="border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
        </div>

        {/* Filtro de Número de Rostos */}
        <div className="flex flex-col">
          <label className="text-sm font-medium text-gray-700 mb-1">
            Mín. de rostos
          </label>
          <input
            type="number"
            value={filters.minFaces || ''}
            onChange={(e) => handleFilterChange('minFaces', e.target.value ? parseInt(e.target.value) : undefined)}
            placeholder="Ex: 3"
            min="1"
            max="20"
            className="border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
        </div>
      </div>
    </div>
  );
}

