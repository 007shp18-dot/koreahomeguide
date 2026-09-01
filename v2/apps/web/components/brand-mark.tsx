type BrandMarkProps = Readonly<{
  size: number;
  inverted?: boolean;
}>;

type BrandWordmarkProps = Readonly<{
  compact?: boolean;
  inverted?: boolean;
}>;

export function BrandMark({ size, inverted = false }: BrandMarkProps) {
  return (
    <svg
      aria-hidden="true"
      className={inverted ? 'brand-mark brand-mark--inverted' : 'brand-mark'}
      focusable="false"
      height={size}
      viewBox="0 0 32 32"
      width={size}
    >
      <path
        className="brand-mark__ink"
        d="M4 9 L28 23"
        strokeLinecap="square"
        strokeWidth="5.5"
      />
      <path
        className="brand-mark__paper"
        d="M4 23 L28 9"
        strokeLinecap="square"
        strokeWidth="10"
      />
      <path
        className="brand-mark__orange"
        d="M4 23 L28 9"
        strokeLinecap="square"
        strokeWidth="5.5"
      />
    </svg>
  );
}

export function BrandWordmark({ compact = false, inverted = false }: BrandWordmarkProps) {
  const modifiers = [
    'brand-wordmark',
    compact ? 'brand-wordmark--compact' : null,
    inverted ? 'brand-wordmark--inverted' : null,
  ].filter((className): className is string => className !== null);

  return (
    <span className={modifiers.join(' ')} data-brand-wordmark="true">
      <BrandMark inverted={inverted} size={compact ? 22 : 28} />
      <span className="brand-wordmark__type">
        <span className="brand-wordmark__signed">signed</span>
        <span className="brand-wordmark__price">price</span>
      </span>
    </span>
  );
}
