'use client';

import React, { useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  description?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
  /** Hide the built-in header (for fully custom layouts). */
  bare?: boolean;
  dismissible?: boolean;
}

const SIZES = { sm: 'sm:max-w-md', md: 'sm:max-w-xl', lg: 'sm:max-w-2xl' };

/**
 * Accessible dialog: bottom sheet on mobile, centred card on desktop.
 * Locks body scroll, closes on Escape / backdrop click, and restores focus on close.
 */
export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
  bare = false,
  dismissible = true,
}: ModalProps) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!open) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const { overflow } = document.body.style;
    document.body.style.overflow = 'hidden';
    panelRef.current?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && dismissible) onCloseRef.current();
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = overflow;
      document.removeEventListener('keydown', onKey);
      previouslyFocused?.focus?.();
    };
  }, [open, dismissible]);

  if (!open || typeof document === 'undefined') return null;

  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center sm:p-6">
      <div
        className="absolute inset-0 animate-fade-in bg-ink-950/80 backdrop-blur-sm"
        onClick={dismissible ? onClose : undefined}
        aria-hidden
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        tabIndex={-1}
        className={cn(
          'relative flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-3xl border border-white/[0.08] bg-ink-900 shadow-2xl outline-none sm:max-h-[88dvh] sm:rounded-3xl',
          'animate-slide-up sm:animate-scale-in',
          SIZES[size]
        )}
      >
        <div className="mx-auto mt-2.5 h-1 w-10 shrink-0 rounded-full bg-white/15 sm:hidden" aria-hidden />
        {!bare && (title || dismissible) && (
          <div className="flex items-start justify-between gap-4 border-b border-white/[0.06] px-5 pb-4 pt-3 sm:px-6 sm:pt-5">
            <div className="min-w-0">
              {title && (
                <h2 id={titleId} className="text-lg font-bold leading-tight">
                  {title}
                </h2>
              )}
              {description && <div className="mt-1 text-sm text-slate-400">{description}</div>}
            </div>
            {dismissible && (
              <button onClick={onClose} className="btn btn-ghost -mr-2 h-9 w-9 shrink-0 p-0" aria-label="Close">
                <X className="h-5 w-5" />
              </button>
            )}
          </div>
        )}
        <div className="flex-1 overflow-y-auto overscroll-contain px-5 py-5 sm:px-6">{children}</div>
        {footer && <div className="border-t border-white/[0.06] bg-ink-900/95 px-5 py-4 pb-safe sm:px-6">{footer}</div>}
      </div>
    </div>,
    document.body
  );
}
