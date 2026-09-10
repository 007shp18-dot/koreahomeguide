import {isRuntimeChange} from './ignore-build.mjs';
import {execFileSync} from 'node:child_process';
import {appendFileSync,writeFileSync} from 'node:fs';
const repo=process.env.GITHUB_REPOSITORY;
if(repo!=='007shp18-dot/koreahomeguide') throw new Error('Unexpected repository');
const git=(...a)=>execFileSync('git',a,{encoding:'utf8'}).trim();
const gh=(...a)=>JSON.parse(execFileSync('gh',a,{encoding:'utf8'}));
const prs=gh('api',`repos/${repo}/pulls?state=open&base=main&per_page=100`)
 .filter(p=>!p.draft && p.head.repo?.full_name===repo && p.labels.some(l=>l.name==='release-ready')).sort((a,b)=>a.number-b.number);
const base=git('rev-parse','HEAD');const selected=[],blocked=[];
const previousRelease=git('log','-1','--format=%H','--grep=^\\[release\\]');
const pendingMain=Boolean(previousRelease && git('diff','--name-only',previousRelease,base).split('\n').some(isRuntimeChange));
for(const p of prs) {
 const checks=gh('api',`repos/${repo}/commits/${p.head.sha}/check-runs?per_page=100`).check_runs;
 // Pending, failed, absent, or stale verification cannot enter the batch.
 const verify=checks.filter(c=>c.name==='verify').sort((a,b)=>b.id-a.id)[0];
 if(!verify || verify.conclusion!=='success' || checks.some(c=>c.status!=='completed'||['failure','cancelled','timed_out','action_required'].includes(c.conclusion))) {blocked.push(`#${p.number}: checks not ready`);continue;}
 const before=git('rev-parse','HEAD');
 git('fetch','origin',p.head.sha);
 try {git('merge','--no-ff','--no-edit',p.head.sha);selected.push({number:p.number,sha:p.head.sha});}
 catch {git('merge','--abort');if(git('rev-parse','HEAD')!==before)throw new Error('Merge recovery failed');blocked.push(`#${p.number}: conflict`);}
}
writeFileSync('/tmp/signedprice-release.json',JSON.stringify({base,selected,pendingMain}));
appendFileSync(process.env.GITHUB_OUTPUT,`changed=${selected.length>0||pendingMain}\nvalidated_head=${git('rev-parse','HEAD')}\nbase_sha=${base}\nplan=${Buffer.from(JSON.stringify({base,selected,pendingMain})).toString('base64')}\n`);
appendFileSync(process.env.GITHUB_STEP_SUMMARY,`## Release queue\nPending main changes: ${pendingMain}\nSelected: ${selected.map(p=>'#'+p.number).join(', ')||'none'}\n\n${blocked.join('\n')}\n`);
