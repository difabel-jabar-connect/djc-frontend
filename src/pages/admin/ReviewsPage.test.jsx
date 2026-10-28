import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderAt } from '@/test/renderWithRouter';

const list = () => within(screen.getByRole('list', { name: 'Daftar ulasan' }));
const cardOf = (code) => list().getByText(code).closest('li');

describe('Moderasi Ulasan', () => {
  it('ulasan dilaporkan tampil paling atas; ?tab=dilaporkan memfilter', () => {
    renderAt('/admin/ulasan?tab=dilaporkan');
    expect(screen.getByRole('tab', { name: /dilaporkan/i })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    const cards = list().getAllByRole('listitem');
    expect(cards).toHaveLength(2);
    expect(cards[0]).toHaveTextContent(/dilaporkan oleh penyedia: bahasa tidak pantas/i);
    expect(within(cards[0]).getByRole('img', { name: 'Rating 1 dari 5' })).toBeInTheDocument();
  });

  it('menyembunyikan ulasan dengan alasan dan menampilkannya lagi', async () => {
    const user = userEvent.setup();
    renderAt('/admin/ulasan');
    await user.click(screen.getByRole('button', { name: 'Sembunyikan ulasan BK-0005' }));
    const dialog = within(screen.getByRole('dialog', { name: 'Sembunyikan ulasan?' }));
    expect(dialog.getByText('Ulasan Joko Susilo · BK-0005')).toBeInTheDocument();
    await user.type(dialog.getByRole('textbox', { name: /alasan/i }), 'Mengandung kata kasar.');
    await user.click(dialog.getByRole('button', { name: 'Ya, Sembunyikan' }));
    expect(await screen.findByText(/ulasan bk-0005 disembunyikan/i)).toBeInTheDocument();
    expect(cardOf('BK-0005')).toHaveTextContent(
      /disembunyikan oleh andi pratama.*mengandung kata kasar/i,
    );

    await user.click(screen.getByRole('button', { name: 'Tampilkan lagi ulasan BK-0003' }));
    const show = within(screen.getByRole('dialog', { name: 'Tampilkan lagi ulasan?' }));
    await user.type(show.getByRole('textbox', { name: /alasan/i }), 'Nomor kontak sudah dihapus.');
    await user.click(show.getByRole('button', { name: 'Ya, Tampilkan' }));
    expect(await screen.findByText(/ulasan bk-0003 ditampilkan lagi/i)).toBeInTheDocument();
    expect(within(cardOf('BK-0003')).getByText('Ditampilkan')).toBeInTheDocument();
  });

  it('filter rating dan pencarian', async () => {
    const user = userEvent.setup();
    renderAt('/admin/ulasan');
    await user.selectOptions(screen.getByLabelText('Rating:'), '5');
    expect(list().getAllByRole('listitem')).toHaveLength(2);
    await user.type(screen.getByRole('searchbox'), 'zzz');
    expect(
      screen.getByRole('heading', { name: /tidak ada ulasan untuk filter ini/i }),
    ).toBeVisible();
  });
});
