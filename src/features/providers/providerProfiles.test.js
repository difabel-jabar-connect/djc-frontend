import { getProviderProfile } from './providerProfiles';

describe('getProviderProfile', () => {
  it('mengembalikan null untuk id tidak dikenal', () => {
    expect(getProviderProfile('tidak-ada')).toBeNull();
  });

  it('memakai detail desain untuk Siti', () => {
    const siti = getProviderProfile('siti-nurjanah');
    expect(siti.packages).toHaveLength(3);
    expect(siti.workDays).not.toContain(0);
    expect(siti.serviceAreas).toEqual(['Depok', 'Jakarta Selatan', 'Tangerang']);
  });

  it('menurunkan nilai bawaan dari data dasar untuk penyedia lain', () => {
    const fahri = getProviderProfile('fahri-hidayat');
    expect(fahri.workDays).toEqual([0, 6]);
    expect(fahri.packages).toEqual([
      expect.objectContaining({ title: 'Terapi Pijat', priceFrom: 60000, priceUnit: 'jam' }),
    ]);
    expect(fahri.reviews).toEqual([]);
  });
});
