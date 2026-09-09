'use client';

import Link from 'next/link';
import { useState, type ComponentProps } from 'react';

// Prepare only the destination the visitor is approaching, rather than
// downloading all four cities' datasets when the home page opens.
export function ExploreLink(props: ComponentProps<typeof Link>) {
  const [approached, setApproached] = useState(false);
  return <Link {...props} prefetch={approached ? null : false}
    onMouseEnter={(event) => { setApproached(true); props.onMouseEnter?.(event); }}
    onFocus={(event) => { setApproached(true); props.onFocus?.(event); }}
    onTouchStart={(event) => { setApproached(true); props.onTouchStart?.(event); }}
  />;
}
