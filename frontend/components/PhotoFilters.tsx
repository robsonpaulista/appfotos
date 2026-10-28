import React, { useState, useEffect } from 'react';
import type { PhotoFilters as Filters, EmotionLikelihood } from '@/types/photo';
import { api } from '@/utils/api';

interface PhotoFiltersProps {
  filters: Filters;
  onFilterChange: (filters: Partial<Filters>) => void;
}

const fieldClass =
  'w-full border border-ink/12 bg-white px-3.5 py-2.5 text-sm text-ink outline-none transition-colors placeholder:text-ink/30 focus:border-primary-600 focus:ring-2 focus:ring-primary-500/20';

const labelClass = 'mb-1.5 block text-sm font-medium text-ink/65';

const chipClass =
  'px-3 py-1.5 text-xs font-medium text-ink/70 transition-colors hover:bg-primary-500/20 hover:text-ink';

function formatLocalDate(data: Date): string {
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, '0');
  const dia = String(data.getDate()).padStart(2, '0');
  return `${ano}-${mes}-${dia}`;
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
        api.getEventTypes(),
      ]);
      setCities(citiesData || []);
      setEventTypes(typesData || []);
    } catch (error) {
      console.error('Erro ao carregar opções:', error);
    }
  };

  const handleApplyFilters = () => {
    onFilterChange({
      person: withoutPerson ? undefined : person || undefined,
      withoutPerson: withoutPerson || undefined,
      city: city || undefined,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
      minFaces: minFaces ? parseInt(minFaces, 10) : undefined,
      maxFaces: maxFaces ? parseInt(maxFaces, 10) : undefined,
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
    <section className="border border-ink/8 bg-white px-5 py-6 sm:px-6">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-ink">Filtros</h2>
          <p className="mt-0.5 text-sm text-ink/50">Refine o acervo por pessoa, local, data ou evento</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className={`${chipClass} bg-primary-500/15`}
            onClick={() => {
              const hoje = new Date();
              const dataLocal = formatLocalDate(hoje);
              setDateFrom(dataLocal);
              setDateTo(dataLocal);
            }}
          >
            Hoje
          </button>
          <button
            type="button"
            className={`${chipClass} bg-primary-500/15`}
            onClick={() => {
              const hoje = new Date();
              const semanaAtras = new Date(hoje);
              semanaAtras.setDate(hoje.getDate() - 7);
              setDateFrom(formatLocalDate(semanaAtras));
              setDateTo(formatLocalDate(hoje));
            }}
          >
            Última semana
          </button>
          <button
            type="button"
            className={`${chipClass} bg-primary-500/15`}
            onClick={() => {
              const hoje = new Date();
              const mesAtras = new Date(hoje);
              mesAtras.setMonth(hoje.getMonth() - 1);
              setDateFrom(formatLocalDate(mesAtras));
              setDateTo(formatLocalDate(hoje));
            }}
          >
            Último mês
          </button>
          <button
            type="button"
            className={`${chipClass} bg-ink/5`}
            onClick={() => {
              setDateFrom('');
              setDateTo('');
            }}
          >
            Limpar datas
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        <div>
          <label htmlFor="person" className={labelClass}>
            Pessoa
          </label>
          <select
            id="person"
            value={withoutPerson ? 'sem_pessoa' : person || ''}
            onChange={(e) => {
              if (e.target.value === 'sem_pessoa') {
                setWithoutPerson(true);
                setPerson('');
              } else {
                setWithoutPerson(false);
                setPerson('');
              }
            }}
            className={fieldClass}
          >
            <option value="">Todas</option>
            <option value="sem_pessoa">Sem pessoa marcada</option>
          </select>
          {!withoutPerson && (
            <input
              type="text"
              value={person}
              onChange={(e) => setPerson(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleApplyFilters()}
              placeholder="Buscar por nome…"
              className={`${fieldClass} mt-2`}
            />
          )}
        </div>

        <div>
          <label htmlFor="joy" className={labelClass}>
            Expressão
          </label>
          <select
            id="joy"
            value={joy}
            onChange={(e) => setJoy(e.target.value as EmotionLikelihood | '')}
            className={fieldClass}
          >
            <option value="">Todas</option>
            <option value="VERY_LIKELY">Muito feliz</option>
            <option value="LIKELY">Feliz</option>
            <option value="POSSIBLE">Neutro</option>
            <option value="UNLIKELY">Sério</option>
          </select>
        </div>

        <div>
          <label htmlFor="city" className={labelClass}>
            Cidade
          </label>
          <select
            id="city"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className={fieldClass}
          >
            <option value="">Todas as cidades</option>
            {cities.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="eventType" className={labelClass}>
            Tipo de evento
          </label>
          <select
            id="eventType"
            value={eventType}
            onChange={(e) => setEventType(e.target.value)}
            className={fieldClass}
          >
            <option value="">Todos os tipos</option>
            {eventTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="dateFrom" className={labelClass}>
            Data inicial
          </label>
          <input
            id="dateFrom"
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className={fieldClass}
          />
        </div>

        <div>
          <label htmlFor="dateTo" className={labelClass}>
            Data final
          </label>
          <input
            id="dateTo"
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className={fieldClass}
          />
        </div>

        <div>
          <label htmlFor="minFaces" className={labelClass}>
            Mín. rostos
          </label>
          <input
            id="minFaces"
            type="number"
            value={minFaces}
            onChange={(e) => setMinFaces(e.target.value)}
            placeholder="0"
            min={0}
            className={fieldClass}
          />
        </div>

        <div>
          <label htmlFor="maxFaces" className={labelClass}>
            Máx. rostos
          </label>
          <input
            id="maxFaces"
            type="number"
            value={maxFaces}
            onChange={(e) => setMaxFaces(e.target.value)}
            placeholder="10"
            min={0}
            className={fieldClass}
          />
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={handleApplyFilters}
          className="bg-primary-500 px-5 py-2.5 text-sm font-semibold text-ink transition-colors hover:bg-primary-400"
        >
          Aplicar filtros
        </button>
        <button
          type="button"
          onClick={handleClearFilters}
          className="border border-ink/12 bg-white px-5 py-2.5 text-sm font-medium text-ink/70 transition-colors hover:border-ink/25 hover:text-ink"
        >
          Limpar
        </button>
      </div>
    </section>
  );
}
