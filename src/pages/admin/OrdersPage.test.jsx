import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderAt } from '@/test/renderWithRouter';

const table = () => within(screen.getByRole('table', { name: /daftar pesanan/i }));

describe('Monitoring Pesanan', () => {
  it('hanya baca: ringkasan status, terbaru di atas, dan paginasi', async () => {
    const user = userEvent.setup();
    renderAt('/admin/pesanan');
    expect(screen.getByText(/admin hanya dapat memantau/i)).toBeInTheDocument();
    const summary = within(screen.getByRole('list', { name: /ringkasan status pesanan/i }));
    expect(summary.getByText('Menunggu').closest('li')).toHaveTextContent('2');
    expect(table().getAllByRole('row')[1]).toHaveTextContent('BK-0013');
    expect(screen.getByText('Menampilkan 1–10 dari 14 pesanan')).toBeInTheDocument();
    await user.click(screen.getByRole('link', { name: 'Halaman 2, terakhir' }));
    expect(table().getByText('BK-0004')).toBeInTheDocument();
  });

  it('?status=menunggu memfilter dan drawer menampilkan biaya serta riwayat', async () => {
    const user = userEvent.setup();
    renderAt('/admin/pesanan?status=menunggu');
    expect(table().getAllByRole('row')).toHaveLength(3);
    await user.click(table().getByRole('button', { name: 'Detail pesanan BK-0012' }));
    const drawer = within(screen.getByRole('dialog', { name: 'BK-0012' }));
    expect(drawer.getByText('Selasa, 27 Oktober 2026 · 09.00–11.00 WIB')).toBeInTheDocument();
    expect(drawer.getByText('Rp50.000 × 2 jam')).toBeInTheDocument();
    expect(drawer.getByText('Rp100.000')).toBeInTheDocument();
    const history = within(drawer.getByRole('list')).getAllByRole('listitem');
    expect(history[0]).toHaveTextContent(/pengingat dikirim ke penyedia.*sistem.*terbaru/i);
    expect(history[1]).toHaveTextContent(/pesanan dibuat.*budi santoso/i);
  });

  it('pencarian kode pesanan', async () => {
    const user = userEvent.setup();
    renderAt('/admin/pesanan');
    await user.type(screen.getByRole('searchbox'), 'bk-0007');
    expect(table().getAllByRole('row')).toHaveLength(2);
    expect(table().getByText('Ditolak')).toBeInTheDocument();
  });
});
