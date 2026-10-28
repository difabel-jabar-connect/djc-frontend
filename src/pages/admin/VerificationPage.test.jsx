import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderAt } from '@/test/renderWithRouter';

const table = () => within(screen.getByRole('table', { name: /antrean verifikasi/i }));

describe('Verifikasi Penyedia', () => {
  it('menampilkan antrean terlama di atas, kelengkapan, dan paginasi', () => {
    renderAt('/admin/verifikasi');
    expect(screen.getByRole('tab', { name: /menunggu.*10/i })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    const rows = table().getAllByRole('row').slice(1);
    expect(rows).toHaveLength(8);
    expect(rows[0]).toHaveTextContent('Rudi Hartono');
    expect(
      within(rows[1]).getByRole('progressbar', { name: 'Kelengkapan data 5 dari 6' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Menampilkan 1–8 dari 10 penyedia')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Halaman 2, terakhir' })).toHaveAttribute(
      'href',
      '/admin/verifikasi?halaman=2',
    );
  });

  it('filter kategori, pencarian, dan tab Ditolak', async () => {
    const user = userEvent.setup();
    renderAt('/admin/verifikasi');
    await user.selectOptions(screen.getByLabelText('Kategori:'), 'desain');
    expect(table().getAllByRole('row')).toHaveLength(3);
    await user.type(screen.getByRole('searchbox', { name: /cari nama penyedia/i }), 'bayu');
    expect(table().getAllByRole('row')).toHaveLength(2);
    await user.clear(screen.getByRole('searchbox', { name: /cari nama penyedia/i }));
    await user.type(screen.getByRole('searchbox', { name: /cari nama penyedia/i }), 'zzz');
    expect(
      screen.getByRole('heading', { name: /tidak ada penyedia untuk filter ini/i }),
    ).toBeVisible();
    await user.click(screen.getByRole('button', { name: /reset filter/i }));

    await user.click(screen.getByRole('tab', { name: /ditolak/i }));
    expect(table().getByText('Bambang Irawan')).toBeInTheDocument();
    expect(
      table().getByRole('button', { name: 'Lihat pendaftaran Bambang Irawan' }),
    ).toBeInTheDocument();
  });

  it('tautan ?tinjau= membuka drawer dengan data lengkap', () => {
    renderAt('/admin/verifikasi?tinjau=v-nur');
    const drawer = within(screen.getByRole('dialog', { name: 'Nur Aisyah' }));
    expect(drawer.getByText('nur.aisyah@email.com')).toBeInTheDocument();
    expect(drawer.getByText('Bukti alumni PPSGHD.pdf')).toBeInTheDocument();
    expect(
      drawer.getByRole('heading', { name: /checklist kelengkapan · 5\/6/i }),
    ).toBeInTheDocument();
    expect(drawer.getByText('Jumat, libur')).toBeInTheDocument();
  });

  it('menolak dengan alasan cepat: tombol nonaktif sampai alasan valid', async () => {
    const user = userEvent.setup();
    renderAt('/admin/verifikasi');
    await user.click(table().getByRole('button', { name: 'Tinjau pendaftaran Nur Aisyah' }));
    await user.click(screen.getByRole('button', { name: 'Tolak' }));

    const dialog = within(screen.getByRole('dialog', { name: 'Tolak pendaftaran?' }));
    const confirm = dialog.getByRole('button', { name: 'Ya, Tolak' });
    expect(confirm).toBeDisabled();

    const field = dialog.getByRole('textbox', { name: /alasan/i });
    await user.type(field, 'Kurang');
    await user.tab();
    expect(dialog.getByText('Alasan minimal 10 karakter.')).toBeInTheDocument();
    expect(field).toHaveAttribute('aria-invalid', 'true');

    await user.clear(field);
    await user.click(dialog.getByRole('button', { name: 'Data tidak lengkap' }));
    expect(dialog.getByRole('button', { name: 'Data tidak lengkap' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await user.type(field, 'foto hasil kerja belum diunggah.');
    expect(field).toHaveValue('Data tidak lengkap: foto hasil kerja belum diunggah.');
    await user.click(confirm);

    expect(await screen.findByText(/pendaftaran nur aisyah ditolak/i)).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(table().queryByText('Nur Aisyah')).not.toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /ditolak.*2/i })).toBeInTheDocument();
    await waitFor(() =>
      expect(screen.getByRole('heading', { level: 1, name: 'Verifikasi Penyedia' })).toHaveFocus(),
    );
  });

  it('menyetujui penyedia: masuk Kelola User dan tercatat di Audit Log', async () => {
    const user = userEvent.setup();
    renderAt('/admin/verifikasi');
    await user.click(table().getByRole('button', { name: 'Tinjau pendaftaran Rudi Hartono' }));
    await user.click(screen.getByRole('button', { name: 'Setujui' }));
    const dialog = within(screen.getByRole('dialog', { name: 'Setujui penyedia?' }));
    await user.type(dialog.getByRole('textbox', { name: /catatan/i }), 'Data lengkap.');
    await user.click(dialog.getByRole('button', { name: 'Ya, Setujui' }));
    expect(await screen.findByText(/rudi hartono disetujui sebagai penyedia/i)).toBeInTheDocument();

    const nav = screen.getByRole('navigation', { name: /menu admin/i });
    expect(
      within(nav).getByRole('link', { name: 'Verifikasi Penyedia, 9 menunggu' }),
    ).toBeInTheDocument();

    await user.click(within(nav).getByRole('link', { name: 'Kelola User' }));
    expect(screen.getByRole('table', { name: 'Daftar user' })).toHaveTextContent('Rudi Hartono');

    await user.click(within(nav).getByRole('link', { name: 'Audit Log' }));
    const first = within(screen.getByRole('table', { name: /audit log/i })).getAllByRole('row')[1];
    expect(first).toHaveTextContent(
      /andi pratama.*setujui penyedia.*rudi hartono.*data lengkap\./i,
    );
  });
});
