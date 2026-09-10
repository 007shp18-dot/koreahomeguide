'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import type { ExplorerBuilding } from '../lib/seoul-explorer-data';

type BuildingDialogProps = {
  readonly building: ExplorerBuilding;
  readonly open: boolean;
  readonly rentCheckHref: string | null;
  readonly onClose?: () => void;
};

function evidenceValue(value: number | null, formatter: (value: number) => string) {
  return value === null ? 'Unavailable — not provided by the official source' : formatter(value);
}

export function BuildingDialog({
  building,
  open,
  rentCheckHref,
  onClose,
}: BuildingDialogProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!open) return;
    const previousFocus = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null;
    const previousBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeButtonRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose?.();
      if (event.key === 'Tab') {
        const focusableElements = Array.from(
          dialogRef.current?.querySelectorAll<HTMLElement>(
            'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
          ) ?? [],
        );
        const first = focusableElements[0];
        const last = focusableElements.at(-1);
        if (!first || !last) return;

        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousBodyOverflow;
      previousFocus?.focus();
    };
  }, [onClose, open]);

  if (!open) return null;

  return (
    <div
      className="building-dialog-backdrop"
      onPointerDown={(event) => {
        if (event.currentTarget === event.target) onClose?.();
      }}
    >
      <section
        ref={dialogRef}
        className="building-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="building-dialog-title"
      >
        <header className="building-dialog__header">
          <div>
            <p className="section-eyebrow">Building detail</p>
            <h2 id="building-dialog-title">{building.nameEn}</h2>
            <p>{building.nameKo}</p>
          </div>
          <button
            ref={closeButtonRef}
            className="building-dialog__close"
            type="button"
            aria-label="Close building details"
            onClick={onClose}
          >
            Close ×
          </button>
        </header>

        <div className="building-dialog__body">
          <section className="building-dialog__street-view" aria-label={building.streetView.label}>
            <div className="building-dialog__section-heading">
              <span>01</span>
              <h3>Street View</h3>
            </div>
            <div className="street-view-frame">
              <p>Street View unavailable in this parity preview</p>
            </div>
            <p className="building-dialog__disclaimer">{building.streetView.disclaimer}</p>
          </section>

          <section className="building-dialog__evidence" aria-labelledby="building-evidence-title">
            <div className="building-dialog__section-heading">
              <span>02</span>
              <h3 id="building-evidence-title">Reported contract evidence</h3>
            </div>
            <dl className="building-evidence-grid">
              <div>
                <dt>Deposit</dt>
                <dd>{evidenceValue(building.evidence.depositWon, (value) => `₩${value.toLocaleString('en-US')}`)}</dd>
              </div>
              <div>
                <dt>Monthly rent</dt>
                <dd>{evidenceValue(building.evidence.monthlyRentWon, (value) => `₩${value.toLocaleString('en-US')}`)}</dd>
              </div>
              <div>
                <dt>Adjusted rent / ㎡</dt>
                <dd>{evidenceValue(building.evidence.adjustedPerSqmWon, (value) => `₩${value.toLocaleString('en-US')}`)}</dd>
              </div>
              <div>
                <dt>Reported contracts</dt>
                <dd>{evidenceValue(building.evidence.contractCount, (value) => `${value.toLocaleString('en-US')} contracts`)}</dd>
              </div>
            </dl>
            <p className="building-dialog__notice">
              This parity preview does not contain current official contract values. Missing evidence remains unavailable, never zero.
            </p>
          </section>
        </div>

        <footer className="building-dialog__footer">
          {rentCheckHref ? <Link href={rentCheckHref}>Check my quote</Link> : null}
          <button type="button" onClick={onClose}>Close details</button>
        </footer>
      </section>
    </div>
  );
}
