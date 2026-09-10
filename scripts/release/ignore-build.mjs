import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
export function isRuntimeChange(file) {
  if (/^(docs\/|\.github\/|tests\/)/.test(file) || /(^|\/)(test|tests)\//.test(file) || /\.(test|spec)\.[cm]?[jt]sx?$/.test(file) || /(^|\/)(AGENTS|README)\.md$/.test(file)) return false;
  return /^(v2\/|artifacts\/|scripts\/|package\.json|pnpm-lock\.yaml)/.test(file);
}
export function shouldBuild({environment,message,files}) {
  const requested=environment==='production'?message.startsWith('[release]'):message.startsWith('[preview]');
  return requested && (files===null || files.some(isRuntimeChange));
}
if (process.argv[1]===fileURLToPath(import.meta.url)) {
  const git=(...args)=>execFileSync('git',args,{cwd:root,encoding:'utf8'}).trim();
  let message='',files=null;
  try {message=git('log','-1','--format=%s');} catch {process.exit(1);}
  try {
    const base=process.env.VERCEL_GIT_PREVIOUS_SHA;
    if(base && /^[a-f0-9]{40}$/.test(base)) files=git('diff','--name-only',base,'HEAD').split('\n');
  } catch { /* Requested releases build when previous deployment history is unavailable. */ }
  const build=shouldBuild({environment:process.env.VERCEL_ENV,message,files});
  console.log(build?'Build requested release':'Skip: changes await unified release');
  process.exit(build?1:0);
}
