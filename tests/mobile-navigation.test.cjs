const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const runtimePath = path.join(__dirname, '..', 'mobile-navigation.js');

test('mobile navigation provides localized core links and marks the current section', () => {
  assert.equal(fs.existsSync(runtimePath), true, 'mobile navigation runtime exists');
  const navigation = require(runtimePath);

  assert.deepEqual(
    navigation.buildNavigation({ language:'en', pathname:'/explore/' }),
    [
      { key:'rent-check', label:'Rent Check', href:'/tools/seoul-rent-check/', active:false },
      { key:'explore', label:'Explore', href:'/explore/', active:true },
      { key:'saved', label:'Saved', href:'/saved-homes/', active:false },
      { key:'guides', label:'Guides', href:'/guides/', active:false }
    ]
  );

  assert.deepEqual(
    navigation.buildNavigation({ language:'zh-CN', pathname:'/zh/saved-homes/' }),
    [
      { key:'rent-check', label:'租金检查', href:'/zh/tools/seoul-rent-check/', active:false },
      { key:'explore', label:'租金探索', href:'/zh/explore/', active:false },
      { key:'saved', label:'已保存', href:'/zh/saved-homes/', active:true },
      { key:'guides', label:'指南', href:'/zh/guides/', active:false }
    ]
  );
  assert.equal(navigation.buildNavigation({ language:'en', pathname:'/' }).some(item=>item.active),false);
  assert.equal(navigation.buildNavigation({ language:'zh-CN', pathname:'/zh/' }).some(item=>item.active),false);
});

function fakeElement(tagName){
  return {
    tagName:tagName.toUpperCase(), children:[], attributes:{}, dataset:{}, className:'', textContent:'',
    appendChild(child){ this.children.push(child); child.parentNode=this; return child; },
    setAttribute(name,value){ this.attributes[name]=String(value); },
    listeners:{},
    addEventListener(type,listener){ this.listeners[type]=listener; }
  };
}

test('mount creates one accessible mobile navigation, tracks clicks, and stays idempotent', () => {
  const navigation = require(runtimePath);
  const body=fakeElement('body');
  const doc={
    documentElement:{ lang:'en', dataset:{} }, body,
    createElement:fakeElement,
    querySelector:selector=>selector==='[data-khg-mobile-nav]'?body.children.find(child=>'data-khg-mobile-nav' in child.attributes)||null:null
  };
  const events=[];
  const root={
    document:doc,
    location:{ pathname:'/explore/' },
    gtag:(...args)=>events.push(args),
    addEventListener(){}
  };

  const nav=navigation.mount({ root, doc });
  assert.equal(nav.tagName, 'NAV');
  assert.equal(nav.attributes['aria-label'], 'Mobile primary navigation');
  assert.equal(body.children.length, 1);
  assert.equal(nav.children.length, 4);
  assert.deepEqual(nav.children.map(link=>link.attributes.href), [
    '/tools/seoul-rent-check/','/explore/','/saved-homes/','/guides/'
  ]);
  assert.equal(nav.children[1].attributes['aria-current'], 'page');
  assert.equal(nav.children[2].children.length, 1);
  nav.children[2].listeners.click();
  assert.deepEqual(events,[['event','mobile_nav_click',{ navigation_target:'saved',language:'en' }]]);
  assert.equal(navigation.mount({ root, doc }),null);
  assert.equal(body.children.length,1);
});

function htmlFiles(directory, rootDirectory=directory){
  return fs.readdirSync(directory,{ withFileTypes:true }).flatMap(entry=>{
    const target=path.join(directory,entry.name);
    if(entry.isDirectory()&&entry.name!=='.git'&&entry.name!=='node_modules'&&!(directory===rootDirectory&&entry.name==='v2')) return htmlFiles(target,rootDirectory);
    return entry.isFile()&&entry.name.endsWith('.html')?[target]:[];
  });
}

test('every public HTML page loads the shared mobile navigation once', () => {
  const root=path.join(__dirname,'..');
  const files=htmlFiles(root).filter(file=>path.relative(root,file)!=='embed/index.html');
  assert.ok(files.length>=70);
  for(const file of files){
    const html=fs.readFileSync(file,'utf8');
    const matches=html.match(/<script defer src="\/mobile-navigation\.js"><\/script>/g)||[];
    assert.equal(matches.length,1,path.relative(root,file));
  }
});

test('mobile layout reserves safe space and keeps overlays above the navigation', () => {
  const css=fs.readFileSync(path.join(__dirname,'..','styles.css'),'utf8');
  assert.match(css,/\.mobile-primary-nav\{position:fixed;/);
  assert.match(css,/\.mobile-primary-nav\{[^}]*gap:0;/);
  assert.match(css,/@media\(max-width:760px\)\{[\s\S]*?body\{padding-bottom:calc\(58px \+ env\(safe-area-inset-bottom\)\)\}/);
  assert.match(css,/@media\(max-width:760px\)\{[\s\S]*?\.saved-homes-dock\{display:none\}/);
  assert.match(css,/@media\(max-width:760px\)\{[\s\S]*?\.khg-consent-banner\{bottom:calc\(70px \+ env\(safe-area-inset-bottom\)\)\}/);
});

test('home pages replace static coverage counters with live district evidence', () => {
  const en=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
  const zh=fs.readFileSync(path.join(__dirname,'..','zh','index.html'),'utf8');
  assert.match(en,/data-home-market-preview/);
  assert.match(zh,/data-home-market-preview/);
  assert.doesNotMatch(en,/districts currently mapped/);
  assert.doesNotMatch(zh,/目前覆盖的行政区/);
});
