import Link from 'next/link';
import { DUBAI_RESEARCH_DATE, DUBAI_SOURCES } from '../../lib/dubai/research';
import { PropertyScenarioCalculator } from '../market-ui/property-scenario';
import styles from './dubai-research.module.css';

export function DubaiGuide() {
  return <main className={styles.main}><header className={styles.hero}><h1>Research a Dubai purchase</h1><p>A working file for comparing a ready property with an off-plan offer: identity, evidence, payment timing and the costs of owning it.</p><p>SignedPrice · Published {DUBAI_RESEARCH_DATE}</p></header>
    <article className={`${styles.section} ${styles.guide}`}><h2>Build the property file first</h2><ol>
      <li><h3>Match the identity</h3>Record the project, building, unit and seller names exactly as they appear in the documents. For an existing property, use DLD’s title verification service. For an off-plan offer, look up the project and developer through <a href={DUBAI_SOURCES.services}>DLD’s official services directory</a>. Confirm ownership eligibility for the exact property and your buyer status before committing money.</li>
      <li><h3>Separate completion from a promise</h3>Check the <a href={DUBAI_SOURCES.projects}>DLD project-status record</a>. Compare the recorded progress with the developer’s payment schedule, proposed handover date and written conditions. A progress figure does not guarantee a delivery date. Keep each instalment on a timeline, including the cash needed before rental income could begin.</li>
      <li><h3>Compare the same kind of evidence</h3>Keep ready and off-plan offers, apartments and villas, and asking prices and completed transactions in separate groups. Record floor area and its unit, view, floor and parking. A citywide transaction total does not answer what a specific unit is worth. Use <a href={DUBAI_SOURCES.data}>DLD’s data services</a> to investigate the source record; the SignedPrice area directory provides context only.</li>
      <li><h3>Price the cost of ownership</h3>Look up the building’s approved fees in the <a href={DUBAI_SOURCES.charges}>Service Charge Index</a>. Confirm the applicable year, charged area and components. Add written acquisition and financing quotes, repairs, furnishing, management, insurance and expected vacancy to your own budget. If rent is quoted annually, divide it by 12 before entering it below.</li>
      <li><h3>Recheck before payment</h3>Verify the broker and developer through the official directory. Match the recipient account, contract milestones and any applicable escrow information to official documents. Have a qualified local professional resolve discrepancies in ownership, permitted use, terms or payment obligations before you sign or transfer money.</li>
    </ol><p><a href={DUBAI_SOURCES.rest}>Dubai REST</a> provides access to official property services. The links above are tools for checking records; a link does not mean SignedPrice has verified a particular offer.</p></article>
    <PropertyScenarioCalculator price={null} currency="AED" />
    <section className={styles.section}><h2>Keep the comparison useful</h2><p>Use the same currency and assumptions for each offer. Obtain current, property-specific fees and buyer requirements. No tax rate, rent, financing approval or future return is assumed by this calculator.</p><nav className={styles.actions} aria-label="Next Dubai research step"><Link href="/ae/dubai/explore/">Explore areas</Link><Link href="/ae/dubai/">Market releases</Link><Link href="/news/?market=dubai">Dubai news</Link></nav></section>
  </main>;
}
