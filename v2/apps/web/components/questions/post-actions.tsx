'use client';
import { useState,type FormEvent } from 'react';
import type { QuestionPost,SiteLocale } from '@/lib/questions/model';
import { questionCopy,errorCopy } from '@/lib/questions/copy';
import { api,ClientError } from './api';
import styles from './questions.module.css';
export function PostActions({post,locale,changed}:{post:QuestionPost;locale:SiteLocale;changed:(deleted?:boolean)=>void}) {
 const c=questionCopy(locale);const [action,setAction]=useState('');const [error,setError]=useState('');const [message,setMessage]=useState('');const [busy,setBusy]=useState(false);
 async function submit(e:FormEvent<HTMLFormElement>){e.preventDefault();if(busy)return;setBusy(true);setError('');const data=Object.fromEntries(new FormData(e.currentTarget));try{await api('/api/questions/',{...data,action,id:post.id});setMessage(action==='report'?c.reported:'');setAction('');if(action!=='report')changed(action==='delete');}catch(e){setError(errorCopy(locale,e instanceof ClientError?e.code:'unavailable'));}finally{setBusy(false);}}
 return <div><div className={styles.actions}>{post.mine?<><button onClick={()=>setAction('edit')}>{c.edit}</button><button onClick={()=>setAction('delete')}>{c.remove}</button></>:<button onClick={()=>setAction('report')}>{c.report}</button>}</div>{action&&<form className={styles.form} onSubmit={submit}>{action==='edit'?<>{!post.parentId&&<label>{c.title}<input name="title" defaultValue={post.title} required minLength={5} maxLength={160}/></label>}<label>{c.body}<textarea name="body" defaultValue={post.body} required minLength={5} maxLength={4000}/></label></>:action==='report'?<label>{c.reason}<textarea name="reason" required minLength={5} maxLength={500}/></label>:<p>{c.deleteConfirm}</p>}<div className={styles.actions}><button disabled={busy} className={styles.primary}>{action==='edit'?c.save:action==='report'?c.report:c.confirm}</button><button disabled={busy} type="button" onClick={()=>setAction('')}>{c.cancel}</button></div></form>}{error&&<p role="alert" className={styles.error}>{error}</p>}{message&&<p role="status">{message}</p>}</div>;
}
