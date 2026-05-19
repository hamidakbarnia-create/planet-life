'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

export interface CityOption {
  name: string;
  short: string;
  lat: number;
  lon: number;
}

export function CityAutocomplete({
  value,
  onChange,
  onSelect,
  placeholder,
  searchingLabel,
  noResultsLabel,
}: {
  value: string;
  onChange: (v: string) => void;
  onSelect: (city: CityOption) => void;
  placeholder: string;
  searchingLabel: string;
  noResultsLabel: string;
}) {
  const [cities, setCities] = useState<CityOption[]>([]);
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setShow(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const search = useCallback((q: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (q.length < 2) {
      setCities([]);
      return;
    }
    setLoading(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/cities?q=${encodeURIComponent(q)}`);
        setCities(await res.json());
      } catch {
        setCities([]);
      }
      setLoading(false);
    }, 300);
  }, []);

  return (
    <div ref={ref} className="relative">
      <input
        type="text"
        value={value}
        placeholder={placeholder}
        onChange={(e) => {
          onChange(e.target.value);
          search(e.target.value);
          setShow(true);
        }}
        onFocus={() => value.length >= 2 && setShow(true)}
        className="fi w-full px-3 py-2.5 text-sm rounded-[10px]"
        style={{
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.08)',
          color: 'white',
        }}
      />
      {show && (loading || cities.length > 0) && (
        <div
          className="absolute z-50 w-full mt-1 rounded-xl overflow-hidden shadow-2xl"
          style={{
            background: '#0d1220',
            border: '1px solid rgba(255,255,255,0.1)',
          }}
        >
          {loading && (
            <div className="fi px-4 py-3 text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>
              {searchingLabel}
            </div>
          )}
          {!loading && cities.length === 0 && (
            <div className="fi px-4 py-3 text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>
              {noResultsLabel}
            </div>
          )}
          {cities.map((city, i) => (
            <div
              key={i}
              className="px-4 py-2.5 cursor-pointer transition-colors hover:bg-amber-500/10"
              onMouseDown={() => {
                onSelect(city);
                setShow(false);
              }}
            >
              <div className="fi text-sm" style={{ color: 'rgba(255,255,255,0.8)' }}>
                {city.short}
              </div>
              <div className="fi text-[11px] truncate" style={{ color: 'rgba(255,255,255,0.3)' }}>
                {city.name}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
