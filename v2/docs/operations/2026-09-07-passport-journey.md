# Passport to Explore and Check

Passport now carries its validated local return URL (original amount, currency and Dubai sale stage) through candidate links, Explore selections, evidence pages, Check and scenario-calculator return links. A compact reference-budget strip appears only during a Passport journey. Reference budgets never populate Check asking-price fields.

Dubai's Passport comparison separates Ready and Off-Plan apartment area evidence. Switching stages changes candidate counts, indicative price basis and evidence counts, suppresses Ready rental yields in Off-Plan mode, and preserves the stage when recalculating or sharing the budget. The Explore entry passes the converted AED median-price ceiling, apartment type and sale stage. A selected area's headline and Check link use its selected available stage and housing type.

Seoul and Singapore retain the budget as reference context; their general Explore lists are not newly filtered by budget. Passport candidate lists remain budget-filtered. Seoul enters the sale/apartment layer. Do not describe the change as a universal Explore budget filter.

Existing static Passport and area routes remain static; no database calls, new external APIs, or recurring jobs are introduced. The existing dated reference FX snapshot is unchanged.

Validation: 46 focused tests across Passport, scenario context, three-city navigation/selection and Dubai stage-to-Check handoff passed. Type checking and production build were run. Browser/mobile visual QA remains outstanding: the supervised preview requires a Vite-compatible command and restricts dependencies to the checkout, while this retained app is a Next monorepo. The earlier browser connection also timed out. Do not claim mobile visual approval.


## Production browser follow-up

Production dpl_tMDw5qih8Z3mdcE5ERfE3KzTzx8T reached READY. Desktop browser QA confirmed a synthetic USD 500,000 Passport budget survives Off-Plan selection, Jabal Ali First Explore selection with an area marker, area detail (AED 1,764,560 / 855 sales), and Check with apartment / Off-Plan selected and an empty asking price.

Follow-up corrections: preserve validated Passport context in all three markets’ GET Check forms; explicitly scope comparable Dubai area links to their displayed housing and stage; prevent spurious vertical scroll controls beside Passport numbers while retaining horizontal access to long values. Added form-validation and comparable-link regression coverage. Mobile browser verification remains outstanding.
