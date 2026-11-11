import { useEffect } from 'react';
import { motion, useMotionValue, useReducedMotion, useSpring, useTransform } from 'motion/react';
import { JABAR_BORDERS, JABAR_OUTLINE } from '@/features/map/jabarOutline';
import './topoCanvas.css';

/** Cincin kontur: garis provinsi diperkecil bertahap ke arah dataran tinggi Bandung. */
const RINGS = [1, 0.84, 0.68, 0.53, 0.39, 0.26];
const CENTER = { x: 330, y: 280 };

/** Gunung utama (perkiraan posisi pada ilustrasi 640×490) → kontur konsentris. */
const PEAKS = [
  { name: 'Gede Pangrango', x: 196, y: 262, r: 46 },
  { name: 'Tangkuban Parahu', x: 320, y: 214, r: 38 },
  { name: 'Papandayan', x: 352, y: 352, r: 34 },
  { name: 'Ciremai', x: 506, y: 236, r: 40 },
];

const ringTransform = (k) => `translate(${CENTER.x * (1 - k)} ${CENTER.y * (1 - k)}) scale(${k})`;

/**
 * Peta kontur Jawa Barat 3D berlapis: dasar wilayah, cincin kontur, kontur gunung, dan pin
 * pada kedalaman berbeda; condong mengikuti pointer. `pins` = [{ id, x, y, label }] dalam
 * koordinat 640×490 (projectToShape). Murni dekoratif — daftar yang bisa diklik ada di luar.
 * Parallax & animasi masuk mati untuk pengguna reduced-motion.
 *
 * Animasi masuk sengaja di CSS (topoCanvas.css), bukan Motion: berjalan di GPU sehingga tidak
 * tersendat saat halaman masih memuat, dan opacity dipasang di pembungkus luar — opacity < 1 pada
 * bidang preserve-3d meratakan lapisannya lalu "meloncat" ke 3D di akhir animasi.
 */
export default function TopoCanvas({ pins = [], className = '' }) {
  const reduce = useReducedMotion();
  const px = useMotionValue(0);
  const py = useMotionValue(0);
  // Pegas lembut tanpa pantulan agar condong mengikuti pointer terasa halus.
  const sx = useSpring(px, { stiffness: 45, damping: 20, mass: 1.1 });
  const sy = useSpring(py, { stiffness: 45, damping: 20, mass: 1.1 });
  const rotateX = useTransform(sy, [-1, 1], [58, 50]);
  const rotateZ = useTransform(sx, [-1, 1], [-29, -21]);
  const shiftX = useTransform(sx, [-1, 1], [-10, 10]);
  const shiftY = useTransform(sy, [-1, 1], [-8, 8]);
  const shiftX2 = useTransform(sx, [-1, 1], [-20, 20]);
  const shiftY2 = useTransform(sy, [-1, 1], [-16, 16]);

  useEffect(() => {
    if (reduce) return undefined;
    const move = (event) => {
      px.set((event.clientX / window.innerWidth) * 2 - 1);
      py.set((event.clientY / window.innerHeight) * 2 - 1);
    };
    window.addEventListener('pointermove', move, { passive: true });
    return () => window.removeEventListener('pointermove', move);
  }, [reduce, px, py]);

  return (
    <div className={`topo ${className}`} aria-hidden="true">
      <motion.div
        className="topo__plane"
        style={reduce ? { rotateX: 54, rotateZ: -25 } : { rotateX, rotateZ }}
      >
        <svg className="topo__layer" viewBox="0 0 640 490">
          <path d={JABAR_OUTLINE} className="topo__land" />
          {JABAR_BORDERS.map((d) => (
            <path key={d} d={d} className="topo__border" />
          ))}
        </svg>

        <motion.svg
          className="topo__layer"
          viewBox="0 0 640 490"
          style={reduce ? { z: 36 } : { x: shiftX, y: shiftY, z: 36 }}
        >
          {RINGS.map((k, i) => (
            <path
              key={k}
              d={JABAR_OUTLINE}
              transform={ringTransform(k)}
              className="topo__ring"
              style={{ opacity: 0.75 - i * 0.09 }}
            />
          ))}
          {PEAKS.map((peak) =>
            [1, 0.72, 0.46, 0.22].map((k) => (
              <ellipse
                key={`${peak.name}-${k}`}
                cx={peak.x}
                cy={peak.y}
                rx={peak.r * k * 1.25}
                ry={peak.r * k}
                className="topo__peak"
              />
            )),
          )}
        </motion.svg>

        <motion.svg
          className="topo__layer topo__layer--pins"
          viewBox="0 0 640 490"
          style={reduce ? { z: 84 } : { x: shiftX2, y: shiftY2, z: 84 }}
        >
          {pins.map((pin) => (
            // Posisi di <g> luar; animasi muncul di <g> dalam (transform CSS tidak menimpa posisi).
            <g key={pin.id} transform={`translate(${pin.x} ${pin.y})`}>
              <g className="topo__pin">
                <line y2="-26" className="topo__stem" />
                <circle r="4.5" className="topo__dot" />
                <circle cy="-26" r="6" className="topo__head" />
                {pin.label && (
                  <text x="11" y="-22" className="topo__label">
                    {pin.label}
                  </text>
                )}
              </g>
            </g>
          ))}
        </motion.svg>
      </motion.div>
    </div>
  );
}
