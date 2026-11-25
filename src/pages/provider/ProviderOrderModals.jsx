import { useId, useState } from 'react';
import Dialog from '@/components/ui/Dialog';
import { XIcon } from '@/components/ui/icons';
import { buildCompletePayload } from '@/features/dashboard/providerDashboardAdapters';
import { apiErrorMessage } from '@/lib/api/client';
import { formatRupiah } from '@/lib/format';

/** Dialog tolak pesanan (`requested` → `rejected`) atau batalkan (`accepted` → `cancelled`). */
export function ProviderReasonModal({ order, mode, onClose, onConfirm }) {
  const id = useId();
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const isReject = mode === 'reject';
  const title = isReject ? 'Tolak pesanan?' : 'Batalkan pesanan?';
  const description = isReject
    ? 'Pelanggan akan menerima alasan penolakan Anda.'
    : 'Pesanan yang sudah diterima akan dibatalkan dan pelanggan diberi tahu.';
  const submitLabel = isReject ? 'Ya, Tolak Pesanan' : 'Ya, Batalkan Pesanan';

  const handleSubmit = async (event) => {
    event.preventDefault();
    const trimmed = reason.trim();
    if (trimmed.length < 10) {
      setError('Alasan wajib diisi minimal 10 karakter.');
      return;
    }
    setError('');
    setBusy(true);
    try {
      await onConfirm(trimmed);
    } catch (err) {
      setError(apiErrorMessage(err, 'Gagal memperbarui pesanan. Silakan coba lagi.'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog
      open={Boolean(order)}
      onClose={() => !busy && onClose()}
      labelledBy={`${id}-title`}
      describedBy={`${id}-desc`}
      className="dialog--xs"
    >
      {order && (
        <form className="dialog__form" noValidate onSubmit={handleSubmit}>
          <div className="dialog__head">
            <div className="dialog__head-text">
              <h2 id={`${id}-title`} className="dialog__title">
                {title}
              </h2>
              <p id={`${id}-desc`} className="dialog__desc">
                {description}
              </p>
            </div>
            <button
              type="button"
              className="dialog__close"
              aria-label="Tutup dialog"
              onClick={onClose}
              disabled={busy}
            >
              <XIcon size={20} />
            </button>
          </div>

          <p className="provider-modal__summary">
            <strong>{order.customer}</strong> · {order.service}
          </p>

          <div className="form-field">
            <label htmlFor={`${id}-reason`} className="form-label">
              Alasan {isReject ? 'penolakan' : 'pembatalan'} *
            </label>
            <textarea
              id={`${id}-reason`}
              className="form-textarea"
              rows={3}
              required
              minLength={10}
              maxLength={500}
              placeholder="Contoh: Jadwal penuh di hari tersebut atau lokasi di luar jangkauan."
              value={reason}
              disabled={busy}
              onChange={(event) => setReason(event.target.value)}
            />
            {error && (
              <p className="form-field__error" role="alert">
                {error}
              </p>
            )}
          </div>

          <div className="dialog__actions">
            <button
              type="button"
              className="btn btn--outline btn--md"
              onClick={onClose}
              disabled={busy}
            >
              Batal
            </button>
            <button type="submit" className="btn btn--danger-solid btn--md" disabled={busy}>
              {busy ? 'Memproses...' : submitLabel}
            </button>
          </div>
        </form>
      )}
    </Dialog>
  );
}

/** Dialog selesaikan pesanan (`in_progress` → `completed`) sesuai tipe tarif. */
export function ProviderCompleteModal({ order, onClose, onConfirm }) {
  const id = useId();
  const [actualQuantity, setActualQuantity] = useState(() => String(order?.quantity ?? 1));
  const [finalTotal, setFinalTotal] = useState(() =>
    String(order?.estimatedTotal || order?.unitPrice || 50000),
  );
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const previewTotal =
    order?.pricingType === 'hourly'
      ? Math.round((Number(actualQuantity) || 0) * (order?.unitPrice || 0))
      : order?.pricingType === 'starting_from'
        ? Number(finalTotal) || 0
        : order?.estimatedTotal || 0;

  const handleSubmit = async (event) => {
    event.preventDefault();
    const result = buildCompletePayload(order, {
      actualQuantity: Number(actualQuantity),
      finalTotal: Number(finalTotal),
    });
    if (result.error) {
      setError(result.error);
      return;
    }
    setError('');
    setBusy(true);
    try {
      await onConfirm(result.payload);
    } catch (err) {
      setError(apiErrorMessage(err, 'Gagal menyelesaikan pesanan.'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog
      open={Boolean(order)}
      onClose={() => !busy && onClose()}
      labelledBy={`${id}-title`}
      describedBy={`${id}-desc`}
      className="dialog--xs"
    >
      {order && (
        <form className="dialog__form" noValidate onSubmit={handleSubmit}>
          <div className="dialog__head">
            <div className="dialog__head-text">
              <h2 id={`${id}-title`} className="dialog__title">
                Selesaikan pesanan?
              </h2>
              <p id={`${id}-desc`} className="dialog__desc">
                Pastikan pekerjaan untuk {order.customer} sudah selesai sebelum menandai selesai.
              </p>
            </div>
            <button
              type="button"
              className="dialog__close"
              aria-label="Tutup dialog"
              onClick={onClose}
              disabled={busy}
            >
              <XIcon size={20} />
            </button>
          </div>

          <p className="provider-modal__summary">
            <strong>{order.service}</strong> · Estimasi {formatRupiah(order.estimatedTotal)}
          </p>

          {order.pricingType === 'hourly' && (
            <div className="form-field">
              <label htmlFor={`${id}-qty`} className="form-label">
                Jumlah jam aktual (kelipatan 0,5) *
              </label>
              <input
                id={`${id}-qty`}
                className="form-input"
                type="number"
                step="0.5"
                min="0.5"
                max="999"
                required
                value={actualQuantity}
                disabled={busy}
                onChange={(event) => setActualQuantity(event.target.value)}
              />
              <p className="provider-modal__hint">
                Tarif {formatRupiah(order.unitPrice)}/jam → Total akhir:{' '}
                <strong>{formatRupiah(previewTotal)}</strong>
              </p>
            </div>
          )}

          {order.pricingType === 'starting_from' && (
            <div className="form-field">
              <label htmlFor={`${id}-total`} className="form-label">
                Total biaya akhir (Rp) *
              </label>
              <input
                id={`${id}-total`}
                className="form-input"
                type="number"
                step="1000"
                min={order.unitPrice}
                required
                value={finalTotal}
                disabled={busy}
                onChange={(event) => setFinalTotal(event.target.value)}
              />
              <p className="provider-modal__hint">
                Minimal {formatRupiah(order.unitPrice)} (harga awal layanan).
              </p>
            </div>
          )}

          {order.pricingType === 'fixed' && (
            <p className="provider-modal__hint">
              Tarif tetap: total akhir otomatis tercatat{' '}
              <strong>{formatRupiah(order.estimatedTotal)}</strong>.
            </p>
          )}

          {error && (
            <p className="form-field__error" role="alert">
              {error}
            </p>
          )}

          <div className="dialog__actions">
            <button
              type="button"
              className="btn btn--outline btn--md"
              onClick={onClose}
              disabled={busy}
            >
              Batal
            </button>
            <button type="submit" className="btn btn--primary btn--md" disabled={busy}>
              {busy ? 'Menyimpan...' : 'Konfirmasi Selesai'}
            </button>
          </div>
        </form>
      )}
    </Dialog>
  );
}
