import React, { useState, useEffect } from 'react';
import type { PhotoFilters as Filters, EmotionLikelihood } from '@/types/photo';
import { api } from '@/utils/api';

interface PhotoFiltersProps {
  filters: Filters;
  onFilterChange: (filters: Partial<Filters>) => void;
}

export function PhotoFilters({ filters, onFilterChange }: PhotoFiltersProps) {
  const [person, setPerson] = useState<string>(filters.person || '');
  const [withoutPerson, setWithoutPerson] = useState<boolean>(filters.withoutPerson || false);
  const [city, setCity] = useState<string>(filters.city || '');
  const [dateFrom, setDateFrom] = useState<string>(filters.dateFrom || '');
  const [dateTo, setDateTo] = useState<string>(filters.dateTo || '');
  const [minFaces, setMinFaces] = useState<string>(filters.minFaces?.toString() || '');
  const [maxFaces, setMaxFaces] = useState<string>(filters.maxFaces?.toString() || '');
  const [joy, setJoy] = useState<EmotionLikelihood | ''>(filters.joy || '');
  
  const [cities, setCities] = useState<string[]>([]);
  const [eventTypes, setEventTypes] = useState<string[]>([]);
  const [eventType, setEventType] = useState<string>('');

  useEffect(() => {
    loadOptions();
  }, []);

  const loadOptions = async () => {
    try {
      const [citiesData, typesData] = await Promise.all([
        api.getCities(),
        api.getEventTypes()
      ]);
      setCities(citiesData || []);
      setEventTypes(typesData || []);
    } catch (error) {
      console.error('Erro ao carregar opções:', error);
    }
  };

  const handleApplyFilters = () => {
    onFilterChange({
      person: withoutPerson ? undefined : (person || undefined),
      withoutPerson: withoutPerson || undefined,
      city: city || undefined,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
      minFaces: minFaces ? parseInt(minFaces) : undefined,
      maxFaces: maxFaces ? parseInt(maxFaces) : undefined,
      joy: joy || undefined,
      eventType: eventType || undefined,
    });
  };

  const handleClearFilters = () => {
    setPerson('');
    setWithoutPerson(false);
    setCity('');
    setDateFrom('');
    setDateTo('');
    setMinFaces('');
    setMaxFaces('');
    setJoy('');
    setEventType('');
    onFilterChange({});
  };

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-slate-200/60">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center shadow-lg shadow-primary-500/30">
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-slate-900">Filtros</h2>
      </div>

      {/* Atalhos de Data */}
      <div className="flex flex-wrap gap-2 mb-4">
        <span className="text-xs font-medium text-slate-600 flex items-center">Atalhos:</span>
        <button
          type="button"
          onClick={() => {
            // Usar horário local (Brasil) ao invés de UTC
            const hoje = new Date();
            const ano = hoje.getFullYear();
            const mes = String(hoje.getMonth() + 1).padStart(2, '0');
            const dia = String(hoje.getDate()).padStart(2, '0');
            const dataLocal = `${ano}-${mes}-${dia}`;
            setDateFrom(dataLocal);
            setDateTo(dataLocal);
          }}
          className="px-3 py-1 bg-primary-100 text-primary-700 text-xs font-medium rounded-lg hover:bg-primary-200 transition-colors"
        >
          Hoje
        </button>
        <button
          type="button"
          onClick={() => {
            const hoje = new Date();
            const semanaAtras = new Date(hoje);
            semanaAtras.setDate(hoje.getDate() - 7);
            
            const formatarData = (data: Date) => {
              const ano = data.getFullYear();
              const mes = String(data.getMonth() + 1).padStart(2, '0');
              const dia = String(data.getDate()).padStart(2, '0');
              return `${ano}-${mes}-${dia}`;
            };
            
            setDateFrom(formatarData(semanaAtras));
            setDateTo(formatarData(hoje));
          }}
          className="px-3 py-1 bg-primary-100 text-primary-700 text-xs font-medium rounded-lg hover:bg-primary-200 transition-colors"
        >
          Última Semana
        </button>
        <button
          type="button"
          onClick={() => {
            const hoje = new Date();
            const mesAtras = new Date(hoje);
            mesAtras.setMonth(hoje.getMonth() - 1);
            
            const formatarData = (data: Date) => {
              const ano = data.getFullYear();
              const mes = String(data.getMonth() + 1).padStart(2, '0');
              const dia = String(data.getDate()).padStart(2, '0');
              return `${ano}-${mes}-${dia}`;
            };
            
            setDateFrom(formatarData(mesAtras));
            setDateTo(formatarData(hoje));
          }}
          className="px-3 py-1 bg-primary-100 text-primary-700 text-xs font-medium rounded-lg hover:bg-primary-200 transition-colors"
        >
          Último Mês
        </button>
        <button
          type="button"
          onClick={() => {
            setDateFrom('');
            setDateTo('');
          }}
          className="px-3 py-1 bg-slate-100 text-slate-600 text-xs font-medium rounded-lg hover:bg-slate-200 transition-colors"
        >
          Limpar Datas
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <div>
          <label htmlFor="person" className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            Pessoa
          </label>
          <select
            id="person"
            value={withoutPerson ? 'sem_pessoa' : (person || '')}
            onChange={(e) => {
              if (e.target.value === 'sem_pessoa') {
                setWithoutPerson(true);
                setPerson('');
              } else {
                setWithoutPerson(false);
                setPerson('');
              }
            }}
            className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors bg-white"
          >
            <option value="">Todas</option>
            <option value="sem_pessoa">🔍 Sem pessoa marcada</option>
          </select>
          {!withoutPerson && (
            <input
              type="text"
              value={person}
              onChange={(e) => setPerson(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleApplyFilters()}
              placeholder="Ou digite um nome..."
              className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors mt-2"
            />
          )}
        </div>

        <div>
          <label htmlFor="joy" className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Expressão
          </label>
          <select
            id="joy"
            value={joy}
            onChange={(e) => setJoy(e.target.value as EmotionLikelihood | '')}
            className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors bg-white"
          >
            <option value="">Todas</option>
            <option value="VERY_LIKELY">Muito feliz</option>
            <option value="LIKELY">Feliz</option>
            <option value="POSSIBLE">Neutro</option>
            <option value="UNLIKELY">Sério</option>
          </select>
        </div>

        <div>
          <label htmlFor="city" className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Cidade
          </label>
          <select
            id="city"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors bg-white"
          >
            <option value="">Todas as cidades</option>
            {cities.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="eventType" className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>
            Tipo de Evento
          </label>
          <select
            id="eventType"
            value={eventType}
            onChange={(e) => setEventType(e.target.value)}
            className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors bg-white"
          >
            <option value="">Todos os tipos</option>
            {eventTypes.map((type) => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="dateFrom" className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Data Inicial
          </label>
          <input
            id="dateFrom"
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
          />
          {dateFrom && (
            <p className="text-xs text-slate-500 mt-1">
              A partir de {new Date(dateFrom + 'T00:00:00').toLocaleDateString('pt-BR')}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="dateTo" className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Data Final
          </label>
          <input
            id="dateTo"
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
          />
          {dateTo && (
            <p className="text-xs text-slate-500 mt-1">
              Até {new Date(dateTo + 'T23:59:59').toLocaleDateString('pt-BR')}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="minFaces" className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            Mín. Rostos
          </label>
          <input
            id="minFaces"
            type="number"
            value={minFaces}
            onChange={(e) => setMinFaces(e.target.value)}
            placeholder="0"
            min="0"
            className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
          />
        </div>

        <div>
          <label htmlFor="maxFaces" className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            Máx. Rostos
          </label>
          <input
            id="maxFaces"
            type="number"
            value={maxFaces}
            onChange={(e) => setMaxFaces(e.target.value)}
            placeholder="10"
            min="0"
            className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          onClick={handleApplyFilters}
          className="px-6 py-2.5 bg-gradient-to-r from-primary-600 to-primary-500 text-white font-semibold rounded-xl hover:from-primary-700 hover:to-primary-600 transition-all duration-300 shadow-lg shadow-primary-500/30 hover:shadow-xl hover:shadow-primary-500/40 hover:-translate-y-0.5"
        >
          Aplicar Filtros
        </button>
        <button
          onClick={handleClearFilters}
          className="px-6 py-2.5 bg-white text-slate-700 font-medium rounded-xl border border-slate-300 hover:bg-slate-50 transition-colors"
        >
          Limpar
        </button>
      </div>
    </div>
  );
}

