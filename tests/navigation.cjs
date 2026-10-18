const fs=require('fs'),vm=require('vm'),assert=require('assert');
const entries=[{external:true},null],moves=[],listeners={};let index=1,allow=true,confirmations=0,ctx;
const browser={
 get state(){return entries[index];},
 replaceState(s){entries[index]=s;},
 pushState(s){entries.splice(index+1);entries.push(s);index++;},
 go(n){moves.push(n);}
};
const flush=()=>{while(moves.length){const n=moves.shift();index+=n;assert(index>=0&&index<entries.length);listeners.popstate({state:entries[index]});}};
const window={history:browser,addEventListener:(name,fn)=>listeners[name]=fn,scrollTo(){},GardenAppearance:{open(){dialog.open=true;ctx.window.GardenNav.sync('appearance');}}};
const dialog={open:false,close(){this.open=false;}};
ctx=vm.createContext({window,document:{querySelector:()=>dialog},authenticated:true,screen:'hub',qs:[],answers:[],answerState:()=>'',confirm(){confirmations++;return allow;},clearTimeout(){},setStudyScreen(){},stopDictation(){},login(){ctx.screen='login';window.GardenNav.sync('login');},
 hub(){ctx.screen='hub';window.GardenNav.sync('hub');},
 home(){ctx.screen='home';window.GardenNav.sync('math-home');},
 render(){ctx.screen='quiz';window.GardenNav.sync('math-quiz');},
 result(){ctx.screen='result';window.GardenNav.sync('math-result');},
 dictationController:{hasDraft:()=>false,goHome(){window.GardenNav.sync('dictation-home');},navigate(name){window.GardenNav.sync('dictation-'+name);return true;}},
 openDictation(){ctx.screen='dictation';window.GardenNav.sync('dictation-home');}
});
ctx.TimesGarden={phase:'home',nextTimer:null,queue:[{a:2,b:3}],records:[],index:0,b:1,
 active:()=>ctx.screen==='times'&&ctx.TimesGarden.phase==='quiz',
 home(){this.phase='home';window.GardenNav.sync('times-home');},
 learn(){this.phase='learn';window.GardenNav.sync('times-learn');},
 quiz(){this.phase='quiz';window.GardenNav.sync('times-quiz');},
 finish(){this.phase='result';window.GardenNav.sync('times-result');}
};
vm.runInContext(fs.readFileSync(__dirname+'/../navigation.js','utf8'),ctx);
const nav=window.GardenNav;
nav.sync('hub');assert.equal(index,1);
ctx.screen='times';ctx.TimesGarden.home();ctx.TimesGarden.quiz();assert.equal(index,3);
const original=entries[index];allow=false;browser.go(-1);flush();assert.equal(entries[index].route,'times-quiz');assert.equal(ctx.TimesGarden.phase,'quiz');assert.equal(index,3);assert.equal(entries[index].route,original.route);
allow=true;browser.go(-1);flush();assert.equal(ctx.TimesGarden.phase,'home');assert.equal(index,2);browser.go(-1);flush();assert.equal(ctx.screen,'hub');assert.equal(index,1);
browser.go(1);flush();assert.equal(ctx.screen,'times');assert.equal(ctx.TimesGarden.phase,'home');
// Result replaces the problem entry, so back reaches the subject home rather than replaying results.
ctx.TimesGarden.quiz();ctx.TimesGarden.records=[{a:2,b:3}];ctx.TimesGarden.finish();assert.equal(index,3);browser.go(-1);flush();assert.equal(ctx.TimesGarden.phase,'home');assert.equal(index,2);
// In-app home controls and a rapid restart preserve the real parent entry.
ctx.TimesGarden.quiz();ctx.TimesGarden.home();ctx.TimesGarden.quiz();flush();assert.equal(entries[index].route,'times-quiz');assert.equal(entries[index-1].route,'times-home');
ctx.hub();flush();assert.equal(index,1);
ctx.home();ctx.render();allow=false;browser.go(-1);flush();assert.equal(ctx.screen,'quiz');allow=true;browser.go(-1);flush();assert.equal(ctx.screen,'home');
ctx.hub();flush();ctx.openDictation();nav.sync('dictation-settings');ctx.dictationController.hasDraft=()=>true;allow=false;browser.go(-1);flush();assert.equal(entries[index].route,'dictation-settings');allow=true;browser.go(-1);flush();assert.equal(entries[index].route,'dictation-home');
ctx.dictationController.hasDraft=()=>false;ctx.hub();flush();window.GardenAppearance.open();assert.equal(entries[index].route,'appearance');browser.go(-1);flush();assert.equal(dialog.open,false);assert.equal(ctx.screen,'hub');
browser.go(-1);flush();assert.equal(index,0);assert(entries[index].external);assert(confirmations>=4);
console.log('Browser navigation: subject parents, cancel preserves view, forward, result replacement, rapid restart, dictation draft guard, appearance closing and exit at hub passed.');
