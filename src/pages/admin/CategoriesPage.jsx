import { useRef, useState } from 'react';
import { InfoIcon, PencilIcon, PlusIcon, PowerIcon, TrashIcon } from '@/components/ui/icons';
import { useAdmin } from '@/context/useAdmin';
import { formatDate } from '@/features/admin/adminFormat';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { ConfirmDialog, ReasonDialog } from './AdminDialogs';
import { Badge, CategoryIcon, PageHeader } from './AdminParts';
import CategoryDialog from './CategoryDialog';

/** Kategori Layanan (desain Kategori + Modal Tambah + dialog Hapus/Nonaktifkan). */
export default function CategoriesPage() {
  useDocumentTitle('Kategori Layanan');
  const { categories, saveCategory, toggleCategory, deleteCategory, run, notify } = useAdmin();
  const headingRef = useRef(null);
  const [editing, setEditing] = useState(null); // { category } — category null = tambah
  const [toggling, setToggling] = useState(null);
  const [deleting, setDeleting] = useState(null);

  const done = (message) => {
    notify(message);
    requestAnimationFrame(() => headingRef.current?.focus());
  };

  const iconSubject = (category) =>
    category && {
      name: category.name,
      initials: <CategoryIcon icon={category.icon} size={20} />,
      color: '#0c7272',
      meta: `${category.services} layanan · ${category.active ? 'Aktif' : 'Nonaktif'}`,
    };

  return (
    <>
      <PageHeader
        headingRef={headingRef}
        title="Kategori Layanan"
        lead="Atur kategori yang tampil di pencarian dan Beranda."
      >
        <button
          type="button"
          className="btn btn--primary btn--md"
          aria-haspopup="dialog"
          onClick={() => setEditing({ category: null })}
        >
          <PlusIcon size={18} strokeWidth={2.25} />
          Tambah Kategori
        </button>
      </PageHeader>

      <section className="dash-card dash-panel ad-list-card" aria-label="Daftar kategori">
        <p className="ad-info">
          <InfoIcon size={18} />
          Kategori hanya bisa dihapus bila tidak memiliki layanan. Kategori yang masih punya layanan
          cukup dinonaktifkan.
        </p>
        <div className="dash-table-wrap">
          <table className="dash-table ad-table">
            <caption className="visually-hidden">Daftar kategori layanan</caption>
            <thead>
              <tr>
                <th scope="col">Ikon</th>
                <th scope="col">Nama Kategori</th>
                <th scope="col">Deskripsi</th>
                <th scope="col">Jumlah Layanan</th>
                <th scope="col">Status</th>
                <th scope="col">Terakhir Diubah</th>
                <th scope="col">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((category) => (
                <tr key={category.id}>
                  <td>
                    <span className="ad-cat-icon" aria-hidden="true">
                      <CategoryIcon icon={category.icon} size={20} />
                    </span>
                  </td>
                  <td>
                    <strong>{category.name}</strong>
                  </td>
                  <td className="ad-muted-cell">{category.description || '–'}</td>
                  <td>
                    {category.services ? (
                      <strong>{category.services}</strong>
                    ) : (
                      <strong className="ad-warning-text">0 · kosong</strong>
                    )}
                  </td>
                  <td>
                    <Badge tone={category.active ? 'success' : 'neutral'}>
                      {category.active ? 'Aktif' : 'Nonaktif'}
                    </Badge>
                  </td>
                  <td>{formatDate(category.updatedAt)}</td>
                  <td>
                    <div className="ad-row-actions ad-row-actions--wrap">
                      <button
                        type="button"
                        className="btn btn--outline ad-btn-sm"
                        aria-haspopup="dialog"
                        aria-label={`Ubah kategori ${category.name}`}
                        onClick={() => setEditing({ category })}
                      >
                        <PencilIcon size={18} strokeWidth={2.25} />
                        Ubah
                      </button>
                      <button
                        type="button"
                        className="btn ad-btn-sm ad-btn-ghost"
                        aria-haspopup="dialog"
                        aria-label={`${category.active ? 'Nonaktifkan' : 'Aktifkan'} kategori ${category.name}`}
                        onClick={() => setToggling(category)}
                      >
                        <PowerIcon size={18} strokeWidth={2.25} />
                        {category.active ? 'Nonaktifkan' : 'Aktifkan'}
                      </button>
                      {category.services === 0 && (
                        <button
                          type="button"
                          className="btn btn--danger ad-btn-sm"
                          aria-haspopup="dialog"
                          aria-label={`Hapus kategori ${category.name}`}
                          onClick={() => setDeleting(category)}
                        >
                          <TrashIcon size={18} strokeWidth={2.25} />
                          Hapus
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <CategoryDialog
        open={Boolean(editing)}
        category={editing?.category ?? null}
        categories={categories}
        onClose={() => setEditing(null)}
        onSave={(values) => {
          const isNew = !editing.category;
          saveCategory(values, editing.category?.id);
          setEditing(null);
          done(
            `Kategori “${values.name.trim()}” ${isNew ? 'ditambahkan' : 'disimpan'}. Aksi tercatat di Audit Log.`,
          );
        }}
      />

      <ReasonDialog
        open={Boolean(toggling)}
        onClose={() => setToggling(null)}
        tone={toggling?.active ? 'danger' : 'success'}
        icon={PowerIcon}
        title={toggling?.active ? 'Nonaktifkan kategori?' : 'Aktifkan kategori?'}
        description={
          toggling?.active
            ? 'Kategori disembunyikan dari pencarian dan Beranda. Layanan di dalamnya tidak dihapus.'
            : 'Kategori tampil lagi di pencarian dan Beranda.'
        }
        subject={iconSubject(toggling)}
        confirmLabel={toggling?.active ? 'Ya, Nonaktifkan' : 'Ya, Aktifkan'}
        onConfirm={async (reason) => {
          const { id, name, active } = toggling;
          await run(() => toggleCategory(id, reason));
          setToggling(null);
          done(
            `Kategori “${name}” ${active ? 'dinonaktifkan' : 'diaktifkan'}. Aksi tercatat di Audit Log.`,
          );
        }}
      />

      <ConfirmDialog
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        tone="danger"
        icon={TrashIcon}
        title={`Hapus kategori “${deleting?.name ?? ''}”?`}
        description="Kategori ini tidak memiliki layanan. Penghapusan permanen dan tercatat di Audit Log."
        confirmLabel="Ya, Hapus"
        confirmIcon={TrashIcon}
        onConfirm={async () => {
          const { id, name } = deleting;
          await run(() => deleteCategory(id));
          setDeleting(null);
          done(`Kategori “${name}” dihapus. Aksi tercatat di Audit Log.`);
        }}
      />
    </>
  );
}
