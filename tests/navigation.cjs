const fs=require('fs'),vm=require('vm'),assert=require('assert');
const entries=[{external:true},null],moves=[],listeners={};let index=1,ctx,created=0,resumed=0;const cleared=[];
const browser={get state(){return entries[index];},replaceState(s){entries[index]=s;},pushState(s){entries.splice(index+1);entries.push(s);index++;},go(n){moves.push(n);}};
const flush=()=>{while(moves.length){const n=moves.shift();index+=n;assert(index>=0&&index<entries.length);listeners.popstate({state:entries[index]});}};
const appearance={open:false,close(){this.open=false;}},controls={};
const leaveBox={open:false,setAttribute(){},querySelector(id){return controls[id]??=( {focus(){},textContent:''});},showModal(){this.open=true;},close(){this.open=false;this.onclose?.();}};
const answer={value:'72',isConnected:true,focus(){this.focused=true;}};
const window={history:browser,addEventListener:(name,fn)=>listeners[name]=fn,scrollTo(){},GardenAppearance:{open(){appearance.open=true;window.GardenNav.sync('appearance');}}};
const choose=exit=>{assert(leaveBox.open);controls[exit?'#garden-leave':'#garden-stay'].onclick();flush();assert(!leaveBox.open);};
ctx=vm.createContext({window,document:{activeElement:answer,querySelector:()=>appearance,createElement(){created++;return leaveBox;},body:{appendChild(){}}},authenticated:true,screen:'hub',qs:[],answers:[],answerState:()=>'',confirm(){throw Error('Native confirm must never be used by browser Back');},clearTimeout:id=>cleared.push(id),setStudyScreen(){},stopDictation(){},login(){ctx.screen='login';window.GardenNav.sync('login');},
 hub(){ctx.screen='hub';window.GardenNav.sync('hub');},home(){ctx.screen='home';window.GardenNav.sync('math-home');},render(){ctx.screen='quiz';window.GardenNav.sync('math-quiz');},result(){ctx.screen='result';window.GardenNav.sync('math-result');},
 dictationController:{hasDraft:()=>false,goHome(){window.GardenNav.sync('dictation-home');},navigate(name){window.GardenNav.sync('dictation-'+name);return true;}},openDictation(){ctx.screen='dictation';window.GardenNav.sync('dictation-home');}});
ctx.TimesGarden={phase:'home',nextTimer:null,queue:[{a:2,b:3}],records:[],index:0,b:1,done:false,
 active:()=>ctx.screen==='times'&&ctx.TimesGarden.phase==='quiz',
 home(){this.phase='home';window.GardenNav.sync('times-home');},learn(){this.phase='learn';window.GardenNav.sync('times-learn');},quiz(){this.phase='quiz';window.GardenNav.sync('times-quiz');},finish(){this.phase='result';window.GardenNav.sync('times-result');},scheduleAdvance(){resumed++;this.nextTimer=99;}};
vm.runInContext(fs.readFileSync(__dirname+'/../navigation.js','utf8'),ctx);
const nav=window.GardenNav;nav.sync('hub');assert.equal(index,1);
ctx.screen='times';ctx.TimesGarden.home();ctx.TimesGarden.quiz();assert.equal(index,3);
browser.go(-1);flush();assert(leaveBox.open);assert.equal(index,3);assert.equal(ctx.TimesGarden.phase,'quiz');
// A second browser back cannot silently dismiss the unanswered prompt or leave the quiz.
browser.go(-1);flush();assert(leaveBox.open);assert.equal(created,1);assert.equal(index,3);
choose(false);assert.equal(answer.value,'72');assert(answer.focused);assert.equal(ctx.TimesGarden.phase,'quiz');
ctx.TimesGarden.done=true;ctx.TimesGarden.nextTimer=44;browser.go(-1);flush();assert(cleared.includes(44));assert.equal(ctx.TimesGarden.nextTimer,null);choose(false);assert.equal(resumed,1);
// Explicit exit goes to the subject home, then the garden home.
browser.go(-1);flush();choose(true);assert.equal(ctx.TimesGarden.phase,'home');assert.equal(index,2);
browser.go(-1);flush();assert.equal(ctx.screen,'hub');assert.equal(index,1);
browser.go(1);flush();assert.equal(ctx.screen,'times');assert.equal(ctx.TimesGarden.phase,'home');
ctx.TimesGarden.quiz();ctx.TimesGarden.records=[{a:2,b:3}];ctx.TimesGarden.finish();browser.go(-1);flush();assert.equal(ctx.TimesGarden.phase,'home');assert.equal(index,2);
ctx.TimesGarden.quiz();ctx.TimesGarden.home();ctx.TimesGarden.quiz();flush();assert.equal(entries[index].route,'times-quiz');assert.equal(entries[index-1].route,'times-home');
ctx.hub();flush();ctx.home();ctx.render();browser.go(-1);flush();choose(false);assert.equal(ctx.screen,'quiz');browser.go(-1);flush();choose(true);assert.equal(ctx.screen,'home');
ctx.hub();flush();ctx.openDictation();nav.sync('dictation-settings');ctx.dictationController.hasDraft=()=>true;browser.go(-1);flush();choose(false);assert.equal(entries[index].route,'dictation-settings');browser.go(-1);flush();choose(true);assert.equal(entries[index].route,'dictation-home');
let speechPaused=0,speechResumed=0;
ctx.dictationController.pauseSpeech=()=>{speechPaused++;return true;};
ctx.dictationController.resumeSpeech=()=>{speechResumed++;};
nav.sync('dictation-quiz');nav.request('dictation-home');assert(leaveBox.open);choose(false);
assert.equal(entries[index].route,'dictation-quiz');assert.equal(speechPaused,1);assert.equal(speechResumed,1);
nav.request('dictation-home');choose(true);assert.equal(entries[index].route,'dictation-home');assert.equal(speechResumed,1);
ctx.dictationController.hasDraft=()=>false;ctx.hub();flush();window.GardenAppearance.open();browser.go(-1);flush();assert.equal(appearance.open,false);assert.equal(ctx.screen,'hub');
browser.go(-1);flush();assert.equal(index,0);assert(entries[index].external);
console.log('Browser Back: in-app explicit exit/cancel without native confirm, repeated back, preserved input, paused/resumed automatic advance, subject parents, forward and dictation draft guard passed.');
