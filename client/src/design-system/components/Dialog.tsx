import { useEffect, useId, useRef, type ReactNode } from 'react';
import { IconButton } from './IconButton';
import './Dialog.css';

interface DialogProps {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  children: ReactNode;
  /** Buttons along the bottom; put the primary action last. */
  actions?: ReactNode;
}

/**
 * Modal built on the native <dialog>: focus moves in and is contained, Escape closes it, and focus
 * returns to whatever opened it. On phones it rises as a bottom sheet, within thumb reach.
 * Content only mounts while open, so it always reflects the latest state.
 */
export function Dialog({ open, onClose, title, children, actions }: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      className="dialog"
      aria-labelledby={titleId}
      onClose={onClose}
      // A click on the dialog element itself (not the panel) is a click on the backdrop.
      onClick={(e) => e.target === ref.current && onClose()}
    >
      {open && (
        <div className="dialog__panel">
          <div className="dialog__header">
            <h2 className="dialog__title" id={titleId}>
              {title}
            </h2>
            <IconButton icon="x" label="Close" className="dialog__close" onClick={onClose} />
          </div>
          <div className="dialog__body">{children}</div>
          {actions && <div className="dialog__actions">{actions}</div>}
        </div>
      )}
    </dialog>
  );
}
