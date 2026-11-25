import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { DEMO_ACCOUNTS } from '@/features/auth/session';
import { fakeApi, fakeFetch } from '@/test/fakeApi';
import { renderAt } from '@/test/renderWithRouter';

const LIVE_PROVIDER = {
  id: '11111111-1111-4111-8111-111111111111',
  role: 'provider',
  name: 'Deni Setiawan',
  email: 'deni@djc.test',
  city: 'Kota Bekasi',
};

beforeEach(() => {
  fakeApi.reset();
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date(2026, 9, 19, 9)); // Senin, 19 Oktober 2026 pukul 09.00
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

const ordersTable = () => within(screen.getByRole('region', { name: /pesanan masuk/i }));

describe('Dashboard Penyedia', () => {
  it('melindungi rute dengan RequireAuth role provider (tamu & customer dialihkan)', () => {
    const guest = renderAt('/dashboard/provider');
    expect(guest.router.state.location.pathname).toBe('/login');
    guest.unmount();

    const customer = renderAt('/dashboard/provider', { user: DEMO_ACCOUNTS.customer });
    expect(customer.router.state.location.pathname).toBe('/');
  });

  it('menampilkan sambutan, statistik, dan menu dengan jumlah pesanan baru (mode demo)', () => {
    renderAt('/dashboard/provider', { user: DEMO_ACCOUNTS.provider });
    expect(
      screen.getByRole('heading', { level: 1, name: /selamat datang, deni setiawan/i }),
    ).toBeVisible();
    expect(screen.queryByRole('navigation', { name: /navigasi utama/i })).not.toBeInTheDocument();
    const nav = screen.getByRole('navigation', { name: /menu penyedia/i });
    expect(within(nav).getByRole('link', { name: 'Pesanan Masuk, 2 baru' })).toHaveAttribute(
      'href',
      '#pesanan',
    );
    expect(within(nav).getByRole('link', { name: /profil saya/i })).toHaveAttribute(
      'href',
      '/provider/deni-setiawan',
    );
    expect(within(nav).getByRole('link', { name: /layanan saya/i })).toHaveAttribute(
      'href',
      '#layanan',
    );
    expect(screen.getByRole('link', { name: 'Notifikasi, 4 belum dibaca' })).toBeInTheDocument();
    expect(screen.getByRole('progressbar', { name: /kelengkapan profil/i })).toHaveAttribute(
      'aria-valuenow',
      '85',
    );
  });

  it('memproses alur pesanan penuh dari requested → accepted → in_progress → completed ke API backend', async () => {
    fakeApi.bookings = [
      {
        id: '22222222-2222-4222-8222-222222222222',
        code: 'DJC-20261019-0001',
        status: 'requested',
        service: { id: 'svc-1', title: 'Servis Kipas Angin' },
        provider: { id: 'prov-1', display_name: 'Deni Setiawan', city: 'Kota Bekasi' },
        customer: { name: 'Budi S.', phone: null },
        scheduled_date: '2026-10-19',
        start_time: '10:00',
        service_mode: 'at_customer',
        location: { area: 'Bekasi Selatan', address: null },
        customer_note: 'Kipas tidak menyala',
        pricing_type_snapshot: 'starting_from',
        unit_price_snapshot: 50000,
        quantity: 1,
        estimated_total: 50000,
        actual_quantity: null,
        final_total: null,
        created_at: '2026-10-19T01:00:00.000Z',
      },
    ];
    vi.stubGlobal('fetch', vi.fn(fakeFetch));

    const user = userEvent.setup();
    renderAt('/dashboard/provider', { user: LIVE_PROVIDER });

    expect(await ordersTable().findByText('Budi S.')).toBeVisible();

    // 1. Terima (requested → accepted)
    await user.click(ordersTable().getByRole('button', { name: 'Terima pesanan Budi S.' }));
    expect(await screen.findByText(/kini berstatus diterima/i)).toBeInTheDocument();

    // 2. Mulai (accepted → in_progress)
    await user.click(ordersTable().getByRole('button', { name: /mulai pesanan budi/i }));
    expect(await screen.findByText(/kini berstatus diproses/i)).toBeInTheDocument();

    // 3. Selesai (in_progress → completed dengan final_total)
    await user.click(ordersTable().getByRole('button', { name: /selesai pesanan budi/i }));
    const dialog = within(screen.getByRole('dialog', { name: /selesaikan pesanan/i }));
    const totalInput = dialog.getByLabelText(/total biaya akhir/i);
    await user.clear(totalInput);
    await user.type(totalInput, '85000');
    await user.click(dialog.getByRole('button', { name: 'Konfirmasi Selesai' }));

    expect(await screen.findByText(/kini berstatus selesai/i)).toBeInTheDocument();
    expect(fakeApi.calls.map((c) => `${c.method} ${c.path}`)).toEqual(
      expect.arrayContaining([
        'PUT /bookings/22222222-2222-4222-8222-222222222222/accept',
        'PUT /bookings/22222222-2222-4222-8222-222222222222/start',
        'PUT /bookings/22222222-2222-4222-8222-222222222222/complete',
      ]),
    );
    const completeCall = fakeApi.calls.find((c) => c.path.endsWith('/complete'));
    expect(completeCall.body).toEqual({ final_total: 85000 });
  });

  it('menolak pesanan dengan alasan minimal 10 karakter ke API backend', async () => {
    fakeApi.bookings = [
      {
        id: '33333333-3333-4333-8333-333333333333',
        code: 'DJC-20261019-0002',
        status: 'requested',
        service: { id: 'svc-1', title: 'Servis TV' },
        provider: { id: 'prov-1', display_name: 'Deni Setiawan', city: 'Kota Bekasi' },
        customer: { name: 'Ani W.', phone: null },
        scheduled_date: '2026-10-19',
        start_time: '13:00',
        service_mode: 'at_customer',
        location: { area: 'Bekasi Timur', address: null },
        customer_note: '',
        pricing_type_snapshot: 'fixed',
        unit_price_snapshot: 100000,
        quantity: 1,
        estimated_total: 100000,
        created_at: '2026-10-19T01:00:00.000Z',
      },
    ];
    vi.stubGlobal('fetch', vi.fn(fakeFetch));

    const user = userEvent.setup();
    renderAt('/dashboard/provider', { user: LIVE_PROVIDER });
    await ordersTable().findByText('Ani W.');

    await user.click(ordersTable().getByRole('button', { name: 'Tolak pesanan Ani W.' }));
    const dialog = within(screen.getByRole('dialog', { name: /tolak pesanan/i }));
    await user.type(dialog.getByLabelText(/alasan penolakan/i), 'Singkat');
    await user.click(dialog.getByRole('button', { name: 'Ya, Tolak Pesanan' }));
    expect(dialog.getByText(/minimal 10 karakter/i)).toBeInTheDocument();

    await user.clear(dialog.getByLabelText(/alasan penolakan/i));
    await user.type(dialog.getByLabelText(/alasan penolakan/i), 'Jadwal penuh pada jam tersebut.');
    await user.click(dialog.getByRole('button', { name: 'Ya, Tolak Pesanan' }));

    expect(await screen.findByText(/pesanan ani w\. telah ditolak/i)).toBeInTheDocument();
    const rejectCall = fakeApi.calls.find((c) => c.path.endsWith('/reject'));
    expect(rejectCall.body).toEqual({ reason: 'Jadwal penuh pada jam tersebut.' });
  });

  it('menambah dan menonaktifkan layanan lewat /provider/services', async () => {
    vi.stubGlobal('fetch', vi.fn(fakeFetch));
    const user = userEvent.setup();
    renderAt('/dashboard/provider', { user: LIVE_PROVIDER });

    const servicesSection = within(screen.getByRole('region', { name: /layanan saya/i }));
    await servicesSection.findByText('Servis Kipas Angin');

    await user.click(servicesSection.getByRole('button', { name: /tambah layanan/i }));
    const dialog = within(screen.getByRole('dialog', { name: /tambah layanan baru/i }));
    await user.type(dialog.getByLabelText(/judul layanan/i), 'Servis Blender');
    await user.type(dialog.getByLabelText(/harga \(rp\)/i), '60000');
    await user.click(dialog.getByRole('button', { name: 'Simpan Layanan' }));

    expect(await servicesSection.findByText('Servis Blender')).toBeVisible();
    await user.click(
      servicesSection.getByRole('button', { name: 'Nonaktifkan layanan Servis Blender' }),
    );
    await waitFor(() =>
      expect(
        servicesSection.getByRole('button', { name: 'Aktifkan layanan Servis Blender' }),
      ).toBeInTheDocument(),
    );
  });

  it('jadwal mingguan: agenda hari terpilih & navigasi minggu', async () => {
    const user = userEvent.setup();
    renderAt('/dashboard/provider', { user: DEMO_ACCOUNTS.provider });
    const schedule = within(screen.getByRole('region', { name: /jadwal minggu ini/i }));

    expect(schedule.getByText('19 – 25 Oktober 2026')).toBeInTheDocument();
    expect(
      schedule.getByRole('button', { name: /senin 19 okt, hari ini, ada jadwal/i }),
    ).toHaveAttribute('aria-current', 'date');
    expect(schedule.getByText('Servis TV')).toBeInTheDocument();

    await user.click(schedule.getByRole('button', { name: /selasa 20 okt/i }));
    expect(schedule.getByText('Servis Kipas Angin')).toBeInTheDocument();

    await user.click(schedule.getByRole('button', { name: 'Minggu berikutnya' }));
    expect(schedule.getByText('26 Oktober – 1 November 2026')).toBeInTheDocument();
    expect(schedule.getByText(/tidak ada jadwal/i)).toBeInTheDocument();
  });

  it('tombol Keluar memanggil API logout lalu kembali ke halaman Masuk', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));
    vi.stubGlobal('fetch', fetchMock);
    const user = userEvent.setup();
    const { router } = renderAt('/dashboard/provider', { user: DEMO_ACCOUNTS.provider });

    const nav = screen.getByRole('navigation', { name: /menu penyedia/i });
    await user.click(within(nav).getByRole('button', { name: 'Keluar' }));
    expect(fetchMock.mock.calls[0][0]).toBe('http://api.test/api/v1/auth/logout');
    await vi.waitFor(() => expect(router.state.location.pathname).toBe('/login'));
  });
});
