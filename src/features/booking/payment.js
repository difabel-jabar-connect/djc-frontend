/**
 * Pembayaran DUMMY (simulasi payment gateway) di langkah Kirim Pesanan. Tidak ada uang yang
 * ditarik dan tidak ada data yang dikirim ke penyedia pembayaran: kode QR, nomor Virtual
 * Account, dan batas waktu dibuat di browser hanya untuk demo alur.
 */
export const PAYMENT_GROUPS = [
  {
    id: 'qris',
    label: 'QRIS',
    hint: 'Scan dengan aplikasi bank atau e-wallet apa pun.',
    methods: [{ id: 'qris', label: 'QRIS', kind: 'qr' }],
  },
  {
    id: 'va',
    label: 'Virtual Account',
    hint: 'Transfer lewat ATM, m-banking, atau internet banking.',
    methods: [
      { id: 'va-bca', label: 'BCA Virtual Account', short: 'BCA', kind: 'va', prefix: '39012' },
      { id: 'va-bni', label: 'BNI Virtual Account', short: 'BNI', kind: 'va', prefix: '8808' },
      { id: 'va-bri', label: 'BRI Virtual Account', short: 'BRI', kind: 'va', prefix: '26215' },
      {
        id: 'va-mandiri',
        label: 'Mandiri Virtual Account',
        short: 'Mandiri',
        kind: 'va',
        prefix: '89508',
      },
    ],
  },
  {
    id: 'ewallet',
    label: 'E-wallet',
    hint: 'Bayar dari saldo e-wallet Anda.',
    methods: [
      { id: 'gopay', label: 'GoPay', kind: 'qr' },
      { id: 'ovo', label: 'OVO', kind: 'qr' },
      { id: 'dana', label: 'DANA', kind: 'qr' },
    ],
  },
];

export const PAYMENT_METHODS = PAYMENT_GROUPS.flatMap((group) => group.methods);

export const findPaymentMethod = (id) => PAYMENT_METHODS.find((method) => method.id === id) ?? null;

/** Batas waktu bayar simulasi (detik). */
export const PAYMENT_WINDOW_SECONDS = 15 * 60;

/** Angka semu yang stabil untuk teks yang sama (kode QR & nomor VA dummy). */
export function seededDigits(seed, length) {
  let hash = 2166136261;
  for (const char of String(seed)) {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 16777619) >>> 0;
  }
  let digits = '';
  while (digits.length < length) {
    hash = Math.imul(hash ^ (hash >>> 15), 2246822519) >>> 0;
    digits += String(hash % 10);
  }
  return digits;
}

/** Nomor Virtual Account dummy: prefix bank + 11 digit. */
export const virtualAccountNumber = (method, seed) =>
  `${method.prefix}${seededDigits(`${method.id}:${seed}`, 16 - method.prefix.length)}`;

/** "1234 5678 9012 3456" agar mudah dibaca dan didikte. */
export const groupDigits = (value) => value.replace(/(\d{4})(?=\d)/g, '$1 ');

/** "14:59" dari sisa detik. */
export function formatCountdown(seconds) {
  const safe = Math.max(0, seconds);
  return `${String(Math.floor(safe / 60)).padStart(2, '0')}:${String(safe % 60).padStart(2, '0')}`;
}
