import { useEffect, useMemo, useRef, useState } from 'react';
import Dialog from '@/components/ui/Dialog';
import { formatRupiah } from '@/lib/format';
import {
  PAYMENT_WINDOW_SECONDS,
  formatCountdown,
  groupDigits,
  seededDigits,
  virtualAccountNumber,
} from '@/features/booking/payment';
import { CheckIcon, ClockIcon, InfoIcon, SpinnerIcon, XIcon } from '@/components/ui/icons';

const QR_SIZE = 29;

/** Pola mirip kode QR (bukan QR sungguhan) yang stabil untuk `seed`. */
function DummyQr({ seed, label }) {
  const cells = useMemo(() => {
    const bits = seededDigits(seed, QR_SIZE * QR_SIZE);
    const finder = (x, y) =>
      [
        [0, 0],
        [QR_SIZE - 7, 0],
        [0, QR_SIZE - 7],
      ].some(([fx, fy]) => x >= fx && x < fx + 7 && y >= fy && y < fy + 7);
    const list = [];
    for (let y = 0; y < QR_SIZE; y += 1) {
      for (let x = 0; x < QR_SIZE; x += 1) {
        // Area pola sudut (finder) + jarak putihnya digambar terpisah.
        const nearFinder = [
          [0, 0],
          [QR_SIZE - 8, 0],
          [0, QR_SIZE - 8],
        ].some(([fx, fy]) => x >= fx && x < fx + 8 && y >= fy && y < fy + 8);
        if (!finder(x, y) && !nearFinder && Number(bits[y * QR_SIZE + x]) < 5) list.push([x, y]);
      }
    }
    return list;
  }, [seed]);

  const corner = (x, y) => (
    <g key={`${x}-${y}`}>
      <rect x={x} y={y} width="7" height="7" fill="#0f1a2a" />
      <rect x={x + 1} y={y + 1} width="5" height="5" fill="#ffffff" />
      <rect x={x + 2} y={y + 2} width="3" height="3" fill="#0f1a2a" />
    </g>
  );

  return (
    <svg
      className="pay-qr"
      viewBox={`-2 -2 ${QR_SIZE + 4} ${QR_SIZE + 4}`}
      role="img"
      aria-label={label}
      shapeRendering="crispEdges"
    >
      <rect x="-2" y="-2" width={QR_SIZE + 4} height={QR_SIZE + 4} fill="#ffffff" />
      {cells.map(([x, y]) => (
        <rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" fill="#0f1a2a" />
      ))}
      {corner(0, 0)}
      {corner(QR_SIZE - 7, 0)}
      {corner(0, QR_SIZE - 7)}
    </svg>
  );
}

function useCountdown(start, active) {
  const [left, setLeft] = useState(start);
  useEffect(() => {
    if (!active) return undefined;
    const timer = setInterval(() => setLeft((value) => Math.max(0, value - 1)), 1000);
    return () => clearInterval(timer);
  }, [active]);
  return [left, () => setLeft(start)];
}

function CopyButton({ value, label }) {
  const [copied, setCopied] = useState(false);
  const timer = useRef(null);
  useEffect(() => () => clearTimeout(timer.current), []);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };
  return (
    <button type="button" className="btn btn--outline btn--sm" onClick={copy} aria-label={label}>
      {copied ? <CheckIcon size={18} /> : null}
      {copied ? 'Tersalin' : 'Salin'}
    </button>
  );
}

const QR_STEPS = {
  qris: [
    'Buka aplikasi m-banking atau e-wallet yang mendukung QRIS.',
    'Pilih menu Scan/Bayar, lalu arahkan kamera ke kode QR.',
    'Periksa nama merchant dan nominal, lalu konfirmasi pembayaran.',
  ],
  ewallet: (name) => [
    `Buka aplikasi ${name} di ponsel Anda.`,
    'Pilih menu Bayar/Scan, lalu arahkan kamera ke kode QR.',
    'Periksa nominal, lalu masukkan PIN untuk membayar.',
  ],
};

