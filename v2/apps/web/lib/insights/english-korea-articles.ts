import type { EditorialArticle, EditorialSource } from './editorial-content';
import { OFFICIAL_PROPERTY_SOURCES as S } from './official-property-sources';

const publishedAt = '2026-09-04T00:00:00.000Z';

function article(input: Readonly<{
  slug: string;
  title: string;
  summary: string;
  bodyMarkdown: string;
  sources: readonly EditorialSource[];
  readMinutes?: number;
}>): EditorialArticle {
  return Object.freeze({
    ...input,
    marketKey: 'seoul',
    status: 'published',
    publishedAt,
    updatedAt: publishedAt,
    readMinutes: input.readMinutes ?? 6,
    sources: Object.freeze([...input.sources]),
  });
}

export const ENGLISH_KOREA_ARTICLES: readonly EditorialArticle[] = Object.freeze([
  article({
    slug: 'fixed-date-and-address-report-for-korea-renters',
    title: 'Fixed date and address report: two different steps for Korea renters',
    summary: 'A fixed date and a residence or address report are often mentioned together, but tenants should understand what each record proves and when to complete it.',
    sources: [S.housingLeaseAct, S.fixedDate, S.seoulHousing],
    bodyMarkdown: `## Separate the contract from the protection steps

Signing a lease creates the agreement, but it is not the last administrative step a tenant may need. In Korea, tenants commonly hear about a residence or address report and a fixed date (확정일자). They are related to the evidence surrounding the lease, yet they are not interchangeable labels. Keep the signed contract, payment records and property identity together, then treat each public filing as its own task.

## Understand what a fixed date records

A fixed date is attached to a qualifying lease document by an authorized office or service. It records that the document existed by that date; it does not certify that every clause is safe or that the landlord owns the property free of secured claims. Ask which document is being dated, confirm that the address and parties match the final signed lease, and retain the receipt or digital confirmation.

## Treat the address report as a separate checkpoint

The residence-related report connects the tenant's occupancy and address to the administrative record. Eligibility and the correct procedure can depend on the tenant's status and circumstances, so an international resident should confirm the applicable route instead of assuming a Korean citizen's screen or checklist is identical. Complete the step promptly after the conditions for it are met and keep evidence of completion.

## Check the property record before money moves

Neither step replaces a current real-estate registry review. Read the owner name, property description and registered rights before paying a large balance, then check again near the final payment if the timing or risk warrants it. A new mortgage, seizure or ownership change can alter the risk after the first viewing, and a fixed date cannot make that change disappear.

## Build one closing file

Keep the signed lease, identity documents, transfer receipts, registry copies, address-report confirmation and fixed-date confirmation in one dated file. If an agent or landlord says a step is unnecessary, ask for the reason in writing and verify it with the relevant public office or qualified adviser. SignedPrice explains the workflow, but it does not determine legal priority for an individual lease.`,
  }),
  article({
    slug: 'how-a-tenant-reads-a-korean-real-estate-register',
    title: 'How a tenant reads a Korean real-estate register',
    summary: 'The register is not a risk score. Read the property identity, owner and registered rights in order, then compare them with the lease you are about to sign.',
    sources: [S.registrationAct, S.housingLeaseAct, S.proxySigning],
    bodyMarkdown: `## Start with the exact property identity

The Korean real-estate register (등기부등본) must describe the same property that appears in the lease. Check the road address, building, unit and property category rather than relying on a marketing name alone. Multi-building complexes and officetels can have similar names, while a villa advertisement may use a neighborhood nickname that is absent from the official record.

## Match the registered owner to the signer

Read the current ownership section and compare the registered name with the identification presented at signing. If a representative signs, the representative's identity does not replace the owner's. Review the power of attorney and supporting documents, and verify important instructions through a contact route that is not controlled only by the representative.

## Read rights as a timeline, not a badge

Mortgages, seizures, provisional registrations and other entries have dates, parties and amounts or claim details. Their meaning depends on the full record and the timing of the planned lease. Do not reduce the page to “clean” or “not clean.” Note every unresolved entry, ask who benefits from it, and obtain qualified advice where the effect is unclear.

## Compare the register with the money at risk

A tenant's exposure is not only the monthly rent. Include the refundable deposit, payments scheduled before move-in and any amount that could be delayed in a dispute. Compare that exposure with the property's registered claims and other known tenancy facts. A low monthly payment does not make a large deposit low-risk.

## Recheck before final payment

A registry copy is a time-stamped view. If time passes between contract and balance payment, obtain a fresh copy close to the transfer and compare it line by line with the earlier version. Save both copies and the payment record. SignedPrice can structure the checklist, but only the official register and fact-specific professional review can establish the current legal position.`,
  }),
  article({
    slug: 'jeonse-guarantee-application-checklist',
    title: 'A practical jeonse guarantee application checklist',
    summary: 'Deposit guarantees have product rules, document requirements and timing gates. Check eligibility before treating a guarantee as part of your safety plan.',
    sources: [S.housingGuarantee, S.housingLeaseAct, S.leaseCounselling],
    bodyMarkdown: `## Verify the product before relying on it

“Jeonse guarantee” is a category, not a promise that every lease will be accepted. Providers can apply rules about the home, deposit, contract, landlord, valuation evidence, tenant status and application timing. Identify the exact guarantee product and provider, then use its current checklist. A broker's general statement that the home is “guarantee eligible” is not an approval.

## Screen the property and contract early

Check the official property identity, registered owner, registered rights, building record and intended use before signing. Ask whether any unauthorized alteration, unresolved ownership issue or address mismatch could affect the application. Put required landlord cooperation and document delivery into the negotiation rather than discovering the need after the balance has been paid.

## Prepare a document trail

Typical evidence may include the signed lease, fixed-date record, residence-related filing, payment receipts, registry material and identity or immigration documents. The exact set varies, so do not copy an old online list without checking the provider. Use consistent spellings and addresses across documents, and scan the final signed versions rather than drafts.

## Track the application deadline yourself

Timing is part of eligibility. Record the contract date, move-in and payment dates, reporting steps and provider deadline on one calendar. If a condition changes—such as a delayed move-in or amended deposit—ask whether the application must be updated. Silence from an intermediary should not be treated as confirmation.

## Keep a second safety plan

A guarantee can reduce one risk only when it is validly issued and its conditions remain satisfied. Continue to review the registry, document payments and preserve communications. If the provider declines or limits coverage, pause and reassess the lease rather than filling the gap with optimism. Product terms and law can change; verify the current official material for the specific application.`,
  }),
  article({
    slug: 'korea-rental-management-fees-explained',
    title: 'Korea rental management fees: read the monthly bill before signing',
    summary: 'A low advertised rent can hide a very different recurring cost. Separate fixed management charges, utilities and usage-based items before comparing homes.',
    sources: [S.seoulHousing, S.brokerageFees],
    bodyMarkdown: `## Compare total recurring cost

Monthly rent (월세) is only one line in a Korean rental budget. Management fees (관리비), electricity, gas, water, internet, parking and building services may be billed separately. Ask for the recent bill format and typical occupied-unit totals, then compare homes using the same bundle of included and excluded costs.

## Identify fixed and variable items

Some charges are fixed by unit or building rules; others move with usage, season or occupancy. A single summer or winter bill can be misleading, while an empty-unit bill may omit ordinary consumption. Request several recent periods when possible and label each line as fixed, metered, allocated or optional.

## Read the lease language

The lease should state the management charge, what it includes, how variable items are calculated and when payment is due. Vague phrases such as “utilities separate” leave too much room for different interpretations. Clarify parking, move-in fees, cleaning, elevator use and any building-specific charge before signing, and record agreed exceptions in the contract.

## Keep deposits separate from expenses

A refundable lease deposit should not be blurred with prepaid utilities, maintenance reserves or non-refundable fees. Ask for a receipt that names the purpose of each payment. If a broker quotes one “move-in amount,” break it into deposit, rent, brokerage, management, tax if applicable and other charges before transferring funds.

## Use the same comparison sheet for every home

Create columns for deposit, monthly rent, fixed management fee, typical utilities, parking, internet and one-time charges. Note which figures are documented and which are estimates. SignedPrice's transaction evidence can position the filed rent terms, but private management charges require the building's own documents and should remain visibly separate.`,
  }),
  article({
    slug: 'korea-lease-renewal-and-move-out-timeline',
    title: 'Build a Korea lease renewal and move-out timeline',
    summary: 'Renewal, notice, deposit return and moving dates interact. Put them on one timeline early enough to verify the current rules and negotiate gaps.',
    sources: [S.housingLeaseAct, S.seoulHousing],
    bodyMarkdown: `## Read the signed term first

Begin with the final lease and every written amendment. Record the start date, stated end date, renewal language, notice method and special clauses. Do not rely on the date in a chat thread when the executed contract says something different. If the arrangement has already continued beyond its original term, obtain advice on its present status before assuming the old notice clause controls everything.

## Separate legal rights from negotiation

Korean housing law may provide tenant protections and renewal rules, but applying them depends on facts and current law. A friendly renewal discussion does not waive the need to verify deadlines, and a landlord's preferred date is not automatically the legally effective date. Check the current official text or qualified guidance before sending a binding notice.

## Coordinate the deposit and next home

Tenants often need the returned deposit to fund the next lease. Put the expected return date, new-home payment date, moving reservation and any financing contingency on the same calendar. If the dates do not align, identify the gap early instead of assuming the next landlord, bank or mover can change at short notice.

## Document condition and handover

Before leaving, photograph the unit, meters and returned items, and agree how access cards, keys and final bills will be handled. Distinguish ordinary use from a specific damage claim and ask for an itemized explanation of any proposed deduction. Preserve the move-in record so the comparison is not based only on memory.

## Close every administrative loop

Confirm the deposit transfer, final rent and management charges, utility settlement, address change and receipt of any agreed documents. Keep communications in a durable form. This timeline is a planning tool rather than legal advice; notice effectiveness, renewal rights and deposit recovery should be checked against the current law and the actual contract.`,
  }),
  article({
    slug: 'verify-a-landlord-or-proxy-before-signing-in-korea',
    title: 'Verify a landlord or proxy before signing a Korea lease',
    summary: 'When the signer is not the registered owner, stop and verify the authority chain. A seal, business card or message is not enough by itself.',
    sources: [S.proxySigning, S.registrationAct, S.leaseCounselling],
    bodyMarkdown: `## Identify the registered owner

Obtain a current real-estate register for the exact unit and compare the owner name with government-issued identification. Check spelling, co-ownership and whether the lease requires more than one owner's consent. A broker's saved copy may be outdated, so note when the record was issued and recheck it near a large payment.

## Map the representative's authority

If a family member, employee or other proxy signs, ask for the power of attorney and supporting identity or seal documents appropriate to the transaction. Read what the authority actually covers: signing, receiving money and changing bank instructions are different acts. A document authorizing negotiation may not answer who can receive the deposit.

## Verify through an independent channel

Contact the owner using a number or method verified independently of the proxy when feasible. Confirm the property, lease terms, representative and receiving account. Treat a last-minute account change as a new verification event. Do not let urgency, travel claims or a crowded signing room replace the call.

## Align names across the transaction

The registered owner, lessor in the contract, authorized signer and bank-account holder should form an explainable chain. When they differ, write down why and what evidence supports the difference. Avoid transferring a large amount to an unrelated account without fact-specific professional confirmation and a documented reason.

## Save the evidence package

Keep the registry copy, identification check, authorization documents, confirmation messages, bank details and transfer receipts. Redact personal identifiers when sharing them beyond the transaction. SignedPrice can prompt the checks, but it cannot authenticate a private document or decide whether authority is legally sufficient.`,
  }),
  article({
    slug: 'korea-housing-lease-reporting-system-guide',
    title: 'Korea housing lease reporting: what the filing does and does not do',
    summary: 'The lease report is an administrative filing with its own scope and timing. It does not replace registry checks, payment evidence or contract review.',
    sources: [S.transactionReportAct, S.leaseReporting, S.fixedDate],
    bodyMarkdown: `## Identify whether the lease is in scope

Housing lease reporting rules depend on the transaction, location and current statutory criteria. Start with the official reporting service or local office rather than a screenshot from an older blog. Record the deposit, rent, signing date and property address exactly as agreed so the scope check is based on the real contract.

## Decide who will file and how

Landlord, tenant or an authorized person may handle steps under the applicable procedure, but both parties should know whether the filing was actually accepted. Agree who will submit, by what route and by what date. Ask for the completed confirmation instead of assuming that a broker's possession of the contract means the report is finished.

## Keep the filing consistent with the lease

Names, address, deposit, monthly rent and dates should match the executed document. If the parties amend a material term, check whether a new or corrected report is required. Save the submission receipt and any correction notice with the signed contract and transfer records.

## Do not confuse filing with verification

Acceptance of a report does not mean the authority has certified the market fairness of the rent, the condition of the home or the absence of registered claims. Continue to inspect the register, building record and signer authority. The filing also does not replace the tenant's separate residence-related and fixed-date steps where applicable.

## Verify current timing and exceptions

Deadlines and administrative interpretations can change, and special facts may alter the route. Check the current official page close to signing and use multilingual public counselling if needed. This guide explains the workflow but does not determine whether a specific unreported or late-reported contract faces a consequence.`,
  }),
  article({
    slug: 'can-foreigners-buy-property-in-korea',
    title: 'Can foreigners buy property in Korea?',
    summary: 'Foreign ownership is possible, but nationality, residence status, land controls, reporting and foreign-exchange steps can change the procedure.',
    sources: [S.foreignAcquisition, S.foreignAcquisitionLaws, S.registrationAct],
    bodyMarkdown: `## Start with the property, not a yes-or-no slogan

Foreigners can acquire Korean real estate, but the route is not identical for every buyer or site. The property type, land location, buyer's residence status, funding path and intended use can trigger different checks. Confirm the official parcel and building identity before asking which filing applies.

## Separate permission, reporting and registration

These words describe different legal or administrative steps. A transaction may require a report, a restricted location may raise an additional land-control question, and ownership still has to be registered. Do not treat completion of one step as proof that all other requirements have been satisfied.

## Trace the buyer and the funds

Resident and nonresident buyers can face different document and foreign-exchange procedures. Banks and registration offices may need identity, address, remittance or tax-related evidence. Establish the name that will appear on the contract and title, then keep the funding records consistent with that buyer.

## Review the ordinary purchase risks too

Foreign-buyer paperwork does not replace title review, building-record checks, contract conditions, financing approval, inspection or confirmation of unpaid charges. Compare reported transaction evidence with the exact home, but keep asking prices, valuations and completed contracts as separate evidence types.

## Use current, fact-specific advice

Official English summaries are helpful entry points, yet translated law pages may not always reflect the newest Korean text at the same time. Before paying a deposit, verify the current Korean requirements with the responsible authority and qualified legal, tax, foreign-exchange and registration professionals. SignedPrice supplies a decision map, not clearance for an individual acquisition.`,
  }),
  article({
    slug: 'resident-vs-nonresident-foreign-buyer-korea',
    title: 'Resident versus nonresident foreign buyers in Korea',
    summary: 'Residence status affects the acquisition workflow, especially identity, remittance and reporting documents. Classify the buyer before scheduling closing.',
    sources: [S.foreignAcquisitionProcedure, S.foreignAcquisitionLaws, S.foreignAcquisition],
    bodyMarkdown: `## Define residence for the relevant procedure

Everyday residence, immigration status and foreign-exchange residence are not always the same concept. Ask which definition the bank, reporting authority and registration process applies. Record the buyer's actual status and supporting documents rather than choosing the simpler checklist by preference.

## Map the nonresident document path early

A nonresident may need additional steps for fund remittance, a real-estate registration number or other identity evidence described by the current official process. These items can take time and may depend on documents issued abroad. Check translation, notarization or apostille requirements before the contractual payment schedule becomes fixed.

## Keep the money trail aligned

The sender, buyer, contract party and registered owner should form a documented chain. If family funds, a corporate account or financing is involved, disclose the structure to the relevant advisers and bank in advance. A successful international transfer does not itself confirm the acquisition or tax treatment.

## Coordinate contract conditions with readiness

Do not promise an unconditional closing date until identity, remittance, financing and registration requirements have been checked. Where appropriate, negotiate clear conditions for document failure or regulatory delay. A reservation form or developer schedule deserves the same scrutiny as a resale contract.

## Reconfirm before closing

Procedures, forms and office practice can change. Recheck the official Invest Korea and Easy Law guidance, then confirm the fact-specific route with the bank, registrar and qualified advisers handling the transaction. This distinction is a workflow aid, not a determination of anyone's legal residence status.`,
  }),
  article({
    slug: 'korea-property-acquisition-cost-checklist',
    title: 'A no-surprises cost checklist for buying property in Korea',
    summary: 'The purchase price is only the first line. Build a dated cost sheet for tax, brokerage, registration, financing and building-specific obligations.',
    sources: [S.localTaxAct, S.brokerageFees, S.foreignAcquisitionProcedure],
    bodyMarkdown: `## Freeze the transaction facts first

Cost estimates depend on who is buying, what is being bought, the price, location, number of homes owned, intended use and timing. Write those facts at the top of the sheet. A tax rate copied from another buyer can be wrong even when the purchase prices look similar.

## Separate statutory and professional costs

List acquisition-related tax, registration charges, legal or judicial-scrivener work, brokerage and required certificates on separate lines. Link each estimate to its official table or written quotation and date it. Avoid one unexplained “closing cost” percentage because it hides which assumption changed.

## Add financing and currency costs

Include loan appraisal, bank fees, interest timing, security registration and early-transfer or foreign-exchange costs where relevant. Use the bank's actual product terms rather than a promotional headline. For cross-border funding, show the exchange rate assumption separately so currency movement is not mistaken for a property cost.

## Check building-level obligations

Ask about unpaid management charges, repair or reserve arrangements, parking, move-in procedures, insurance and planned work. Clarify which amounts transfer with ownership and which remain the seller's responsibility. Obtain documentary confirmation instead of relying only on a viewing-day conversation.

## Recalculate at contract and closing

The final price, buyer facts or law may change between the first search and completion. Re-run the cost sheet before signing and again before the balance payment. This article deliberately avoids publishing a universal tax rate: use the current Local Tax Act, local authority material and fact-specific professional advice for the actual acquisition.`,
  }),
  article({
    slug: 'korea-registry-vs-building-ledger',
    title: 'Real-estate register versus building ledger in Korea',
    summary: 'The register and building ledger answer different questions. Use both, reconcile their identity fields and investigate material differences.',
    sources: [S.registrationAct, S.foreignAcquisition, S.housingLeaseAct],
    bodyMarkdown: `## Give each record one job

The real-estate register (등기부등본) is central to registered ownership and rights. The building ledger (건축물대장) records building-related administrative facts such as use and physical description. One document should not be used as a substitute for the other simply because it is easier to obtain.

## Reconcile the identity fields

Compare the address, parcel, building and unit references across the records and the contract. Marketing names, English spellings and local nicknames can obscure a mismatch. For multi-unit buildings, confirm that the record is for the individual unit or relevant building section, not merely the surrounding complex.

## Compare stated use with intended use

An officetel, apartment, multi-family home or other category can carry different practical and regulatory implications. Check the official use and structure rather than relying on the portal category. If the observed use differs from the record, pause for qualified review before assuming it can be regularized later.

## Investigate discrepancies instead of averaging them

A difference in area, floor, owner, unit number or building status is not something to smooth over. Ask which source is current, whether a change awaits registration and what document supports the explanation. Record the answer in the contract where it affects the transaction.

## Refresh both records near payment

Documents are time-specific. Obtain current versions at the decision points appropriate to the risk, preserve the issue date and compare changes. SignedPrice may display sourced building facts beside transaction evidence, but an unattached or conflicting field remains unverified until the official records are reconciled.`,
  }),
  article({
    slug: 'mortgages-seizures-and-claims-on-a-korean-register',
    title: 'Mortgages, seizures and secured claims on a Korean register',
    summary: 'Registered claims need a timeline and a payoff plan, not a color-coded risk badge. Read the entry, amount, beneficiary and release mechanics together.',
    sources: [S.registrationAct, S.housingLeaseAct],
    bodyMarkdown: `## Record every live entry

Read the current register from the first relevant entry through the latest. Note the registration date, right type, beneficiary and stated amount or maximum secured amount. Do not look only for the word “mortgage”; seizures, provisional registrations and other rights can matter to the planned payment.

## Distinguish debt from registered maximums

A registered maximum secured amount is not necessarily today's loan balance, and a verbal loan balance is not proof that the registered right has been released. Ask for documentary payoff information and a closing process that connects payment with cancellation or discharge where required.

## Put tenant or buyer money on the same timeline

Mark when the deposit, interim payment and balance will move relative to any release. The order of events can matter. If the plan depends on the buyer's or tenant's money paying an existing lender, obtain qualified advice and clear written closing instructions rather than relying on a promise that the entry will disappear later.

## Recheck for new entries

A clean review weeks before closing cannot rule out a later registration. Obtain a fresh register close to major payment and compare it with the saved version. If a new entry appears, stop the transfer until its effect and the revised closing sequence are understood.

## Avoid automated legal conclusions

An interface can extract dates and amounts, but it should not pronounce an individual deposit “safe” from those fields alone. Priority, enforceability and recovery depend on the full facts and current law. Use SignedPrice to organize evidence, then use official records and qualified professionals for the legal conclusion.`,
  }),
  article({
    slug: 'korea-real-transaction-filing-lag-and-cancellations',
    title: 'Filing lag and cancellations in Korea actual-transaction data',
    summary: 'The latest month is not a finished market snapshot. Contract dates, reporting windows, corrections and cancellations can change the visible sample.',
    sources: [S.realTransactions, S.realTransactionDownload, S.transactionReportAct],
    bodyMarkdown: `## Read the date field correctly

Korea's actual-transaction system organizes reported contracts using source-defined dates and fields. A contract month is not the same as the day a record first appeared on a portal. Before comparing periods, confirm whether the chart uses contract date, reporting date, download date or a completed-month rule.

## Expect the newest period to develop

Transactions can be filed after the contract is signed within the applicable reporting framework. The newest month can therefore start with a smaller and unrepresentative set, then fill in. Comparing that partial sample with a completed prior month can manufacture an apparent jump or fall.

## Treat cancellation as data, not deletion

Official records can later show cancellation or correction information. A responsible pipeline retains the status needed to exclude canceled contracts from a completed-price summary while preserving an audit trail. Quietly deleting the row makes it harder to explain why yesterday's number changed.

## Define a completed window

SignedPrice uses explicit periods and publication minimums rather than labeling every live month final. When recent evidence is incomplete, show the observed records but avoid a strong trend claim. Compare compatible property types and area bands, and state whether the window was widened.

## Save the source timestamp

Downloads and displayed results can change as filings are corrected. Keep the source, retrieval date, filters and transformation version with every published figure. MOLIT describes the service as reference information rather than a substitute for legal confirmation, so verify an individual transaction through the appropriate official process when it matters.`,
  }),
  article({
    slug: 'apartment-officetel-and-villa-in-korea',
    title: 'Apartment, officetel and villa: do not compare the labels alone',
    summary: 'Korean portal categories can mix legal use, building form and everyday language. Verify the official record before comparing price evidence.',
    sources: [S.seoulHousing, S.registrationAct, S.leaseCounselling],
    bodyMarkdown: `## Treat the listing label as a clue

Apartment (아파트), officetel (오피스텔) and villa (빌라) are useful search terms, but everyday usage does not always map cleanly to an official building category. A “villa” can describe several low-rise multi-unit forms. Start with the advertisement, then verify the building and unit in official records.

## Check the official use and unit identity

Read the building ledger and real-estate register for the exact unit. Confirm use, structure, area basis and registration. An attractive residential interior does not by itself establish that the unit's official use, financing treatment or tenant protections match an apartment.

## Keep evidence cohorts separate

Compare completed contracts within compatible housing types, transaction types, sizes and periods. Pooling an officetel with nearby apartments may increase the sample but erase important differences in buyer pool, management costs, land share and area measurement.

## Compare the living-cost structure

Ask about management fees, heating, parking, security, common facilities and utility arrangements. Officetels and small multi-family buildings can have very different recurring costs from large apartment complexes. Show these private charges separately from filed rent or sale values.

## Match the choice to the contract review

The same pre-signing discipline applies to every label: verify owner, registered rights, building record, signer authority, deposit protection steps and payment account. When the legal use or record is unclear, pause for professional review. A portal category is navigation, not a legal opinion.`,
  }),
  article({
    slug: 'compare-59sqm-and-84sqm-seoul-apartments',
    title: 'How to compare 59㎡ and 84㎡ Seoul apartments',
    summary: 'Size labels are useful only when area basis, building, period and total price remain visible. Unit price alone cannot describe the trade-off.',
    sources: [S.realTransactions, S.realTransactionDownload],
    bodyMarkdown: `## Confirm the area basis

Korean apartment shorthand often refers to an exclusive area near 59㎡ or 84㎡, while advertisements may also highlight a larger supply area. Confirm which field the source uses before calculating a unit price. Mixing exclusive and supply area can make two otherwise similar homes look artificially cheap or expensive.

## Compare total price and unit price together

The total completed price answers how much cash and financing the transaction required. Price per square metre helps normalize size, but it can move with layout efficiency, floor, orientation, view and building mix. Publish both and label the derivation instead of letting one replace the other.

## Stay inside a compatible cohort

First compare the same complex and a completed period, then nearby comparable buildings. Separate sale, jeonse and monthly rent. A district-wide 59㎡ median and one building's 84㎡ contract are not peers merely because both are apartments.

## Look at the distribution

Use the middle range, sample count and transaction dates rather than one record. If only a few 84㎡ contracts exist, widening time may be more honest than widening geography and building age simultaneously. Record which boundary changed and why.

## Add the household decision

The larger unit may change room count, storage, maintenance, financing and future flexibility. Those preferences are not contained in the reported price. SignedPrice can show how the completed contracts differ; the buyer must separately evaluate the unit, building condition and affordability.`,
  }),
  article({
    slug: 'move-from-seoul-district-data-to-building-evidence',
    title: 'Move from Seoul district data to building evidence',
    summary: 'District rankings are a discovery layer. A real decision needs the exact building, compatible size, completed period and transaction-level record.',
    sources: [S.realTransactions, S.realTransactionDownload, S.registrationAct],
    bodyMarkdown: `## Use the district to narrow the search

A district median can reveal broad differences and help a user choose where to investigate. It cannot tell whether one building is fairly priced. District housing stock contains different ages, locations, property types and unit sizes, so the next click should reduce that mix rather than turn the median into a valuation.

## Select a verified building identity

Match the official building name, address and stable identifier. Similar names and redevelopment phases can create false joins. If the map location or identity is unresolved, keep the row grouped or withheld instead of attaching another building's price and photograph.

## Choose the transaction and size cohort

Select sale, jeonse or monthly rent, then a compatible area band and completed period. Preserve whether a rent contract is new or renewed when the source supports it. Each filter reduces the sample, but that is preferable to an impressive count that no longer answers the user's question.

## Inspect the filings behind the summary

Read the dates, areas, amounts, floors where available and cancellation status. A median should remain connected to the records that produced it. If the count falls below the publication threshold, the interface should explain the limit and offer a controlled way back to district evidence.

## Hand the context to Check

When the user moves to price checking, carry the district, building, property type, area and transaction type without carrying an invented asking price. The user enters the actual offer. This preserves work already done in Explore while keeping reported evidence separate from private negotiation.`,
  }),
  article({
    slug: 'partial-month-and-thin-sample-seoul-data',
    title: 'Partial month plus thin sample: the most fragile Seoul headline',
    summary: 'A small building cohort in the newest reporting month combines two uncertainties. Slow down the claim before widening the evidence.',
    sources: [S.realTransactions, S.transactionReportAct, S.realTransactionDownload],
    bodyMarkdown: `## Identify both weaknesses

A thin sample has few compatible contracts. A partial month is still receiving or revising filings. When both occur together, the visible median can move sharply after one additional record. Label the sample depth and period state before describing direction.

## Do not compare partial with complete

If the current month is incomplete, compare completed windows or clearly mark the mismatch. A year-on-year label does not solve the problem when one side has not finished accumulating reports. Save the retrieval date so readers can understand why the figure later changes.

## Widen one boundary at a time

First consider a longer completed period for the same building and size. If that remains thin, compare nearby verified buildings with similar characteristics. Widening time, size and geography simultaneously produces a larger sample but removes the ability to explain what the comparison represents.

## Show observations before trends

For a small cohort, individual filing dates and values are often more informative than a smooth line. Display the range and count and avoid a percentage-change headline that suggests stable measurement. A withheld aggregate is still useful when the interface offers the parent district and source boundary.

## Revisit after the reporting window develops

Treat the first view as provisional evidence, not a permanent conclusion. Re-run the same filters after additional filings and cancellation updates. SignedPrice should make that revision visible; a changed number is not a failure when the underlying public record has changed and the method stayed consistent.`,
  }),
]);
