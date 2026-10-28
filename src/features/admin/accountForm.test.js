import {
  emptyAccountForm,
  formatPhone,
  normalizeLocalPhone,
  regionShort,
  validateAccount,
} from './accountForm';

const valid = (overrides = {}) => ({
  ...emptyAccountForm('pengguna'),
  name: 'Sari Wahyuni',
  email: 'sari@email.com',
  phone: '81398765432',
  region: 'Kabupaten Bandung',
  ...overrides,
});

describe('formulir Tambah Akun', () => {
  it('menerima data Pengguna yang lengkap', () => {
    expect(validateAccount(valid())).toEqual({});
  });

  it('memvalidasi field wajib dan format', () => {
    const errors = validateAccount(emptyAccountForm('pengguna'));
    expect(Object.keys(errors)).toEqual(['name', 'email', 'phone', 'region']);
    expect(validateAccount(valid({ email: 'salah' })).email).toMatch(/format email/i);
    expect(validateAccount(valid({ phone: '0812' })).phone).toMatch(/9–13 angka/);
    expect(validateAccount(valid(), ['sari@email.com']).email).toBe('Email ini sudah terdaftar.');
  });

  it('Pengelola wajib email instansi, jabatan, dan alasan', () => {
    const staff = valid({ type: 'pengelola' });
    const errors = validateAccount(staff);
    expect(errors.email).toMatch(/@uptdppsghd\.id/);
    expect(errors.position).toBeDefined();
    expect(errors.reason).toMatch(/minimal 10/);
    expect(
      validateAccount({
        ...staff,
        email: 'rina@uptdppsghd.id',
        position: 'Staf',
        reason: 'Staf baru bidang alumni.',
      }),
    ).toEqual({});
  });

  it('menormalkan nomor WhatsApp dan nama wilayah', () => {
    expect(normalizeLocalPhone('0812-3456-7890')).toBe('81234567890');
    expect(normalizeLocalPhone('+62 812 3456 7890')).toBe('81234567890');
    expect(formatPhone('081234567890')).toBe('+62 812-3456-7890');
    expect(regionShort('Kabupaten Garut')).toBe('Garut');
  });
});
