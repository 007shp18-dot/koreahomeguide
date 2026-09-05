# Global investment visual foundation

Release scope: SignedPrice only. Legacy KoreaHomeGuide is unchanged.

This release establishes the first production visual pass for a cross-border residential property research product.

- Add shared title, body, control, metadata, line, radius, and research-frame tokens without replacing compatibility tokens.
- Keep building photography first in the detail hierarchy and use a 7:5 desktop media-to-identity layout with a 16:9 media frame.
- Replace decorative building-photo fallback graphics with one neutral unavailable state. Price evidence boundaries remain in the evidence section.
- Replace badge-like identity facts with a semantic definition list and remove the decorative identity eyebrow.
- Flatten building summary, profile, decision, news, and community surfaces by removing gradients and card shadows.
- Reduce the public News hero to a direct title and summary, combine type and market filters into one bar, and remove decorative arrows.
- Preserve Explore return state, Check entity context, canonical News queries, policy routes, source disclosures, and 44px controls.

Validation before integration:

- `pnpm --dir v2 test`: 219 files and 2,036 tests passed.
- `pnpm --dir v2/apps/web typecheck`: passed.
- `pnpm --dir v2/apps/web lint`: passed.
- `pnpm --dir v2/apps/web build`: passed; 890 static pages generated.
- `git diff --check`: passed.

The cloud browser could not open the local `terminal.local` preview, and the repository Playwright browser executable could not be downloaded in this environment. The rendered browser checks remain required on the Vercel preview before production promotion.
