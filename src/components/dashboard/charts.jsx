import { useId } from 'react';

/**
 * Grafik SVG ringan berbasis data (tanpa library). Nilai `null` = belum ada data:
 * tidak digambar pada garis, dan tampil sebagai batang abu-abu pendek.
 * Setiap grafik punya teks alternatif lengkap lewat `ariaLabel`.
 */

const scale = (value, min, max, top, bottom) =>
  bottom - ((value - min) / (max - min)) * (bottom - top);

function Axis({ ticks, min, max, left, right, top, bottom, format }) {
  return ticks.map((tick, index) => {
    const y = scale(tick, min, max, top, bottom);
    return (
      <g key={tick}>
        <line
          x1={left}
          x2={right}
          y1={y}
          y2={y}
          stroke={index === 0 ? '#cbd5e1' : '#eef0f3'}
          strokeWidth={index === 0 ? 1.5 : 1}
        />
        <text x={left - 8} y={y + 4} textAnchor="end">
          {format(tick)}
        </text>
      </g>
    );
  });
}

/** Kotak keterangan nilai di dekat titik sorotan (di kiri titik). */
function Callout({ x, y, title, value, width }) {
  const boxX = Math.max(4, x - width - 12);
  const boxY = Math.max(4, y - 22);
  return (
    <g className="chart__callout">
      <rect x={boxX} y={boxY} width={width} height="40" rx="8" fill="#0b3c6e" />
      <path
        d={`M${boxX + width} ${boxY + 16} L${boxX + width + 8} ${boxY + 20} L${boxX + width} ${boxY + 24} Z`}
        fill="#0b3c6e"
      />
      <text x={boxX + 10} y={boxY + 16} fill="#cbd5e1" fontSize="12" fontWeight="600">
        {title}
      </text>
      <text x={boxX + 10} y={boxY + 33} fill="#fff" fontWeight="700">
        {value}
      </text>
    </g>
  );
}

export function LineChart({
  data,
  min,
  max,
  ticks,
  tickFormat = String,
  labels,
  ariaLabel,
  width = 312,
  height = 200,
  left = 48,
  callout,
}) {
  const gradientId = useId();
  const right = width - 8;
  const top = 20;
  const bottom = height - 36;
  const step = (right - left) / (data.length - 1);
  const points = data
    .map((value, i) =>
      value == null ? null : [left + i * step, scale(value, min, max, top, bottom)],
    )
    .filter(Boolean);
  const line = points
    .map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`)
    .join(' ');
  const last = points[points.length - 1];

  return (
    <svg className="chart" viewBox={`0 0 ${width} ${height}`} role="img" aria-label={ariaLabel}>
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#0b3c6e" stopOpacity="0.16" />
          <stop offset="1" stopColor="#0b3c6e" stopOpacity="0" />
        </linearGradient>
      </defs>
      <Axis {...{ ticks, min, max, left, right, top, bottom }} format={tickFormat} />
      <path d={`${line} L${last[0]} ${bottom} L${left} ${bottom} Z`} fill={`url(#${gradientId})`} />
      <path
        d={line}
        fill="none"
        stroke="#0b3c6e"
        strokeWidth="2.75"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {points.slice(0, -1).map(([x, y]) => (
        <circle key={x} cx={x} cy={y} r="3.5" fill="#fff" stroke="#0b3c6e" strokeWidth="2" />
      ))}
      <circle cx={last[0]} cy={last[1]} r="6" fill="#14a3a3" stroke="#fff" strokeWidth="2.5" />
      {callout && <Callout x={last[0]} y={last[1]} {...callout} />}
      {labels.map((label, i) =>
        label ? (
          <text
            key={`${label}-${i}`}
            x={left + i * step}
            y={height - 14}
            textAnchor={i === labels.length - 1 ? 'end' : 'middle'}
          >
            {label}
          </text>
        ) : null,
      )}
    </svg>
  );
}

export function BarChart({
  data,
  max,
  ticks,
  labels,
  ariaLabel,
  width = 312,
  height = 200,
  left = 40,
  callout,
}) {
  const right = width - 8;
  const top = 20;
  const bottom = height - 36;
  const slot = (right - left) / data.length;
  const barWidth = Math.min(14, slot * 0.6);
  const lastIndex = data.reduce((acc, value, i) => (value == null ? acc : i), -1);

  return (
    <svg className="chart" viewBox={`0 0 ${width} ${height}`} role="img" aria-label={ariaLabel}>
      <Axis {...{ ticks, min: 0, max, left, right, top, bottom }} format={String} />
      {data.map((value, i) => {
        const x = left + i * slot + (slot - barWidth) / 2;
        if (value == null) {
          return (
            <rect key={i} x={x} y={bottom - 4} width={barWidth} height="4" rx="2" fill="#e5e7eb" />
          );
        }
        const y = scale(value, 0, max, top, bottom);
        return (
          <rect
            key={i}
            x={x}
            y={y}
            width={barWidth}
            height={bottom - y}
            rx="3"
            fill={i === lastIndex ? '#0c7272' : '#14a3a3'}
          />
        );
      })}
      {callout && lastIndex >= 0 && (
        <Callout
          x={left + lastIndex * slot + slot / 2}
          y={scale(data[lastIndex], 0, max, top, bottom)}
          {...callout}
        />
      )}
      {labels.map((label, i) =>
        label ? (
          <text
            key={`${label}-${i}`}
            x={left + i * slot + slot / 2}
            y={height - 14}
            textAnchor="middle"
          >
            {label}
          </text>
        ) : null,
      )}
    </svg>
  );
}

/** Cincin progres (mis. capaian target). */
export function DonutProgress({ percent, size = 96, label }) {
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 96 96"
      role="img"
      aria-label={label}
      className="donut"
    >
      <circle cx="48" cy="48" r={radius} fill="none" stroke="#e3f6f6" strokeWidth="11" />
      <circle
        cx="48"
        cy="48"
        r={radius}
        fill="none"
        stroke="#14a3a3"
        strokeWidth="11"
        strokeLinecap="round"
        strokeDasharray={`${(percent / 100) * circumference} ${circumference}`}
        transform="rotate(-90 48 48)"
      />
      <text x="48" y="55" textAnchor="middle" className="donut__value">
        {percent}%
      </text>
    </svg>
  );
}
