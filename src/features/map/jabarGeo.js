/**
 * Geografi Jawa Barat untuk peta SIG (Leaflet, koordinat WGS84 [lat, lng]).
 * Garis batas disederhanakan (perkiraan) — cukup untuk memfokuskan peta; ganti dengan
 * GeoJSON batas resmi (BIG / BPS) bila tersedia.
 */
export const JABAR_RING = [
  [-6.09, 106.97],
  [-5.93, 107.03],
  [-5.92, 107.2],
  [-6.02, 107.42],
  [-6.1, 107.62],
  [-6.2, 107.85],
  [-6.24, 108.1],
  [-6.22, 108.33],
  [-6.33, 108.4],
  [-6.55, 108.48],
  [-6.7, 108.6],
  [-6.8, 108.8],
  [-6.98, 108.78],
  [-7.13, 108.75],
  [-7.28, 108.7],
  [-7.42, 108.75],
  [-7.62, 108.8],
  [-7.7, 108.64],
  [-7.7, 108.42],
  [-7.76, 108.1],
  [-7.76, 107.8],
  [-7.68, 107.5],
  [-7.52, 107.2],
  [-7.44, 106.92],
  [-7.38, 106.5],
  [-7.2, 106.42],
  [-6.98, 106.45],
  [-6.8, 106.4],
  [-6.6, 106.42],
  [-6.45, 106.55],
  [-6.37, 106.72],
  [-6.37, 106.83],
  [-6.33, 106.92],
  [-6.22, 106.97],
];

/** Kotak batas Jawa Barat: [[selatan, barat], [utara, timur]]. */
export const JABAR_BOUNDS = [
  [-7.82, 106.38],
  [-5.9, 108.84],
];

/** Batas geser peta (sedikit lebih luas agar pin di tepi tetap nyaman dilihat). */
export const JABAR_MAX_BOUNDS = [
  [-8.3, 105.9],
  [-5.4, 109.3],
];

/** Cincin "seluruh dunia" untuk masker di luar Jawa Barat. */
export const WORLD_RING = [
  [-90, -180],
  [-90, 180],
  [90, 180],
  [90, -180],
];

/** Apakah titik berada di dalam kotak batas `{ south, west, north, east }`. */
export const inArea = (point, area) =>
  !area ||
  (point.lat >= area.south &&
    point.lat <= area.north &&
    point.lng >= area.west &&
    point.lng <= area.east);
