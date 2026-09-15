import Link from 'next/link';
import Image from 'next/image';
import { SiteHeader } from '../site-header';
import { SiteFooter } from '../site-footer';
import { homepageCopy } from '@/lib/site-copy';
import { prefix, type City, type SiteLocale } from '@/lib/questions/model';
import { QuestionsClient } from './questions-client';
import { UiIcon } from '../ui-icon';
import styles from './questions.module.css';

export function QuestionsPage({locale='en',market='',id}:{locale?:SiteLocale;market?:City|'';id?:string}) {
  const root = prefix(locale);
  const ko = locale === 'ko', zh = locale === 'zh-CN';
  const label = ko ? '커뮤니티' : zh ? '社区' : 'Community';
  return <>
    <SiteHeader copy={{...homepageCopy.header,homeHref:`${root}/`,languageLabel:ko?'KO':zh?'ZH':'EN',links:[{label,href:`${root}/community/`,isCurrent:true}]}}/>
    <main className={`${styles.layout} ${id ? styles.detailLayout : ''}`}>
      <QuestionsClient locale={locale} initialMarket={market} questionId={id}/>
      {!id && <aside className={styles.sidebar}>
        <Link href={`${root}/news/?market=tokyo`} className={styles.editorialCard}>
          <div className={styles.editorialPhoto}><Image src="/assets/home/tokyo-pjh.jpg" alt={ko?'도쿄 도심 풍경':zh?'东京城市风景':'Tokyo skyline'} fill sizes="(max-width: 900px) 100vw, 300px" /></div>
          <div><span className={styles.eyebrow}>SIGNEDPRICE INSIGHTS</span><h2>{ko?'숫자 너머, 동네의 이야기':zh?'数字背后的社区故事':'The stories behind the numbers'}</h2><p>{ko?'가격과 생활을 함께 살펴보세요.':zh?'一起了解价格与生活。':'Explore prices and everyday life.'}</p><span className={styles.readLink}>{ko?'인사이트 보기':zh?'查看洞察':'Explore insights'} <UiIcon name="arrow-right" /></span></div>
        </Link>
        <section className={styles.welcome}><UiIcon name="message"/><h2>{ko?'처음 오셨나요?':zh?'第一次来到这里？':'New around here?'}</h2><p>{ko?'궁금한 도시를 고르고, 집과 동네에 대한 질문을 남겨보세요. 글은 로그인 없이 읽을 수 있어요.':zh?'选择感兴趣的城市，分享关于房屋与社区的问题。无需登录即可阅读。':'Choose a city and ask about homes or neighbourhoods. Reading is open to everyone.'}</p><Link href={`${root}/prices/`}>{ko?'도시부터 둘러보기':zh?'探索城市':'Explore the cities'} <UiIcon name="arrow-right"/></Link></section>
      </aside>}
    </main>
    <SiteFooter copy={homepageCopy.footer} locale={locale}/>
  </>;
}
