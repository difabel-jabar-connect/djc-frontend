import { useEffect, useRef } from 'react';
import './Dialog.css';

/**
 * Dialog modal berbasis `<dialog>` bawaan browser: fokus terkurung di dalam dialog,
 * latar belakang inert, dan Escape menutup dialog. Saat ditutup, fokus kembali ke
 * elemen yang membukanya.
 */
export default function Dialog({
  open,
  onClose,
  labelledBy,
  describedBy,
  className = '',
  children,
}) {
  const ref = useRef(null);
  const returnFocusRef = useRef(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      returnFocusRef.current = document.activeElement;
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
      returnFocusRef.current?.focus?.();
    }
  }, [open]);

  return (
    // Klik pada area latar (di luar kotak dialog) menutup dialog; tombol tutup & Escape
    // tetap jadi cara utama sehingga tidak perlu handler keyboard tambahan.
    // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-noninteractive-element-interactions
    <dialog
      ref={ref}
      className={`dialog ${className}`.trim()}
      aria-labelledby={labelledBy}
      aria-describedby={describedBy}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target === ref.current) onClose();
      }}
    >
      {open && <div className="dialog__box">{children}</div>}
    </dialog>
  );
}
