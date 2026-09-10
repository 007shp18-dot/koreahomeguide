import {execFileSync} from 'node:child_process';
import {readFileSync,appendFileSync} from 'node:fs';
const repo=process.env.GITHUB_REPOSITORY;
const plan=JSON.parse(readFileSync('/tmp/signedprice-release.json','utf8'));
const git=(...a)=>execFileSync('git',a,{encoding:'utf8'}).trim();
for(const p of plan.selected) {
 const current=JSON.parse(execFileSync('gh',['api',`repos/${repo}/pulls/${p.number}`],{encoding:'utf8'}));
 if(current.state!=='open'||current.draft||current.head.sha!==p.sha||!current.labels.some(l=>l.name==='release-ready')) throw new Error(`PR #${p.number} changed during validation`);
}
if(!plan.selected.length&&!plan.pendingMain)process.exit(0);
if(git('ls-remote','origin','refs/heads/main').split(/\s/)[0]!==plan.base)throw new Error('main changed; rerun validation');
git('commit','--allow-empty','-m',`[release] Unified batch ${plan.selected.map(p=>'#'+p.number).join(' ')}`);
// A normal fast-forward push also rejects a concurrent main update after the check.
const authorization=Buffer.from(`x-access-token:${process.env.GH_TOKEN}`).toString('base64');
execFileSync('git',['push','origin','HEAD:main'],{stdio:'pipe',env:{...process.env,GIT_CONFIG_COUNT:'1',GIT_CONFIG_KEY_0:'http.https://github.com/.extraheader',GIT_CONFIG_VALUE_0:`AUTHORIZATION: basic ${authorization}`}});
appendFileSync(process.env.GITHUB_STEP_SUMMARY,`\nPublished validated commit ${git('rev-parse','HEAD')}. Check Vercel deployment before considering it live.\n`);
