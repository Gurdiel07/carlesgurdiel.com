import { useEffect, useRef, useState } from 'react';

// Deterministic, illustrative upward-drifting curve (not real performance data).
const POINTS: number[] = (() => {
  const n = 54;
  let v = 18;
  let seed = 9;
  const rnd = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };
  const arr: number[] = [];
  for (let i = 0; i < n; i++) { v += (rnd() - 0.4) * 3.6; v = Math.max(2, v); arr.push(v); }
  return arr;
})();

export default function EquityCurve() {
  const [draw, setDraw] = useState(0);
  const ref = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { setDraw(1); return; }
    let raf = 0;
    const animate = () => {
      const start = performance.now();
      const dur = 1500;
      const tick = (t: number) => {
        const p = Math.min(1, (t - start) / dur);
        setDraw(p);
        if (p < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    };
    const io = new IntersectionObserver((e) => {
      if (e[0]?.isIntersecting) { animate(); io.disconnect(); }
    }, { threshold: 0.4 });
    if (ref.current) io.observe(ref.current);
    return () => { cancelAnimationFrame(raf); io.disconnect(); };
  }, []);

  const W = 280, H = 84, pad = 5;
  const max = Math.max(...POINTS), min = Math.min(...POINTS);
  const pts = POINTS.map((y, i) => {
    const x = pad + (i / (POINTS.length - 1)) * (W - pad * 2);
    const yy = H - pad - ((y - min) / (max - min)) * (H - pad * 2);
    return [x, yy] as const;
  });
  const path = pts.map((p, i) => (i === 0 ? `M${p[0].toFixed(1)},${p[1].toFixed(1)}` : `L${p[0].toFixed(1)},${p[1].toFixed(1)}`)).join(' ');
  const last = pts[pts.length - 1];
  const area = `${path} L${last[0].toFixed(1)},${H - pad} L${pts[0][0].toFixed(1)},${H - pad} Z`;
  const len = 1000;

  return (
    <svg ref={ref} viewBox={`0 0 ${W} ${H}`} width="100%" role="img"
      aria-label="Illustrative equity curve" style={{ display: 'block' }}>
      <defs>
        <linearGradient id="eqg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(79,157,255,0.32)" />
          <stop offset="100%" stopColor="rgba(79,157,255,0)" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#eqg)" opacity={draw} />
      <path d={path} fill="none" stroke="#4f9dff" strokeWidth="1.8" strokeLinecap="round"
        strokeLinejoin="round" strokeDasharray={len} strokeDashoffset={len * (1 - draw)} />
    </svg>
  );
}
