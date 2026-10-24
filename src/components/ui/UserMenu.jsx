import { useEffect, useId, useRef, useState } from 'react';
import { Link } from 'react-router';

/**
 * Popover sederhana berpola disclosure: tombol + panel. Tutup dengan Escape
 * (fokus kembali ke tombol) atau klik di luar. Dipakai menu akun & notifikasi.
 */
export function Disclosure({ className, buttonProps, buttonContent, children }) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const rootRef = useRef(null);
  const buttonRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const onPointer = (event) => {
      if (!rootRef.current?.contains(event.target)) setOpen(false);
    };
    const onKey = (event) => {
      if (event.key === 'Escape') {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    document.addEventListener('pointerdown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const close = () => setOpen(false);

  return (
    <div className={className} ref={rootRef}>
      <button
        ref={buttonRef}
        type="button"
        className={`${className}__button`}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((value) => !value)}
        {...buttonProps}
      >
        {buttonContent}
      </button>
      <div id={panelId} className={`${className}__panel`} hidden={!open}>
        {typeof children === 'function' ? children(close) : children}
      </div>
    </div>
  );
}

/**
 * Menu akun (topbar dashboard & header situs saat masuk).
 * `items`: `{ label, to }` untuk tautan atau `{ label, onClick }` untuk aksi.
 */
export default function UserMenu({ className = 'user-menu', label, buttonContent, items }) {
  return (
    <Disclosure
      className={className}
      buttonProps={label ? { 'aria-label': label } : undefined}
      buttonContent={buttonContent}
    >
      {(close) => (
        <ul className={`${className}__menu`}>
          {items.map((item) => (
            <li key={item.label}>
              {item.to ? (
                <Link to={item.to} onClick={close}>
                  {item.label}
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    close();
                    item.onClick();
                  }}
                >
                  {item.label}
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </Disclosure>
  );
}
