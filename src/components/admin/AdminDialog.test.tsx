import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRef, useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AdminDialog } from './AdminDialog';

afterEach(cleanup);

function DialogHarness({
  busy = false,
  onClose = vi.fn(),
}: {
  busy?: boolean;
  onClose?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const openerRef = useRef<HTMLButtonElement>(null);
  const close = () => {
    onClose();
    setOpen(false);
  };
  return (
    <>
      <button ref={openerRef} onClick={() => setOpen(true)}>
        Mở hộp thoại
      </button>
      <AdminDialog
        open={open}
        title="Hộp thoại thử nghiệm"
        busy={busy}
        returnFocusRef={openerRef}
        onClose={close}
      >
        <input aria-label="Trường đầu tiên" autoFocus />
        <button>Hành động cuối</button>
        <span data-testid="backdrop-child">Nội dung</span>
      </AdminDialog>
    </>
  );
}

describe('AdminDialog', () => {
  it('closes from its close button and restores focus to the opener', async () => {
    const user = userEvent.setup();
    render(<DialogHarness />);
    const opener = screen.getByRole('button', { name: 'Mở hộp thoại' });
    await user.click(opener);
    expect(await screen.findByRole('textbox', { name: 'Trường đầu tiên' })).toHaveFocus();
    await user.click(screen.getByRole('button', { name: 'Đóng' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(opener).toHaveFocus();
  });

  it('closes on Escape and a direct backdrop click, but not from backdrop descendants', async () => {
    const user = userEvent.setup();
    render(<DialogHarness />);
    const opener = screen.getByRole('button', { name: 'Mở hộp thoại' });
    await user.click(opener);
    await user.click(screen.getByTestId('backdrop-child'));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    await user.click(opener);
    await user.click(document.querySelector('.admin-dialog-backdrop') as HTMLElement);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('contains keyboard focus within the dialog', async () => {
    const user = userEvent.setup();
    render(<DialogHarness />);
    await user.click(screen.getByRole('button', { name: 'Mở hộp thoại' }));
    const first = await screen.findByRole('textbox', { name: 'Trường đầu tiên' });
    const close = screen.getByRole('button', { name: 'Đóng' });
    close.focus();
    await user.tab({ shift: true });
    expect(screen.getByRole('button', { name: 'Hành động cuối' })).toHaveFocus();
    first.focus();
    await user.tab({ shift: true });
    expect(close).toHaveFocus();

    screen.getByRole('button', { name: 'Hành động cuối' }).focus();
    await user.tab();
    expect(close).toHaveFocus();

    screen.getByRole('dialog').focus();
    await user.tab();
    expect(close).toHaveFocus();
  });

  it('locks body scrolling while open and restores the previous value after close', async () => {
    document.body.style.overflow = 'clip';
    const user = userEvent.setup();
    render(<DialogHarness />);
    await user.click(screen.getByRole('button', { name: 'Mở hộp thoại' }));
    expect(document.body).toHaveStyle({ overflow: 'hidden' });
    await user.keyboard('{Escape}');
    expect(document.body).toHaveStyle({ overflow: 'clip' });
  });

  it('locks every dismissal path while busy', async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    render(<DialogHarness busy onClose={onClose} />);
    await user.click(screen.getByRole('button', { name: 'Mở hộp thoại' }));
    expect(screen.getByRole('button', { name: 'Đóng' })).toBeDisabled();
    await user.keyboard('{Escape}');
    await user.click(document.querySelector('.admin-dialog-backdrop') as HTMLElement);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(onClose).not.toHaveBeenCalled();
  });
});
