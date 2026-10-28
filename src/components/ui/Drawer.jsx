import { useEffect, useRef } from 'react';
import './Drawer.css';

/**
 * Panel samping (drawer) berbasis `<dialog>` modal: fokus terkurung, latar inert,
 * Escape/klik latar menutup, fokus kembali ke pemicu. Isi tersusun dari
 * `.drawer__head`, `.drawer__body` (bergulir), dan `.drawer__foot` opsional.
 */
export default function Drawer({ open, onClose, labelledBy, describedBy, children }) {
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
      if (returnFocusRef.current?.isConnected) returnFocusRef.current.focus();
    }
  }, [open]);

  return (
    // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-noninteractive-element-interactions
    <dialog
      ref={ref}
      className="drawer"
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
      {open && <div className="drawer__panel">{children}</div>}
    </dialog>
  );
}
