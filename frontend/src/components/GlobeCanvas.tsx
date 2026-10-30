/**
 * GlobeCanvas
 * -----------
 * A rotating 3D orthographic globe rendered on a <canvas>.
 * Uses d3-geo + the same world-atlas TopoJSON that the map screen uses.
 *
 * Props:
 *   size        — diameter in px (clamped internally)
 *   reduceMotion — if true, globe is static (no rotation)
 *   litCodes    — set of ISO-alpha-3 codes to highlight (completed feeds)
 *   onUnmount   — optional cleanup callback (for tests)
 */
import { useEffect, useRef, useCallback } from 'react';
import {
  geoOrthographic,
  geoPath,
  geoGraticule,
} from 'd3-geo';
// world-atlas is already bundled – import the pre-parsed JSON directly
import world from 'world-atlas/countries-110m.json';
import { feature } from 'topojson-client';

// ── Colour tokens (sampled from loading-bg.png) ──────────────────────────
const CLR = {
  sphere:     '#04080f',   // deep navy — ocean fill
  land:       '#0a1628',   // slightly lighter — land base
  landLit:    '#0b3a52',   // highlighted country
  outline:    '#16c8e8',   // cyan — land stroke
  outlineLit: '#4aeeff',   // brighter cyan for lit countries
  graticule:  'rgba(22, 200, 232, 0.10)',
  rim:        'rgba(228, 72, 210, 0.45)',  // magenta rim light
  glow:       'rgba(22, 200, 232, 0.28)',
  node:       '#16c8e8',
};

