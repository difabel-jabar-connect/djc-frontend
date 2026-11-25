import { useId, useState } from 'react';
import Dialog from '@/components/ui/Dialog';
import { PanelHead, StatusBadge } from '@/components/dashboard/DashboardWidgets';
import { PencilIcon, PlusIcon, PowerIcon, XIcon } from '@/components/ui/icons';
import {
  PRICING_TYPE_LABELS,
  SERVICE_MODE_LABELS,
} from '@/features/dashboard/providerDashboardAdapters';
import { apiErrorMessage } from '@/lib/api/client';
import { formatRupiah } from '@/lib/format';

function ServiceFormDialog({ open, service, categories, onClose, onSave }) {
  const id = useId();
  const [form, setForm] = useState(() => ({
    title: service?.title ?? '',
    category_id: service?.category?.id ?? categories[0]?.id ?? '',
    description: service?.description ?? '',
    pricing_type: service?.pricing_type ?? 'starting_from',
    price_amount: service?.price_amount ? String(service.price_amount) : '',
    min_hours: service?.min_hours ? String(service.min_hours) : '1',
    duration_estimate_min: service?.duration_estimate_min
      ? String(service.duration_estimate_min)
      : '',
    service_mode: service?.service_mode ?? 'at_customer',
    is_active: service?.is_active ?? true,
  }));
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const set = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async (event) => {
    event.preventDefault();
    const title = form.title.trim();
    const priceAmount = Number(form.price_amount);
    if (title.length < 3) {
      setError('Judul layanan minimal 3 karakter.');
      return;
    }
    if (!form.category_id) {
      setError('Pilih kategori layanan terlebih dahulu.');
      return;
    }
    if (!Number.isInteger(priceAmount) || priceAmount < 1) {
      setError('Harga harus berupa bilangan bulat positif.');
      return;
    }
    let minHours = null;
    if (form.pricing_type === 'hourly') {
      minHours = Number(form.min_hours);
      if (!Number.isInteger(minHours) || minHours < 1 || minHours > 24) {
        setError('Minimal jam untuk tarif per jam harus 1–24.');
        return;
      }
    }
    const durationMin = form.duration_estimate_min.trim()
      ? Number(form.duration_estimate_min)
      : null;
    if (durationMin !== null && (!Number.isInteger(durationMin) || durationMin < 1)) {
      setError('Estimasi durasi (menit) harus bilangan bulat positif.');
      return;
    }

    setError('');
    setBusy(true);
    try {
      await onSave(
        {
          category_id: form.category_id,
          title,
          description: form.description.trim() || null,
          pricing_type: form.pricing_type,
          price_amount: priceAmount,
          min_hours: minHours,
          duration_estimate_min: durationMin,
          service_mode: form.service_mode,
          is_active: form.is_active,
        },
        service?.id ?? null,
      );
      onClose();
    } catch (err) {
      setError(apiErrorMessage(err, 'Gagal menyimpan layanan.'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onClose={() => !busy && onClose()} labelledBy={`${id}-title`}>
      <form className="dialog__form" noValidate onSubmit={handleSubmit}>
        <div className="dialog__head">
          <h2 id={`${id}-title`} className="dialog__title">
            {service ? 'Ubah Layanan' : 'Tambah Layanan Baru'}
          </h2>
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

        <div className="provider-form-grid">
          <div className="form-field">
            <label htmlFor={`${id}-title-input`} className="form-label">
              Judul layanan *
            </label>
            <input
              id={`${id}-title-input`}
              className="form-input"
              type="text"
              required
              maxLength={120}
              placeholder="Contoh: Servis Kipas Angin"
              value={form.title}
              disabled={busy}
              onChange={(event) => set('title', event.target.value)}
            />
          </div>

          <div className="form-field">
            <label htmlFor={`${id}-cat`} className="form-label">
              Kategori *
            </label>
            <select
              id={`${id}-cat`}
              className="form-input"
              value={form.category_id}
              disabled={busy}
              onChange={(event) => set('category_id', event.target.value)}
            >
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-field">
            <label htmlFor={`${id}-pricing`} className="form-label">
              Model harga *
            </label>
            <select
              id={`${id}-pricing`}
              className="form-input"
              value={form.pricing_type}
              disabled={busy}
              onChange={(event) => set('pricing_type', event.target.value)}
            >
              {Object.entries(PRICING_TYPE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <div className="form-field">
            <label htmlFor={`${id}-price`} className="form-label">
              Harga (Rp) *
            </label>
            <input
              id={`${id}-price`}
              className="form-input"
              type="number"
              min="1"
              step="1000"
              required
              value={form.price_amount}
              disabled={busy}
              onChange={(event) => set('price_amount', event.target.value)}
            />
          </div>

          {form.pricing_type === 'hourly' && (
            <div className="form-field">
              <label htmlFor={`${id}-min-hours`} className="form-label">
                Minimal jam *
              </label>
              <input
                id={`${id}-min-hours`}
                className="form-input"
                type="number"
                min="1"
                max="24"
                required
                value={form.min_hours}
                disabled={busy}
                onChange={(event) => set('min_hours', event.target.value)}
              />
            </div>
          )}

          <div className="form-field">
            <label htmlFor={`${id}-mode`} className="form-label">
              Moda layanan *
            </label>
            <select
              id={`${id}-mode`}
              className="form-input"
              value={form.service_mode}
              disabled={busy}
              onChange={(event) => set('service_mode', event.target.value)}
            >
              {Object.entries(SERVICE_MODE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <div className="form-field">
            <label htmlFor={`${id}-dur`} className="form-label">
              Estimasi durasi (menit)
            </label>
            <input
              id={`${id}-dur`}
              className="form-input"
              type="number"
              min="1"
              max="1440"
              placeholder="Opsional, mis. 60"
              value={form.duration_estimate_min}
              disabled={busy}
              onChange={(event) => set('duration_estimate_min', event.target.value)}
            />
          </div>
        </div>

        <div className="form-field">
          <label htmlFor={`${id}-desc`} className="form-label">
            Deskripsi layanan
          </label>
          <textarea
            id={`${id}-desc`}
            className="form-textarea"
            rows={3}
            maxLength={2000}
            placeholder="Jelaskan cakupan layanan dan perlengkapan yang Anda bawa."
            value={form.description}
            disabled={busy}
            onChange={(event) => set('description', event.target.value)}
          />
        </div>

        <label className="provider-checkbox">
          <input
            type="checkbox"
            checked={form.is_active}
            disabled={busy}
            onChange={(event) => set('is_active', event.target.checked)}
          />
          <span>Tampilkan layanan ini secara aktif ke pelanggan</span>
        </label>

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
            {busy ? 'Menyimpan...' : 'Simpan Layanan'}
          </button>
        </div>
      </form>
    </Dialog>
  );
}

/** Panel CRUD Katalog Layanan Penyedia (`#layanan`). */
export default function ProviderServicesPanel({ services, categories, onSave, onToggleActive }) {
  const [editing, setEditing] = useState(null); // { service } | null
  const [busyId, setBusyId] = useState('');
  const [error, setError] = useState('');

  const handleToggle = async (service) => {
    setError('');
    setBusyId(service.id);
    try {
      await onToggleActive(service);
    } catch (err) {
      setError(apiErrorMessage(err, 'Gagal mengubah status layanan.'));
    } finally {
      setBusyId('');
    }
  };

  return (
    <section id="layanan" className="dash-card dash-panel" aria-labelledby="layanan-title">
      <PanelHead id="layanan-title" title="Layanan Saya">
        <button
          type="button"
          className="dash-btn dash-btn--primary"
          onClick={() => setEditing({ service: null })}
        >
          <PlusIcon size={16} />
          Tambah Layanan
        </button>
      </PanelHead>

      {error && (
        <p className="form-field__error" role="alert">
          {error}
        </p>
      )}

      {services.length ? (
        <div className="dash-table-wrap">
          <table className="dash-table orders-table">
            <caption className="visually-hidden">Daftar layanan milik penyedia</caption>
            <thead>
              <tr>
                <th scope="col">Layanan</th>
                <th scope="col">Kategori</th>
                <th scope="col">Tarif</th>
                <th scope="col">Moda</th>
                <th scope="col">Status</th>
                <th scope="col">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {services.map((service) => (
                <tr key={service.id}>
                  <td>
                    <strong className="dash-block">{service.title}</strong>
                    {service.description && (
                      <span className="dash-muted">{service.description}</span>
                    )}
                  </td>
                  <td>{service.category?.name ?? '–'}</td>
                  <td>
                    <strong className="dash-block">{formatRupiah(service.price_amount)}</strong>
                    <span className="dash-muted">
                      {PRICING_TYPE_LABELS[service.pricing_type] ?? service.pricing_type}
                      {service.pricing_type === 'hourly' && service.min_hours
                        ? ` (min. ${service.min_hours} jam)`
                        : ''}
                    </span>
                  </td>
                  <td>{SERVICE_MODE_LABELS[service.service_mode] ?? service.service_mode}</td>
                  <td>
                    <StatusBadge tone={service.is_active ? 'success' : 'neutral'}>
                      {service.is_active ? 'Aktif' : 'Nonaktif'}
                    </StatusBadge>
                  </td>
                  <td>
                    <div className="orders-table__actions">
                      <button
                        type="button"
                        className="dash-btn dash-btn--outline"
                        aria-label={`Ubah layanan ${service.title}`}
                        onClick={() => setEditing({ service })}
                      >
                        <PencilIcon size={14} />
                        Ubah
                      </button>
                      <button
                        type="button"
                        className="dash-btn dash-btn--outline"
                        aria-label={`${service.is_active ? 'Nonaktifkan' : 'Aktifkan'} layanan ${service.title}`}
                        disabled={busyId === service.id}
                        onClick={() => handleToggle(service)}
                      >
                        <PowerIcon size={14} />
                        {service.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="agenda__empty">
          Belum ada layanan terdaftar. Tambahkan layanan pertama Anda agar bisa dipesan pelanggan.
        </p>
      )}

      {editing && (
        <ServiceFormDialog
          key={editing.service?.id ?? 'baru'}
          open
          service={editing.service}
          categories={categories}
          onClose={() => setEditing(null)}
          onSave={onSave}
        />
      )}
    </section>
  );
}
