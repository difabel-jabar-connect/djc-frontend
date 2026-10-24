import { maskEmail, passwordStrength } from './password';

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
