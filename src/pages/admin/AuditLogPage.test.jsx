import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderAt } from '@/test/renderWithRouter';

const table = () => within(screen.getByRole('table', { name: /audit log/i }));

describe('Audit Log', () => {
  it('membuka detail log: alasan lengkap, sebelum → sesudah, dan ID log', async () => {
    const user = userEvent.setup();
    renderAt('/admin/audit');
    expect(screen.getByText('Menampilkan 1–8 dari 10 log')).toBeInTheDocument();
    const button = table().getByRole('button', {
      name: 'Lihat detail log 25 Okt 2026 14.05 WIB',
    });
    expect(button).toHaveAttribute('aria-expanded', 'false');
    await user.click(button);
    expect(button).toHaveAttribute('aria-expanded', 'true');
    const detail = document.getElementById(button.getAttribute('aria-controls'));
    expect(detail).toBeVisible();
    expect(detail).toHaveTextContent(/membuat 6 pesanan fiktif/i);
    expect(detail).toHaveTextContent(/status:\s*aktif.*disuspensi/i);
    expect(detail).toHaveTextContent('LOG-2026-10-25-00412');
    expect(table().getByRole('link', { name: 'Joko Susilo' })).toHaveAttribute(
      'href',
      '/admin/user?cari=Joko+Susilo',
    );
  });

  it('filter aktor dengan chip aktif dan state kosong', async () => {
    const user = userEvent.setup();
    renderAt('/admin/audit');
    await user.selectOptions(screen.getByLabelText('Aktor:'), 'Sistem');
    expect(screen.getByText('Menampilkan 1–1 dari 1 log')).toBeInTheDocument();
    expect(table().getByText('BK-0014')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Hapus filter Aktor: Sistem' }));
    expect(screen.getByText('Menampilkan 1–8 dari 10 log')).toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText('Aksi:'), 'hapus_kategori');
    expect(screen.getByRole('heading', { name: /tidak ada log untuk filter ini/i })).toBeVisible();
    await user.click(screen.getAllByRole('button', { name: /reset filter/i })[0]);
    expect(screen.getByRole('table', { name: /audit log/i })).toBeInTheDocument();
  });

  it('tautan dari Audit Log membuka Kelola User dengan pencarian terisi', async () => {
    const user = userEvent.setup();
    renderAt('/admin/audit');
    await user.click(table().getByRole('link', { name: 'Joko Susilo' }));
    expect(screen.getByRole('searchbox', { name: /cari nama atau email/i })).toHaveValue(
      'Joko Susilo',
    );
    expect(
      within(screen.getByRole('table', { name: 'Daftar user' })).getAllByRole('row'),
    ).toHaveLength(2);
  });
});
