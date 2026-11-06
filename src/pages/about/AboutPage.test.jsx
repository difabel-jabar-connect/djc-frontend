import { screen, within } from '@testing-library/react';
import { renderAt } from '@/test/renderWithRouter';

describe('Halaman Tentang', () => {
  it('menampilkan seluruh bagian sesuai desain', () => {
    renderAt('/tentang');
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      'Tentang Difabel Jabar Connect',
    );
    const headings = screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent);
    expect(headings).toEqual(
      expect.arrayContaining([
        'Keterampilan ada, akses belum',
        'Tujuan kami',
        'Satu Alur dari Cari hingga Ulasan',
        'Lokasi adalah Inti Platform',
        'Dibuat bersama difabel',
        'Bekerja Sama dengan',
        'Jawa Barat yang lebih inklusif',
      ]),
    );
    expect(
      within(
        screen.getByRole('list', { name: /sebelumnya, masyarakat sulit menemukan/i }),
      ).getAllByRole('listitem'),
    ).toHaveLength(7);
  });

  it('alur 6 langkah & status pesanan memakai teks, bukan hanya warna', () => {
    renderAt('/tentang');
    const flow = within(screen.getByRole('list', { name: 'Alur penggunaan' }));
    expect(flow.getAllByRole('heading', { level: 3 }).map((h) => h.textContent)).toEqual([
      'Langkah 1: Cari',
      'Langkah 2: Pilih Penyedia',
      'Langkah 3: Lihat Lokasi',
      'Langkah 4: Pesan',
      'Langkah 5: Layanan Berjalan',
      'Langkah 6: Beri Ulasan',
    ]);
    expect(screen.getByRole('list', { name: 'Status pesanan' })).toHaveTextContent(
      'Status: MenungguStatus: DiterimaStatus: BerjalanStatus: Selesai',
    );
  });

  it('tautan ke Cari Layanan, profil penyedia di peta, dan kontak', () => {
    renderAt('/tentang');
    const cta = screen.getAllByRole('link', { name: 'Cari Layanan' });
    expect(cta.every((link) => link.getAttribute('href') === '/services')).toBe(true);
    expect(screen.getByRole('link', { name: 'Lihat detail Deni Setiawan' })).toHaveAttribute(
      'href',
      '/provider/deni-setiawan',
    );
    expect(screen.getByRole('link', { name: /hubungi kami/i })).toHaveAttribute('href', '#kontak');
    expect(document.getElementById('kontak')).toHaveTextContent('UPTD PPSGHD Jawa Barat');
  });

  it('peta 3D hero menampilkan titik lokasi yang sama dengan Beranda', () => {
    renderAt('/tentang');
    const labels = [...document.querySelectorAll('.about-hero__visual .topo__label')].map(
      (label) => label.textContent,
    );
    expect(labels).toEqual(['Purwakarta', 'Bandung', 'Indramayu', 'Cirebon', 'Tasikmalaya']);
  });

  it('header menandai menu Tentang sebagai halaman aktif', () => {
    renderAt('/tentang');
    const nav = within(screen.getByRole('navigation', { name: /navigasi utama/i }));
    expect(nav.getByRole('link', { name: 'Tentang' })).toHaveAttribute('aria-current', 'page');
  });
});
