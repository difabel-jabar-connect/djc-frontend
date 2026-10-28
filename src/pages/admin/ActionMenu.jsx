import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';

/**
 * Tombol menu (pola WAI-ARIA Menu Button): Enter/Spasi/↓ membuka & memfokuskan item
 * pertama, ↑/↓/Home/End berpindah item, Escape menutup dan mengembalikan fokus.
 * Panel memakai posisi `fixed` agar tidak terpotong wadah tabel yang bergulir.
 *
 * `items`: `{ label, description?, icon?, tone?, onSelect }`.
 */
export default function ActionMenu({
  label,
  menuLabel,
  buttonClassName,
  buttonContent,
  items,
  note,
  disabled = false,
  describedBy,
  width = 240,
}) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState(null);
  const menuId = useId();
  const buttonRef = useRef(null);
  const panelRef = useRef(null);
  const itemRefs = useRef([]);

  const close = (restoreFocus = true) => {
    setOpen(false);
    if (restoreFocus) buttonRef.current?.focus();
  };

  const focusItem = (index) => {
    const count = items.length;
    itemRefs.current[(index + count) % count]?.focus();
  };

  // Hitung posisi panel dari tombol; balik ke atas bila ruang di bawah tidak cukup.
  useLayoutEffect(() => {
    if (!open) return;
    const rect = buttonRef.current.getBoundingClientRect();
    const panelHeight = panelRef.current?.offsetHeight ?? 0;
    const below = rect.bottom + 8 + panelHeight <= window.innerHeight || rect.top < panelHeight;
    const right = Math.max(8, window.innerWidth - rect.right);
    setPosition(
      below
        ? { top: rect.bottom + 8, right }
        : { bottom: window.innerHeight - rect.top + 8, right },
    );
  }, [open]);

  // Fokus ke item pertama setelah panel diposisikan (panel tersembunyi tidak bisa difokus).
  useEffect(() => {
    if (open && position) itemRefs.current[0]?.focus();
  }, [open, position]);

  useEffect(() => {
    if (!open) return undefined;
    const onPointer = (event) => {
      if (!panelRef.current?.contains(event.target) && !buttonRef.current?.contains(event.target))
        setOpen(false);
    };
    const onScroll = (event) => {
      if (!panelRef.current?.contains(event.target)) setOpen(false);
    };
    document.addEventListener('pointerdown', onPointer);
    window.addEventListener('scroll', onScroll, true);
    window.addEventListener('resize', onScroll);
    return () => {
      document.removeEventListener('pointerdown', onPointer);
      window.removeEventListener('scroll', onScroll, true);
      window.removeEventListener('resize', onScroll);
    };
  }, [open]);

  const onButtonKeyDown = (event) => {
    if (disabled) return;
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      setOpen(true);
    }
  };

  const onMenuKeyDown = (event) => {
    const index = itemRefs.current.indexOf(document.activeElement);
    const keys = {
      ArrowDown: () => focusItem(index + 1),
      ArrowUp: () => focusItem(index - 1),
      Home: () => focusItem(0),
      End: () => focusItem(items.length - 1),
      Escape: () => close(),
      Tab: () => setOpen(false),
    };
    if (!keys[event.key]) return;
    if (event.key !== 'Tab') event.preventDefault();
    keys[event.key]();
  };

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        className={buttonClassName}
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        aria-disabled={disabled || undefined}
        aria-describedby={describedBy}
        onClick={() => !disabled && setOpen((value) => !value)}
        onKeyDown={onButtonKeyDown}
      >
        {buttonContent}
      </button>
      {open && (
        // Wadah hanya meneruskan tombol panah ke item menu di dalamnya.
        // eslint-disable-next-line jsx-a11y/no-static-element-interactions
        <div
          ref={panelRef}
          className="ad-menu"
          style={{ width, ...position, visibility: position ? 'visible' : 'hidden' }}
          onKeyDown={onMenuKeyDown}
        >
          <div id={menuId} role="menu" aria-label={menuLabel ?? label} className="ad-menu__list">
            {items.map(({ label: itemLabel, description, icon: Icon, tone, onSelect }, index) => (
              <button
                key={itemLabel}
                ref={(node) => {
                  itemRefs.current[index] = node;
                }}
                type="button"
                role="menuitem"
                tabIndex={-1}
                className={`ad-menu__item${tone ? ` ad-menu__item--${tone}` : ''}`}
                onClick={() => {
                  close(false);
                  onSelect();
                }}
              >
                {Icon && (
                  <span
                    className={`ad-menu__icon${tone ? ` ad-menu__icon--${tone}` : ''}`}
                    aria-hidden="true"
                  >
                    <Icon size={description ? 20 : 18} strokeWidth={2.25} />
                  </span>
                )}
                <span className="ad-menu__text">
                  <span className="ad-menu__label">{itemLabel}</span>
                  {description && <span className="ad-menu__desc">{description}</span>}
                </span>
              </button>
            ))}
          </div>
          {note && <p className="ad-menu__note">{note}</p>}
        </div>
      )}
    </>
  );
}
