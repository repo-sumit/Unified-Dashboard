import { useId, useLayoutEffect, useRef, useState } from "react";

/** Lightweight inline trend sparkline (pure SVG — no chart lib overhead).
 *  `baseline` draws a faint dashed reference line at that data value (so a
 *  rise/fall reads at a glance); `emphasizeEnd` haloes the endpoint dot;
 *  `responsive` measures the parent and fills its full width (no right gap). */
export function Sparkline({
  data, width = 84, height = 28, color = "#386AF6", strokeWidth = 2, baseline, emphasizeEnd = false, responsive = false,
}: {
  data: number[]; width?: number; height?: number; color?: string; strokeWidth?: number;
  baseline?: number; emphasizeEnd?: boolean; responsive?: boolean;
}) {
  const id = useId();
  const wrapRef = useRef<HTMLDivElement>(null);
  const [measured, setMeasured] = useState<number | null>(null);
  useLayoutEffect(() => {
    if (!responsive || !wrapRef.current) return;
    const el = wrapRef.current;
    const update = () => setMeasured(el.clientWidth || null);
    update();
    if (typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [responsive]);

  const W = responsive ? measured ?? width : width;
  if (!data.length) {
    const empty = <svg width={W} height={height} aria-hidden />;
    return responsive ? <div ref={wrapRef} className="w-full">{empty}</div> : empty;
  }
  const viewBox = `0 0 ${W} ${height}`;
  const span = baseline != null ? [...data, baseline] : data;
  const min = Math.min(...span);
  const max = Math.max(...span);
  const range = max - min || 1;
  const pad = strokeWidth + 2;
  const yOf = (v: number) => height - pad - ((v - min) / range) * (height - pad * 2);
  const pts = data.map((v, i) => {
    const x = data.length === 1 ? W / 2 : pad + (i / (data.length - 1)) * (W - pad * 2);
    return [x, yOf(v)] as const;
  });
  const line = pts.map((p) => p.join(",")).join(" ");
  const area = `${pad},${height} ${line} ${W - pad},${height}`;
  const end = pts[pts.length - 1];
  const baseY = baseline != null ? yOf(baseline) : null;
  const svg = (
    <svg width={W} height={height} viewBox={viewBox} className="max-w-full overflow-visible" aria-hidden>
      <defs>
        <linearGradient id={`sp-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.22" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={area} fill={`url(#sp-${id})`} />
      {baseY != null && (
        <line x1={pad} y1={baseY} x2={W - pad} y2={baseY} stroke={color} strokeOpacity="0.28" strokeWidth="1" strokeDasharray="3 3" />
      )}
      <polyline points={line} fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      {emphasizeEnd && <circle cx={end[0]} cy={end[1]} r={strokeWidth + 3.5} fill={color} opacity="0.16" />}
      <circle cx={end[0]} cy={end[1]} r={strokeWidth + 0.5} fill={color} />
    </svg>
  );
  return responsive ? <div ref={wrapRef} className="w-full">{svg}</div> : svg;
}
