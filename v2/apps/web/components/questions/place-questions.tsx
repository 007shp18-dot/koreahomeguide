import 'server-only';
import { canonicalPlace,type Scope,type SiteLocale } from '@/lib/questions/model';
import { scopeToken } from '@/lib/questions/security.server';
import { QuestionsClient } from './questions-client';
export function PlaceQuestions({locale,market,path,name}:{locale:SiteLocale;market:Scope['market'];path:string;name:string}) { const scope={market,path:canonicalPlace(path),name}; return <QuestionsClient locale={locale} scope={scope} token={scopeToken(scope)} compact/>; }
