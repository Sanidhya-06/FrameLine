import { useMemo, useState } from 'react';
import { ComposableMap, Geographies, Geography, ZoomableGroup } from 'react-simple-maps';
import type { CountryGroup } from '../types';
import world from 'world-atlas/countries-110m.json';

export const GEO_URL = world;
const ISO_NUMERIC: Record<string, string> = { USA: '840', GBR: '826', IND: '356', RUS: '643', ISR: '376', PSE: '275', IRN: '364', CHN: '156', JPN: '392', AUS: '036', CAN: '124', DEU: '276', FRA: '250', UKR: '804', TUR: '792', EGY: '818', LBN: '422', ARE: '784', SAU: '682', QAT: '634', KOR: '410', BRA: '076', MEX: '484', ZAF: '710', ITA: '380', ESP: '724', NLD: '528', POL: '616', PAK: '586', BGD: '050', NGA: '566', KEN: '404' };
export function normalizeIso(value: unknown): string {
  const code = String(value ?? '').trim().toUpperCase();
  if (/^\d{1,3}$/.test(code)) return code.padStart(3, '0');
  const alpha2: Record<string, string> = { US: '840', GB: '826', IN: '356', RU: '643', IL: '376', PS: '275', IR: '364', CN: '156', JP: '392', AU: '036', CA: '124', DE: '276', FR: '250', UA: '804', TR: '792', EG: '818', LB: '422', AE: '784', SA: '682', QA: '634', KR: '410', BR: '076', MX: '484', ZA: '710', IT: '380', ES: '724', NL: '528', PL: '616', PK: '586', BD: '050', NG: '566', KE: '404' };
  return ISO_NUMERIC[code] || alpha2[code] || code;
}
export function matchCountryGroup(geo: { id?: unknown; properties?: Record<string, unknown> }, groups: Record<string, CountryGroup>): CountryGroup | undefined {
  const props = geo.properties || {};
  const candidates = [geo.id, props.ISO_A3, props.ADM0_A3, props.ISO_A2, props.name].filter(Boolean).map(normalizeIso);
  return Object.values(groups).find((group) => [group.iso_code, (group as CountryGroup & { country_code?: string }).country_code].filter(Boolean).some((code) => candidates.includes(normalizeIso(code))));
}
export function CountryMap({ groups, selected, onSelect }: { groups: Record<string, CountryGroup>; selected: string | null; onSelect: (code: string) => void }) {
  const [position, setPosition] = useState({ coordinates: [0, 15] as [number, number], zoom: 1 });
  const [hovered, setHovered] = useState<CountryGroup | null>(null);
  const matched = useMemo(() => Object.values(groups).filter((g) => g.articles.length > 0), [groups]);
  return <div className="map-stage" aria-label="Interactive world coverage map">
    <div className="map-grid" />
    <ComposableMap projectionConfig={{ scale: 148 }} width={1000} height={560} style={{ width: '100%', height: '100%' }}>
      <ZoomableGroup center={position.coordinates} zoom={position.zoom} minZoom={1} maxZoom={5} onMoveEnd={(next) => setPosition((current) => ({ coordinates: (next.coordinates as [number, number] | undefined) || current.coordinates, zoom: next.zoom ?? current.zoom }))}>
        <Geographies geography={GEO_URL}>{({ geographies }) => geographies.map((geo) => {
          const group = matchCountryGroup(geo, groups); const active = group?.iso_code === selected;
          return <Geography key={geo.rsmKey} geography={geo} onMouseEnter={() => group && setHovered(group)} onMouseLeave={() => setHovered(null)} onClick={() => group && onSelect(group.iso_code)} tabIndex={group ? 0 : -1} role={group ? 'button' : undefined} aria-label={group ? `${group.display_name}, ${group.article_count} articles` : undefined}
            onKeyDown={(event) => { if (group && (event.key === 'Enter' || event.key === ' ')) { event.preventDefault(); onSelect(group.iso_code); } }}
            style={{ default: { fill: group ? '#0b5274' : '#091826', stroke: '#26bde3', strokeWidth: group ? .65 : .35, outline: 'none', filter: group ? 'drop-shadow(0 0 5px rgba(28,193,234,.68))' : 'none' }, hover: { fill: group ? '#1681a5' : '#102637', stroke: '#66e8ff', strokeWidth: .8, outline: 'none', cursor: group ? 'pointer' : 'default' }, pressed: { fill: '#23a8ca', stroke: '#a2f5ff', outline: 'none' } } as never} className={active ? 'geo-selected' : ''} />;
        })}</Geographies>
      </ZoomableGroup>
    </ComposableMap>
    <div className="map-orbit orbit-one"/><div className="map-orbit orbit-two"/>
    {hovered && <div className="map-tooltip"><strong>{hovered.display_name}</strong><span>{hovered.article_count} {hovered.article_count === 1 ? 'article' : 'articles'}</span></div>}
    <div className="map-zoom" aria-label="Map zoom controls"><button onClick={() => setPosition((p) => ({ ...p, zoom: Math.min(5, p.zoom * 1.35) }))} aria-label="Zoom in">+</button><button onClick={() => setPosition((p) => ({ ...p, zoom: Math.max(1, p.zoom / 1.35) }))} aria-label="Zoom out">−</button><button onClick={() => setPosition({ coordinates: [0, 15], zoom: 1 })} aria-label="Reset map">↺</button></div>
    <div className="map-legend"><i/><span>Coverage returned</span><b>{matched.length} {matched.length === 1 ? 'country' : 'countries'}</b></div>
  </div>;
}
