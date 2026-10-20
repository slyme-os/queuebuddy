'use client';

import React, { useEffect, useRef, useState } from 'react';
import type { Map as MLMap, Marker, StyleSpecification } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import type { Office } from '@/types';
import { OFFICE_TYPE_META } from '@/lib/utils';
import { mapKey, mapProvider } from '@/lib/config';

interface OfficeMapProps {
  offices: Office[];
  selectedOffice: Office | null;
  onSelectOffice: (office: Office) => void;
}

const BENGALURU: [number, number] = [77.5946, 12.9716];

// Free dark basemap (CARTO, OSM data) — matches the app's dark UI, no API key required.
const darkStyle: StyleSpecification = {
  version: 8,
  sources: {
    carto: {
      type: 'raster',
      tiles: ['a', 'b', 'c', 'd'].map((s) => `https://${s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png`),
      tileSize: 256,
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> · © <a href="https://carto.com/attributions">CARTO</a>',
      maxzoom: 19,
    },
  },
  layers: [{ id: 'carto', type: 'raster', source: 'carto' }],
};

function buildMarker(office: Office) {
  const meta = OFFICE_TYPE_META[office.office_type];
  const root = document.createElement('button');
  root.type = 'button';
  root.className = 'qb-marker group flex flex-col items-center focus:outline-none';
  root.setAttribute('aria-label', office.name);

  const pill = document.createElement('span');
  pill.className =
    'qb-pill flex items-center gap-1.5 rounded-full border-2 bg-[#0B0F16] px-2.5 py-1 text-[11px] font-semibold text-white shadow-lg transition-transform duration-150 group-hover:scale-110';
  pill.style.borderColor = meta.color;
  if (office.status === 'coming_soon') {
    pill.style.borderStyle = 'dashed';
    pill.style.opacity = '0.8';
  }

  const dot = document.createElement('span');
  dot.textContent = meta.emoji;
  const label = document.createElement('span');
  label.className = 'max-w-[120px] truncate';
  label.textContent = office.area;
  pill.append(dot, label);

  const tip = document.createElement('span');
  tip.className = 'h-2 w-2 -mt-1 rotate-45';
  tip.style.background = meta.color;

  root.append(pill, tip);
  return { root, pill };
}

export const OfficeMap: React.FC<OfficeMapProps> = ({ offices, selectedOffice, onSelectOffice }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MLMap | null>(null);
  const markersRef = useRef(new Map<string, { marker: Marker; pill: HTMLElement }>());
  const onSelectRef = useRef(onSelectOffice);
  onSelectRef.current = onSelectOffice;
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);

  // Initialise once.
  useEffect(() => {
    let disposed = false;
    let map: MLMap | null = null;

    import('maplibre-gl')
      .then(({ default: maplibregl }) => {
        if (disposed || !containerRef.current) return;
        const style =
          mapProvider === 'maptiler' && mapKey
            ? `https://api.maptiler.com/maps/streets-v2-dark/style.json?key=${mapKey}`
            : darkStyle;
        map = new maplibregl.Map({
          container: containerRef.current,
          style,
          center: BENGALURU,
          zoom: 11.2,
          attributionControl: { compact: true },
          cooperativeGestures: false,
        });
        map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');
        map.on('load', () => {
          if (disposed) return;
          mapRef.current = map;
          setReady(true);
        });
        map.on('error', () => undefined);
      })
      .catch(() => setFailed(true));

    const markers = markersRef.current;
    return () => {
      disposed = true;
      markers.forEach(({ marker }) => marker.remove());
      markers.clear();
      map?.remove();
      mapRef.current = null;
    };
  }, []);

  // Sync markers with the filtered office list.
  useEffect(() => {
    const map = mapRef.current;
    if (!ready || !map) return;
    let cancelled = false;

    import('maplibre-gl').then(({ default: maplibregl }) => {
      if (cancelled) return;
      const wanted = new Set(offices.map((o) => o.id));
      markersRef.current.forEach((entry, id) => {
        if (!wanted.has(id)) {
          entry.marker.remove();
          markersRef.current.delete(id);
        }
      });
      offices.forEach((office) => {
        if (markersRef.current.has(office.id)) return;
        const { root, pill } = buildMarker(office);
        root.addEventListener('click', (e) => {
          e.stopPropagation();
          onSelectRef.current(office);
        });
        const marker = new maplibregl.Marker({ element: root, anchor: 'bottom' }).setLngLat([office.lng, office.lat]).addTo(map);
        markersRef.current.set(office.id, { marker, pill });
      });

      if (offices.length > 1) {
        const bounds = new maplibregl.LngLatBounds();
        offices.forEach((o) => bounds.extend([o.lng, o.lat]));
        map.fitBounds(bounds, { padding: 60, maxZoom: 13, duration: 600 });
      } else if (offices.length === 1) {
        map.flyTo({ center: [offices[0].lng, offices[0].lat], zoom: 13.5, duration: 600 });
      }
    });

    return () => {
      cancelled = true;
    };
  }, [offices, ready]);

  // Highlight + fly to the selected office.
  useEffect(() => {
    markersRef.current.forEach(({ pill, marker }, id) => {
      const active = id === selectedOffice?.id;
      pill.style.background = active ? '#FBBF24' : '#0B0F16';
      pill.style.color = active ? '#06080D' : '#fff';
      marker.getElement().style.zIndex = active ? '10' : '';
    });
    if (ready && selectedOffice && mapRef.current) {
      mapRef.current.flyTo({ center: [selectedOffice.lng, selectedOffice.lat], zoom: 13.5, duration: 700 });
    }
  }, [selectedOffice, ready, offices]);

  return (
    <div className="relative h-full min-h-[300px] w-full overflow-hidden rounded-2xl border border-white/[0.07] bg-ink-900">
      <div ref={containerRef} className="absolute inset-0" />
      {!ready && !failed && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="h-full w-full animate-pulse bg-gradient-to-br from-ink-800 to-ink-900" />
        </div>
      )}
      {failed && (
        <div className="absolute inset-0 flex items-center justify-center p-6 text-center text-sm text-slate-500">
          The map couldn&apos;t load. The office list still works.
        </div>
      )}
    </div>
  );
};
