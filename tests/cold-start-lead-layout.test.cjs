const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');

const css=()=>fs.readFileSync('cold-start.css','utf8');

const LEAD_FILES=[
  'index.html',
  'zh/index.html',
  'tools/seoul-rent-check/index.html',
  'zh/tools/seoul-rent-check/index.html'
];

test('hidden lead subforms stay hidden even though lead forms define a layout',()=>{
  const text=css();
  assert.match(text,/\.lead-capture form\[hidden\]\s*\{[^}]*display\s*:\s*none\s*!important/i);
});

test('lead form gives the email field its own flexible column and consent its own row',()=>{
  const text=css();
  assert.match(text,/\.lead-capture \[data-lead-form\][^{]*\{[^}]*grid-template-columns\s*:\s*minmax\(0,1fr\)\s+auto/i);
  assert.match(text,/\.lead-capture \[data-lead-form\] \.lead-consent-note[^{]*\{[^}]*grid-column\s*:\s*1\s*\/\s*-1/i);
});

test('help action uses the same primary button treatment as the email save action',()=>{
  const text=css();
  assert.match(text,/\.lead-capture \[data-help-form\] button[^{]*\{[^}]*background\s*:\s*var\(--accent\)/i);
});

test('public Rent Check surfaces use the branded hello email instead of the personal Gmail address',()=>{
  for(const file of LEAD_FILES){
    const html=fs.readFileSync(file,'utf8');
    assert.match(html,/mailto:hello@koreahomeguide\.com/,file);
    assert.doesNotMatch(html,/007shp18@gmail\.com/,file);
  }
});
