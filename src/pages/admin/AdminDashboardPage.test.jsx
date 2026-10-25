import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { renderAt } from '@/test/renderWithRouter';

describe('Dashboard Pengelola', () => {
  it('menampilkan statistik program, grafik beraksesibel, dan verifikasi', () => {
    renderAt('/admin');
    expect(
      screen.getByRole('heading', { level: 1, name: /dashboard monitoring program/i }),
    ).toBeVisible();
    const stats = within(screen.getByRole('region', { name: /ringkasan program/i }));
    expect(stats.getByText('2.346')).toBeInTheDocument();
    expect(stats.getByText('+4 kota')).toBeInTheDocument();

    expect(
      screen.getByRole('img', { name: /alumni aktif per bulan 2026: jan 1\.420/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('img', { name: /pesanan per bulan 2026: .*okt 192/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/naik 60% dari sep \(120\)/i)).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Capaian 94 persen dari target' })).toBeInTheDocument();
    expect(screen.getByText(/tinggal 154 alumni lagi/i)).toBeInTheDocument();

    const nav = screen.getByRole('navigation', { name: /menu pengelola/i });
    expect(within(nav).getByRole('link', { name: 'Verifikasi, 18 menunggu' })).toHaveAttribute(
      'href',
      '#verifikasi',
    );
    expect(within(nav).getByText('Pengaturan').closest('[aria-disabled]')).toHaveAttribute(
      'aria-disabled',
      'true',
    );
  });

  it('Unduh Laporan membuat file CSV', async () => {
    const createObjectURL = vi.fn(() => 'blob:laporan');
    const revokeObjectURL = vi.fn();
    vi.stubGlobal('URL', Object.assign(globalThis.URL, { createObjectURL, revokeObjectURL }));
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    const user = userEvent.setup();
    renderAt('/admin');

    await user.click(screen.getByRole('button', { name: /unduh laporan/i }));
    expect(createObjectURL).toHaveBeenCalledWith(expect.any(Blob));
    expect(click).toHaveBeenCalled();
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:laporan');
  });

  it('menu akun membuka dan menutup dengan Escape', async () => {
    const user = userEvent.setup();
    renderAt('/admin');
    const button = screen.getByRole('button', { name: /andi pratama/i });
    expect(button).toHaveAttribute('aria-expanded', 'false');
    await user.click(button);
    expect(button).toHaveAttribute('aria-expanded', 'true');
    await user.keyboard('{Escape}');
    expect(button).toHaveAttribute('aria-expanded', 'false');
    expect(button).toHaveFocus();
  });
});
