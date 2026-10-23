/**
 * Nomor halaman yang ditampilkan: awal, jendela 5 angka di sekitar halaman aktif,
 * dan akhir, dengan elipsis. Contoh (desain): halaman 1 dari 7 → 1 2 3 4 5 … 7.
 */
export function getPageItems(page, totalPages) {
  if (totalPages <= 6) return Array.from({ length: totalPages }, (_, i) => i + 1);
  const start = Math.max(1, Math.min(page - 2, totalPages - 4));
  const end = Math.min(totalPages, Math.max(page + 2, 5));
  const items = [];
  for (let i = start; i <= end; i += 1) items.push(i);
  if (start > 1) items.unshift(1, ...(start > 2 ? ['…'] : []));
  if (end < totalPages) items.push(...(end < totalPages - 1 ? ['…'] : []), totalPages);
  return items;
}
