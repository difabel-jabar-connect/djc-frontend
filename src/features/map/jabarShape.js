import { JABAR_OUTLINE } from './jabarOutline';

/**
 * Siluet Jawa Barat sebagai motif halaman (viewBox 640×490, garis besar disederhanakan).
 * `projectToShape` memetakan lat/lng penyedia ke koordinat siluet secara linear terhadap
 * kotak batas provinsi — cukup untuk ilustrasi, bukan untuk navigasi (pakai peta SIG).
 */
export const SHAPE_WIDTH = 640;
export const SHAPE_HEIGHT = 490;
export const SHAPE_PATH = JABAR_OUTLINE;

// Kotak batas siluet (px) dan kotak geografis yang diwakilinya.
const BOX = { left: 28.9, right: 606.3, top: 28.9, bottom: 471.5 };
const GEO = { west: 106.38, east: 108.84, north: -5.9, south: -7.82 };

export function projectToShape(lat, lng) {
  const x = BOX.left + ((lng - GEO.west) / (GEO.east - GEO.west)) * (BOX.right - BOX.left);
  const y = BOX.top + ((GEO.north - lat) / (GEO.north - GEO.south)) * (BOX.bottom - BOX.top);
  return { x, y, left: (x / SHAPE_WIDTH) * 100, top: (y / SHAPE_HEIGHT) * 100 };
}