// ── Static geometry (parsed once) ────────────────────────────────────────
// topojson 'countries' object ID maps to ISO-numeric; we build alpha-3→numeric
// lookup from CountryMap's ISO_NUMERIC table so we reuse the same mapping.
const ISO_NUMERIC: Record<string, string> = {
  USA:'840',GBR:'826',IND:'356',RUS:'643',ISR:'376',PSE:'275',IRN:'364',
  CHN:'156',JPN:'392',AUS:'036',CAN:'124',DEU:'276',FRA:'250',UKR:'804',
  TUR:'792',EGY:'818',LBN:'422',ARE:'784',SAU:'682',QAT:'634',KOR:'410',
  BRA:'076',MEX:'484',ZAF:'710',ITA:'380',ESP:'724',NLD:'528',POL:'616',
  PAK:'586',BGD:'050',NGA:'566',KEN:'404',
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const COUNTRIES = feature(world as any, (world as any).objects.countries);

// A few lon/lat positions for pulsing nodes on the globe
const NODES: [number, number][] = [
  [-74, 40.7],  // New York
  [2.35, 48.85], // Paris
  [37.6, 55.75], // Moscow
  [116.4, 39.9], // Beijing
  [77.2, 28.6],  // Delhi
  [31.2, 30.05], // Cairo
  [151.2, -33.9],// Sydney
];

interface GlobeCanvasProps {
  size: number;
  reduceMotion?: boolean;
  litCodes?: Set<string>;
}

export function GlobeCanvas({ size, reduceMotion = false, litCodes }: GlobeCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef    = useRef<number>(0);
  const rotRef    = useRef(0); // current longitude rotation

  // Build set of numeric IDs to highlight
  const litNumeric = useCallback(() => {
    const s = new Set<string>();
    if (litCodes) {
      for (const code of litCodes) {
        const num = ISO_NUMERIC[code.toUpperCase()];
        if (num) s.add(num);
      }
    }
    return s;
  }, [litCodes]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dpr  = Math.min(window.devicePixelRatio || 1, 2);
    const s    = size;
    canvas.width  = s * dpr;
    canvas.height = s * dpr;
    canvas.style.width  = `${s}px`;
    canvas.style.height = `${s}px`;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.scale(dpr, dpr);

    const cx = s / 2;
    const cy = s / 2;
    const r  = s / 2 - 4;

    // Orthographic projection centred on current rotation
    const proj = geoOrthographic()
      .scale(r)
      .translate([cx, cy])
      .clipAngle(90);

    const path   = geoPath(proj, ctx);
    const grat   = geoGraticule()();
    const litSet = litNumeric();

    let lastTime = performance.now();
    const RPM    = 1 / 16; // one revolution per 16 s

    let hidden = false;
    const onVisibility = () => { hidden = document.hidden; };
    document.addEventListener('visibilitychange', onVisibility);

    function draw(now: number) {
      if (!ctx || !canvas) return;
      if (!hidden && !reduceMotion) {
        const dt = (now - lastTime) / 1000;
        rotRef.current = (rotRef.current - dt * 360 * RPM) % 360;
      }
      lastTime = now;

      proj.rotate([rotRef.current, -10, 0]); // slight axial tilt

      ctx.clearRect(0, 0, s, s);

      // ── Atmosphere glow ──────────────────────────────────────────
      const glowGrad = ctx.createRadialGradient(cx, cy, r * 0.88, cx, cy, r * 1.22);
      glowGrad.addColorStop(0, 'rgba(22, 200, 232, 0.18)');
      glowGrad.addColorStop(1, 'transparent');
      ctx.beginPath();
      ctx.arc(cx, cy, r * 1.22, 0, Math.PI * 2);
      ctx.fillStyle = glowGrad;
      ctx.fill();

      // ── Ocean sphere ─────────────────────────────────────────────
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      const oceanGrad = ctx.createRadialGradient(cx - r * 0.25, cy - r * 0.25, 0, cx, cy, r);
      oceanGrad.addColorStop(0, '#061422');
      oceanGrad.addColorStop(1, CLR.sphere);
      ctx.fillStyle = oceanGrad;
      ctx.fill();

      // ── Clip to sphere ────────────────────────────────────────────
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.clip();

      // ── Graticule ────────────────────────────────────────────────
      ctx.beginPath();
      path(grat);
      ctx.strokeStyle = CLR.graticule;
      ctx.lineWidth   = 0.4;
      ctx.stroke();

      // ── Countries ────────────────────────────────────────────────
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      for (const feat of (COUNTRIES as any).features) {
        const id  = String(feat.id ?? '').padStart(3, '0');
        const lit = litSet.has(id);
        ctx.beginPath();
        path(feat);
        ctx.fillStyle   = lit ? CLR.landLit : CLR.land;
        ctx.fill();
        ctx.strokeStyle = lit ? CLR.outlineLit : CLR.outline;
        ctx.lineWidth   = lit ? 0.8 : 0.45;
        ctx.stroke();
      }

      ctx.restore();

      // ── Sphere outline ───────────────────────────────────────────
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(22, 200, 232, 0.35)';
      ctx.lineWidth   = 1;
      ctx.stroke();

      // ── Magenta rim light ────────────────────────────────────────
      const rimGrad = ctx.createRadialGradient(cx + r * 0.62, cy - r * 0.18, 0, cx + r * 0.62, cy, r * 0.6);
      rimGrad.addColorStop(0, CLR.rim);
      rimGrad.addColorStop(1, 'transparent');
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fillStyle = rimGrad;
      ctx.fill();

      // ── Pulsing nodes ────────────────────────────────────────────
      const pulse = 0.5 + 0.5 * Math.sin(now / 700);
      for (const coord of NODES) {
        const pt = proj(coord);
        if (!pt) continue;
        const [px, py] = pt;
        // only draw if on visible hemisphere
        if (px < cx - r || px > cx + r || py < cy - r || py > cy + r) continue;
        const alpha = 0.35 + 0.55 * pulse;
        ctx.beginPath();
        ctx.arc(px, py, 2.5, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(22, 200, 232, ${alpha})`;
        ctx.fill();
        // outer ring
        ctx.beginPath();
        ctx.arc(px, py, 4.5 + pulse * 2, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(22, 200, 232, ${alpha * 0.4})`;
        ctx.lineWidth = 0.8;
        ctx.stroke();
      }

      rafRef.current = requestAnimationFrame(draw);
    }

    rafRef.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(rafRef.current);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [size, reduceMotion, litNumeric]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      data-testid="globe-canvas"
      style={{ display: 'block', borderRadius: '50%' }}
    />
  );
}
