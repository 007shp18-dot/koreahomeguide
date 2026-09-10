'use client';

import type { Intent } from '@signedprice/market-core';
import type { IntentGroupModel } from '../lib/site-copy';

type IntentTabsProps = {
  label: string;
  groups: readonly IntentGroupModel[];
  selectedId?: Intent;
  onSelect?: (intent: Intent) => void;
};

export function IntentTabs({
  label,
  groups,
  selectedId = 'rent',
  onSelect,
}: IntentTabsProps) {
  return (
    <nav className="intent-tabs" aria-label={label}>
      {groups.map((group) => {
        const isActive = group.id === selectedId;

        return (
          <div
            className={`intent-tabs__group${isActive ? ' intent-tabs__group--active' : ''}`}
            key={group.id}
          >
            <button
              className="intent-tabs__trigger"
              type="button"
              aria-pressed={isActive}
              onClick={() => onSelect?.(group.id)}
            >
            <span className="intent-tabs__label">{group.label}</span>
              <span className="intent-tabs__description">{group.description}</span>
            </button>
            <ul className="intent-tabs__destinations" hidden>
              {group.destinations.map((destination) => (
                <li key={destination.href}>
                  <a href={destination.href} aria-label={destination.ariaLabel}>
                    {destination.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </nav>
  );
}
