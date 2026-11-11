import sapuLidi from '@/assets/photos/kerja-sapu-lidi.jpg';
import jahit from '@/assets/photos/kerja-jahit.jpg';
import solder from '@/assets/photos/kerja-solder.jpg';
import kue from '@/assets/photos/kerja-kue.jpg';

/**
 * Foto dunia keahlian (thumbnail kecil di kartu penyedia; bukan foto penyedia/pelanggan), dari Wikimedia Commons
 * dengan lisensi terbuka. Kreditnya tampil di footer. Ganti dengan foto milik sendiri bila ada.
 */
export const PHOTOS = {
  sapuLidi: {
    src: sapuLidi,
    width: 250,
    height: 250,
    alt: 'Deretan sapu lidi digantung di depan toko',
    title: 'Sapu Lidi',
    creator: 'Rahdetya',
    license: 'CC BY 4.0',
    page: 'https://commons.wikimedia.org/wiki/File:Sapu_Lidi.jpg',
  },
  jahit: {
    src: jahit,
    width: 250,
    height: 187,
    alt: 'Tangan penjahit menuntun kain bermotif di bawah jarum mesin jahit',
    title: 'A Tailor Sewing Clothes in Her Shop',
    creator: 'Meritkosy',
    license: 'CC BY-SA 4.0',
    page: 'https://commons.wikimedia.org/wiki/File:A_Tailor_Sewing_Clothes_in_Her_Shop.jpg',
  },
  solder: {
    src: solder,
    width: 250,
    height: 170,
    alt: 'Tangan memegang solder di atas papan sirkuit pada alas kerja biru',
    title: 'Precision in Repair, The Art of Electronics Restoration',
    creator: 'Jameswasswa',
    license: 'CC BY-SA 4.0',
    page: 'https://commons.wikimedia.org/wiki/File:Precision_in_Repair,_The_Art_of_Electronics_Restoration.jpg',
  },
  kue: {
    src: kue,
    width: 250,
    height: 169,
    alt: 'Nampan berisi kue pai susu dengan hiasan cokelat dan buah',
    title: 'Kue Pie Susu',
    creator: 'Supardisahabu',
    license: 'CC BY-SA 4.0',
    page: 'https://commons.wikimedia.org/wiki/File:Kue_Pie_Susu.jpg',
  },
};

/** Foto dunia keahlian per kategori (dipakai di folder penyedia unggulan). */
export const CATEGORY_PHOTOS = {
  kebersihan: PHOTOS.sapuLidi,
  jahit: PHOTOS.jahit,
  'servis-elektronik': PHOTOS.solder,
  kuliner: PHOTOS.kue,
};
