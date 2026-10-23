const ratingFormatter = new Intl.NumberFormat('id-ID', {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});
const numberFormatter = new Intl.NumberFormat('id-ID');

/** 4.9 → "4,9" */
export const formatRating = (value) => ratingFormatter.format(value);

/** 50000 → "Rp50.000" */
export const formatRupiah = (value) => `Rp${numberFormatter.format(value)}`;
