/**
 * Token gerak (design system "Atlas Kontur" §6). Hanya transform & opacity.
 * Selaras dengan --ease-out / --duration-* di tokens.css.
 */
export const EASE_OUT = [0.16, 1, 0.3, 1];

export const DURATION = { fast: 0.18, base: 0.32, slow: 0.6 };

export const STAGGER = 0.06;

/** Muncul dari bawah (reveal section / item daftar). */
export const riseVariants = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0, transition: { duration: DURATION.slow, ease: EASE_OUT } },
};

/** Induk yang memberi jeda berurutan ke anak-anaknya. */
export const staggerVariants = (delayChildren = 0) => ({
  hidden: {},
  visible: { transition: { staggerChildren: STAGGER, delayChildren } },
});

/** Hover kartu yang bisa diklik: naik sedikit (transform saja). */
export const cardHover = { y: -3, transition: { duration: DURATION.fast, ease: EASE_OUT } };

/** Konten yang berganti di tempat yang sama (langkah pemesanan). */
export const swapIn = {
  initial: { opacity: 0, x: 16 },
  animate: { opacity: 1, x: 0, transition: { duration: DURATION.base, ease: EASE_OUT } },
};
