import type { IntentGroupModel } from '../lib/site-copy';

type IntentTabsProps = {
  label: string;
  groups: readonly IntentGroupModel[];
};

export function IntentTabs({ label, groups }: IntentTabsProps) {
  return (
    <nav className="intent-tabs" aria-label={label}>
      {groups.map((group) => (
        <div className="intent-tabs__group" key={group.id}>
          <p className="intent-tabs__label">{group.label}</p>
          <ul className="intent-tabs__destinations">
            {group.destinations.map((destination) => (
              <li key={destination.href}>
                <a href={destination.href} aria-label={destination.ariaLabel}>
                  {destination.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  );
}
