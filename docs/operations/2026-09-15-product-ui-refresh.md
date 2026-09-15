# SignedPrice product UI refresh

Approved direction: white surfaces, original brand-blue actions (#2563d8), consistent rounded controls, city photography, clear information hierarchy. Apply to home, discovery, saved places, insights and community; defer My Page.

The existing Next.js application, routes, data providers, storage and account behavior are retained. No database migrations or new personal-data processing are introduced. Existing rankings, news, guides and tools remain accessible through More and mobile navigation. All three supported languages retain their routes. The approved mockup statistics and posts are not production content.

Implementation uses existing CSS modules and installed components instead of introducing competing UI frameworks. Existing locally hosted fonts and licensed photographs are reused. Shared controls retain visible focus, native semantics and reduced-motion support.

Validation: full Next.js compilation and generation of 4,379 pages passed; TypeScript and changed-component lint passed; full unit suite passed (3,526 passed, 87 skipped), followed by 17 header checks after the final navigation adjustment. Hosted home, Singapore filters and Dubai selected-project cards were inspected. Final polish normalizes Korean heading spacing, body leading and removes decorative selected-card side stripes while preserving selected backgrounds and keyboard focus. Preview community data currently returns its connection-error state; no synthetic posts are substituted. CI browser checks are still being reviewed.
