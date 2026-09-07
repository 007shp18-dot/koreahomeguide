import Link from 'next/link';
import { DUBAI_RESEARCH_DATE, DUBAI_SOURCES } from '../../lib/dubai/research';
import { PropertyScenarioCalculator } from '../market-ui/property-scenario';
import styles from './dubai-research.module.css';
import { marketText, marketHref, type MarketLocale } from '../../lib/locale/market-localization';


export function DubaiGuide({ locale = 'en' }: { locale?: MarketLocale } = {}) {
  const t = <T,>(value: T): T => marketText(locale, value);

  return <main className={styles.main}><header className={styles.hero}><h1>{t("Research a Dubai purchase")}</h1><p>{t("A working file for comparing a ready property with an off-plan offer: identity, evidence, payment timing and the costs of owning it.")}</p><p>{t("SignedPrice · Published ")}{t(DUBAI_RESEARCH_DATE)}</p></header>
    <article className={`${styles.section} ${styles.guide}`}><h2>{t("Build the property file first")}</h2><ol>
      <li><h3>{t("Match the identity")}</h3>{t("Record the project, building, unit and seller names exactly as they appear in the documents. For an existing property, use DLD’s title verification service. For an off-plan offer, look up the project and developer through ")}<a href={marketHref(locale, DUBAI_SOURCES.services)}>{t("DLD’s official services directory")}</a>{t(". Confirm ownership eligibility for the exact property and your buyer status before committing money.")}</li>
      <li><h3>{t("Separate completion from a promise")}</h3>{t("Check the ")}<a href={marketHref(locale, DUBAI_SOURCES.projects)}>{t("DLD project-status record")}</a>{t(". Compare the recorded progress with the developer’s payment schedule, proposed handover date and written conditions. A progress figure does not guarantee a delivery date. Keep each instalment on a timeline, including the cash needed before rental income could begin.")}</li>
      <li><h3>{t("Compare the same kind of evidence")}</h3>{t("Keep ready and off-plan offers, apartments and villas, and asking prices and completed transactions in separate groups. Record floor area and its unit, view, floor and parking. A citywide transaction total does not answer what a specific unit is worth. Use ")}<a href={marketHref(locale, DUBAI_SOURCES.data)}>{t("DLD’s data services")}</a> {t(" to investigate the source record; compare area prices and rents in SignedPrice, then check the closest transactions before judging an individual unit.")}</li>
      <li><h3>{t("Price the cost of ownership")}</h3>{t("Look up the building’s approved fees in the ")}<a href={marketHref(locale, DUBAI_SOURCES.charges)}>{t("Service Charge Index")}</a>{t(". Confirm the applicable year, charged area and components. Add written acquisition and financing quotes, repairs, furnishing, management, insurance and expected vacancy to your own budget. If rent is quoted annually, divide it by 12 before entering it below.")}</li>
      <li><h3>{t("Recheck before payment")}</h3>{t("Verify the broker and developer through the official directory. Match the recipient account, contract milestones and any applicable escrow information to official documents. Have a qualified local professional resolve discrepancies in ownership, permitted use, terms or payment obligations before you sign or transfer money.")}</li>
    </ol><p><a href={marketHref(locale, DUBAI_SOURCES.rest)}>{t("Dubai REST")}</a> {t(" provides access to official property services. The links above are tools for checking records; a link does not mean SignedPrice has verified a particular offer.")}</p></article>
    <PropertyScenarioCalculator locale={locale} price={null} currency="AED" />
    <section className={styles.section}><h2>{t("Keep the comparison useful")}</h2><p>{t("Use the same currency and assumptions for each offer. Obtain current, property-specific fees and buyer requirements. No tax rate, rent, financing approval or future return is assumed by this calculator.")}</p><nav className={styles.actions} aria-label={t("Next Dubai research step")}><Link href={marketHref(locale, "/ae/dubai/explore/")}>{t("Explore areas")}</Link><Link href={marketHref(locale, "/ae/dubai/check/")}>{t("Check an asking price")}</Link><Link href={marketHref(locale, "/ae/dubai/")}>{t("Market overview")}</Link><Link href={marketHref(locale, "/news/?market=dubai")}>{t("Dubai news")}</Link></nav></section>
  </main>;
}
