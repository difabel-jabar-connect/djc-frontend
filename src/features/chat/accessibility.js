import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Bantuan aksesibilitas chat (FE-06): banner jenis disabilitas mitra dan ketik dengan suara.
 */

const NOTES = {
  tunarungu:
    'Mitra Anda adalah Teman Tuli. Mohon berkomunikasi lewat pesan teks yang jelas dan singkat, bukan telepon.',
  tuli: 'Mitra Anda adalah Teman Tuli. Mohon berkomunikasi lewat pesan teks yang jelas dan singkat, bukan telepon.',
  tunawicara:
    'Mitra Anda memiliki hambatan bicara. Chat teks adalah cara terbaik untuk berkomunikasi.',
  tunanetra:
    'Mitra Anda adalah Teman Netra yang memakai pembaca layar. Tulis pesan dengan kalimat lengkap dan hindari pesan yang hanya berisi emoji.',
  netra:
    'Mitra Anda adalah Teman Netra yang memakai pembaca layar. Tulis pesan dengan kalimat lengkap dan hindari pesan yang hanya berisi emoji.',
  tunadaksa:
    'Mitra Anda adalah penyandang disabilitas fisik. Balasan bisa sedikit lebih lama, mohon bersabar. Pesan cepat di bawah bisa membantu.',
  tunagrahita:
    'Mitra Anda adalah penyandang disabilitas intelektual. Gunakan kalimat sederhana dan satu pertanyaan per pesan.',
};

/** Catatan komunikasi untuk pelanggan, atau null bila jenis disabilitas tidak diketahui. */
export function disabilityNote(type) {
  const key = String(type ?? '')
    .trim()
    .toLowerCase();
  if (!key) return null;
  return (
    NOTES[key] ??
    `Mitra Anda adalah penyandang disabilitas (${type}). Mohon berkomunikasi dengan jelas dan sabar.`
  );
}

const getRecognition = () =>
  typeof window === 'undefined'
    ? null
    : (window.SpeechRecognition ?? window.webkitSpeechRecognition ?? null);

export const speechSupported = () => Boolean(getRecognition());

/**
 * Ketik dengan suara memakai Web Speech API bawaan browser (bahasa Indonesia).
 * `onText(teks)` dipanggil dengan hasil final tiap kalimat. Browser tanpa dukungan
 * (mis. Firefox) → `supported = false`, tombol mikrofon tidak ditampilkan.
 */
export function useSpeechInput(onText) {
  const [listening, setListening] = useState(false);
  const [error, setError] = useState('');
  const recognitionRef = useRef(null);
  const onTextRef = useRef(onText);
  onTextRef.current = onText;
  const supported = speechSupported();

  const stop = useCallback(() => {
    recognitionRef.current?.stop();
  }, []);

  const start = useCallback(() => {
    const Recognition = getRecognition();
    if (!Recognition) return;
    const recognition = new Recognition();
    recognition.lang = 'id-ID';
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.onresult = (event) => {
      const text = Array.from(event.results)
        .filter((result) => result.isFinal ?? true)
        .map((result) => result[0]?.transcript ?? '')
        .join(' ')
        .trim();
      if (text) onTextRef.current(text);
    };
    recognition.onerror = (event) => {
      setError(
        event.error === 'not-allowed' || event.error === 'service-not-allowed'
          ? 'Izin mikrofon ditolak. Aktifkan mikrofon di pengaturan browser.'
          : event.error === 'no-speech'
            ? 'Suara tidak terdengar. Coba lagi.'
            : 'Ketik dengan suara gagal. Coba lagi.',
      );
    };
    recognition.onend = () => {
      setListening(false);
      recognitionRef.current = null;
    };
    recognitionRef.current = recognition;
    setError('');
    setListening(true);
    try {
      recognition.start();
    } catch {
      setListening(false);
      setError('Ketik dengan suara gagal. Coba lagi.');
    }
  }, []);

  useEffect(() => () => recognitionRef.current?.abort?.(), []);

  return { supported, listening, error, start, stop };
}
