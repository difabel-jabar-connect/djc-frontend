import { SAMPLE_PLATFORM_INFO } from './settingsData';
import {
  diffPlatformInfo,
  passwordStrength,
  validatePasswordChange,
  validatePlatformInfo,
  validateProfile,
} from './settingsForm';

describe('settingsForm', () => {
  it('validateProfile memeriksa nama dan nomor WhatsApp', () => {
    expect(validateProfile({ name: 'Andi Pratama', phone: '81322446677' })).toEqual({});
    const errors = validateProfile({ name: ' ', phone: '0812' });
    expect(errors.name).toMatch(/wajib/);
    expect(errors.phone).toMatch(/9–13 angka/);
  });

  it('passwordStrength menghitung syarat yang terpenuhi', () => {
    expect(passwordStrength('')).toMatchObject({ score: 0, label: '' });
    expect(passwordStrength('abc')).toMatchObject({ label: 'Lemah' });
    expect(passwordStrength('abcdefgh1')).toMatchObject({ score: 2, label: 'Sedang' });
    expect(passwordStrength('abcDEF123')).toMatchObject({ score: 3, label: 'Kuat' });
  });

  it('validatePasswordChange', () => {
    expect(
      validatePasswordChange({ current: 'lama', next: 'abcDEF123', confirm: 'abcDEF123' }),
    ).toEqual({});
    const errors = validatePasswordChange({ current: '', next: 'abc', confirm: 'x' });
    expect(Object.keys(errors)).toEqual(['current', 'next', 'confirm']);
    expect(
      validatePasswordChange({ current: 'abcDEF123', next: 'abcDEF123', confirm: 'abcDEF123' })
        .next,
    ).toMatch(/berbeda/);
  });

  it('validatePlatformInfo memeriksa field wajib dan format email', () => {
    expect(validatePlatformInfo(SAMPLE_PLATFORM_INFO)).toEqual({});
    const errors = validatePlatformInfo({ ...SAMPLE_PLATFORM_INFO, name: '', email: 'salah' });
    expect(errors.name).toBeTruthy();
    expect(errors.email).toMatch(/format email/i);
  });

  it('diffPlatformInfo meringkas perubahan per field', () => {
    expect(diffPlatformInfo(SAMPLE_PLATFORM_INFO, SAMPLE_PLATFORM_INFO)).toEqual([]);
    const changes = diffPlatformInfo(SAMPLE_PLATFORM_INFO, {
      ...SAMPLE_PLATFORM_INFO,
      hours: 'Senin–Jumat, 08.00–16.00 WIB',
      partners: [
        ...SAMPLE_PLATFORM_INFO.partners,
        { id: 'p-baru', name: 'Dinsos', description: '', icon: 'building' },
      ],
    });
    expect(changes).toEqual([
      {
        key: 'hours',
        label: 'Jam Layanan',
        section: 'Kontak Bantuan',
        before: '08.00–15.00 WIB',
        after: '08.00–16.00 WIB',
      },
      {
        key: 'partners',
        label: 'Mitra Kolaborasi',
        section: 'Mitra Kolaborasi',
        before: null,
        after: 'ditambah Dinsos',
      },
    ]);
  });
});