function PaymentContent({ method, total, reference, submitting, onPaid, onClose }) {
  const titleRef = useRef(null);
  const [left, restart] = useCountdown(PAYMENT_WINDOW_SECONDS, !submitting);
  const [attempt, setAttempt] = useState(0);
  const expired = left === 0;
  const seed = `${reference}:${attempt}`;
  const isVa = method.kind === 'va';
  const vaNumber = isVa ? virtualAccountNumber(method, seed) : '';
  const steps = isVa
    ? [
        `Buka m-banking atau ATM ${method.short}, pilih menu Transfer > Virtual Account.`,
        `Masukkan nomor Virtual Account di atas.`,
        `Pastikan nominal ${formatRupiah(total)}, lalu konfirmasi pembayaran.`,
      ]
    : method.id === 'qris'
      ? QR_STEPS.qris
      : QR_STEPS.ewallet(method.label);

  useEffect(() => {
    const frame = requestAnimationFrame(() => titleRef.current?.focus());
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <div className="pay">
      <div className="dialog__head">
        <div className="dialog__head-text">
          <h2 id="payment-title" ref={titleRef} tabIndex={-1} className="dialog__title">
            Bayar dengan {method.label}
          </h2>
          <p id="payment-desc" className="dialog__desc">
            Kode pembayaran {reference}
          </p>
        </div>
        <button
          type="button"
          className="dialog__close"
          aria-label="Tutup pembayaran"
          onClick={onClose}
          disabled={submitting}
        >
          <XIcon size={22} strokeWidth={2} />
        </button>
      </div>

      <p className="pay__demo">
        <InfoIcon size={18} />
        Simulasi pembayaran (dummy). Tidak ada uang yang ditarik.
      </p>

      <div className="pay__amount">
        <span>Total pembayaran</span>
        <strong>{formatRupiah(total)}</strong>
      </div>

      <div className={`pay__code${expired ? ' pay__code--expired' : ''}`}>
        {isVa ? (
          <div className="pay__va">
            <span className="pay__va-bank">{method.label}</span>
            <span className="pay__va-label">Nomor Virtual Account</span>
            <div className="pay__va-row">
              <strong className="pay__va-number">{groupDigits(vaNumber)}</strong>
              <CopyButton value={vaNumber} label="Salin nomor Virtual Account" />
            </div>
          </div>
        ) : (
          <DummyQr
            seed={seed}
            label={`Kode QR ${method.label} (simulasi) senilai ${formatRupiah(total)}`}
          />
        )}
        {expired && (
          <div className="pay__expired" role="alert">
            <strong>Waktu pembayaran habis</strong>
            <button
              type="button"
              className="btn btn--primary btn--sm"
              onClick={() => {
                setAttempt((n) => n + 1);
                restart();
              }}
            >
              Buat kode baru
            </button>
          </div>
        )}
      </div>

      <p className="pay__timer">
        <ClockIcon size={18} />
        Bayar dalam{' '}
        <strong aria-hidden="true" className="pay__time">
          {formatCountdown(left)}
        </strong>
        <span className="visually-hidden">{Math.ceil(left / 60)} menit</span>
      </p>

      <ol className="pay__steps">
        {steps.map((step) => (
          <li key={step}>{step}</li>
        ))}
      </ol>

      <div className="dialog__actions">
        <button type="button" className="btn btn--outline" onClick={onClose} disabled={submitting}>
          Ganti metode
        </button>
        <button
          type="button"
          className="btn btn--primary"
          onClick={onPaid}
          disabled={submitting || expired}
          aria-busy={submitting}
        >
          {submitting ? <SpinnerIcon size={18} className="spin" /> : <CheckIcon size={18} />}
          {submitting ? 'Mengirim pesanan…' : 'Saya sudah bayar'}
        </button>
      </div>
    </div>
  );
}

/**
 * Layar pembayaran dummy setelah "Lanjut ke Pembayaran": QR (QRIS/e-wallet) atau nomor
 * Virtual Account + batas waktu. "Saya sudah bayar" mengirim pesanan (POST /bookings).
 */
export default function PaymentDialog({ method, total, reference, submitting, onPaid, onClose }) {
  const close = () => {
    if (!submitting) onClose();
  };
  return (
    <Dialog
      open={Boolean(method)}
      onClose={close}
      labelledBy="payment-title"
      describedBy="payment-desc"
      className="dialog--payment"
    >
      {method && (
        <PaymentContent
          key={method.id}
          method={method}
          total={total}
          reference={reference}
          submitting={submitting}
          onPaid={onPaid}
          onClose={close}
        />
      )}
    </Dialog>
  );
}
