import { checkPasswordRequirements, maskEmail, passwordStrength } from './password';

describe('passwordStrength', () => {
  it.each([
    ['', 0, 'belum diisi'],
    ['abc', 1, 'lemah'],
    ['abcdefgh', 1, 'lemah'],
    ['abcdefg1', 2, 'sedang'],
    ['abcdef1!', 3, 'kuat'],
    ['Abcdefg1', 3, 'kuat'],
  ])('%j → %i (%s)', (password, score, label) => {
    expect(passwordStrength(password)).toMatchObject({ score, label });
  });
});

describe('maskEmail', () => {
  it('menyamarkan bagian lokal email', () => {
    expect(maskEmail('rina.amalia@gmail.com')).toBe('rina•••@gmail.com');
    expect(maskEmail('ab@x.id')).toBe('a•••@x.id');
    expect(maskEmail('bukan-email')).toBe('');
  });
});

describe('checkPasswordRequirements', () => {
  const met = (password) =>
    checkPasswordRequirements(password)
      .items.filter((item) => item.met)
      .map((item) => item.key);

  it('menilai tiap syarat & kekuatan dari jumlah syarat terpenuhi', () => {
    expect(checkPasswordRequirements('')).toMatchObject({ score: 0, valid: false });
    expect(met('abc')).toEqual([]);
    expect(checkPasswordRequirements('abc')).toMatchObject({ score: 1, label: 'Lemah' });
    expect(met('jabarinklusif')).toEqual(['length']);
    expect(met('JabarInklusif')).toEqual(['length', 'case']);
    expect(checkPasswordRequirements('JabarInklusif')).toMatchObject({
      score: 2,
      label: 'Sedang',
      valid: false,
    });
    expect(checkPasswordRequirements('Jabar2026Inklusif')).toMatchObject({
      score: 3,
      label: 'Kuat',
      valid: true,
    });
  });
});
