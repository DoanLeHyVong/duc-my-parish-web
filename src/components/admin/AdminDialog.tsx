import { X } from 'lucide-react';
import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  type ReactNode,
  type RefObject,
} from 'react';
import { createPortal } from 'react-dom';

type AdminDialogProps = {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  busy?: boolean;
  className?: string;
  initialFocusRef?: RefObject<HTMLElement | null>;
  returnFocusRef?: RefObject<HTMLElement | null>;
};

const focusableSelector = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

export function AdminDialog({
  open,
  title,
  onClose,
  children,
  busy = false,
  className = '',
  initialFocusRef,
  returnFocusRef,
}: AdminDialogProps) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const lastOutsideFocusRef = useRef<HTMLElement | null>(null);
  const onCloseRef = useRef(onClose);
  const busyRef = useRef(busy);
  busyRef.current = busy;

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (open) return;
    const rememberOutsideFocus = (event: FocusEvent) => {
      if (event.target instanceof HTMLElement) lastOutsideFocusRef.current = event.target;
    };
    const rememberPointerTarget = (event: PointerEvent) => {
      if (event.target instanceof HTMLElement) lastOutsideFocusRef.current = event.target;
    };
    document.addEventListener('focusin', rememberOutsideFocus);
    document.addEventListener('pointerdown', rememberPointerTarget, true);
    return () => {
      document.removeEventListener('focusin', rememberOutsideFocus);
      document.removeEventListener('pointerdown', rememberPointerTarget, true);
    };
  }, [open]);

  const rememberPanel = useCallback((panel: HTMLDivElement | null) => {
    if (panel && !panelRef.current) {
      const active = document.activeElement;
      if (active instanceof HTMLElement && !panel.contains(active)) {
        lastOutsideFocusRef.current = active;
      }
    }
    panelRef.current = panel;
  }, []);

  useLayoutEffect(() => {
    if (!open) return;
    const opener = returnFocusRef?.current ?? lastOutsideFocusRef.current;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const focusInitialControl = () => {
      const body = panelRef.current?.querySelector<HTMLElement>('.admin-dialog-body');
      const requested = initialFocusRef?.current;
      const preferred =
        requested && panelRef.current?.contains(requested)
          ? requested
          : body?.querySelector<HTMLElement>('[autofocus]');
      const first =
        preferred ??
        body?.querySelector<HTMLElement>(focusableSelector) ??
        panelRef.current?.querySelector<HTMLElement>(focusableSelector);
      (first ?? panelRef.current)?.focus();
    };
    const frame = window.requestAnimationFrame(focusInitialControl);

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (!busyRef.current) {
          event.preventDefault();
          onCloseRef.current();
        }
        return;
      }
      if (event.key !== 'Tab' || !panelRef.current) return;
      const controls = Array.from(
        panelRef.current.querySelectorAll<HTMLElement>(focusableSelector),
      );
      if (!controls.length) {
        event.preventDefault();
        panelRef.current.focus();
        return;
      }
      const first = controls[0]!;
      const last = controls[controls.length - 1]!;
      const active = document.activeElement;
      const focusIsInternal = active instanceof Node && panelRef.current.contains(active);
      if (event.shiftKey && (!focusIsInternal || active === first || active === panelRef.current)) {
        event.preventDefault();
        last.focus();
      } else if (
        !event.shiftKey &&
        (!focusIsInternal || active === last || active === panelRef.current)
      ) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      window.cancelAnimationFrame(frame);
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
      if (opener?.isConnected) {
        queueMicrotask(() => opener.focus());
      }
    };
  }, [initialFocusRef, open, returnFocusRef]);

  if (!open) return null;

  return createPortal(
    <div
      className="admin-dialog-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !busy) onClose();
      }}
    >
      <div
        ref={rememberPanel}
        className={`admin-dialog ${className}`.trim()}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-busy={busy || undefined}
        tabIndex={-1}
      >
        <header className="admin-dialog-header">
          <h2 id={titleId}>{title}</h2>
          <button
            type="button"
            className="admin-dialog-close"
            aria-label="Đóng"
            disabled={busy}
            onMouseDown={(event) => event.preventDefault()}
            onClick={onClose}
          >
            <X aria-hidden="true" />
          </button>
        </header>
        <div className="admin-dialog-body">{children}</div>
      </div>
    </div>,
    document.body,
  );
}
