/* 받아쓰기 공책 · 배움정원 v1.6.1: native document module, one page scroll. */
window.GardenDictation = {
  mount(host){
    const view=host.attachShadow({mode:'open'}),disposers=[],timers=new Set();
    const setTimeout=(fn,delay)=>{const id=window.setTimeout(()=>{timers.delete(id);fn();},delay);timers.add(id);return id;};
    const clearTimeout=id=>{timers.delete(id);window.clearTimeout(id);};
    view.innerHTML="<style>\n[hidden] { display: none !important; }\n* { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }\n:host {\n  background: var(--bg); color: var(--ink);\n  font-family: var(--font-body); font-size: 17px; line-height: 1.55;\n  display:block; padding:0;\n}\n.wrap { max-width: 720px; margin-inline: auto; display: flex; flex-direction: column; gap: 18px; }\n.col { display: flex; flex-direction: column; gap: 14px; }\nh1, h2, h3 { font-family: var(--font-display); font-weight: 400; margin: 0; text-wrap: balance; }\nh2 { font-size: 20px; }\nbutton { font: inherit; color: inherit; cursor: pointer; touch-action: manipulation; }\n:focus-visible { outline: 3px solid var(--accent-ink); outline-offset: 2px; }\n\n/* 상단 */\n.top { display: flex; align-items: center; justify-content: space-between; gap: 10px; }\n.brand { font-family: var(--font-display); font-size: 25px; letter-spacing: .02em; min-width: 0; }\n.brand .vtag { font-family: var(--font-body); font-size: 12px; color: var(--muted); letter-spacing: 0; margin-left: 6px; white-space: nowrap; }\n.brand small { font-family: var(--font-body); font-size: 14px; color: var(--muted); margin-left: 8px; letter-spacing: 0; }\n.nav { display: flex; gap: 8px; flex-shrink: 0; }\n.pill { min-height: 44px; border: 2px solid var(--line); background: var(--card); border-radius: 999px; padding: 6px 16px; }\n.pill.icon { min-width: 44px; padding: 0; display: inline-flex; align-items: center; justify-content: center; }\n.pill:hover { border-color: var(--accent); }\n.pill.on { background: var(--accent); border-color: var(--accent); color: var(--on-accent); }\n\n/* 안내 */\n.guide { background: var(--card); border: 2px solid var(--line); border-radius: 14px; padding: 14px 16px; display: flex; flex-direction: column; gap: 8px; }\n.guide p { margin: 0; color: var(--muted); font-size: 15px; }\n.guide .now { color: var(--ink); }\n.guide .now b { font-family: var(--font-display); font-weight: 400; color: var(--accent-ink); }\n\n/* 급수 */\n.grades { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 12px; }\n.grade { background: var(--card); border: 2px solid var(--line); border-radius: 14px; padding: 12px; display: flex; flex-direction: column; gap: 10px; min-width: 0; transition: border-color .12s; }\n.grade:hover { border-color: var(--accent); }\n.gmain { all: unset; box-sizing: border-box; cursor: pointer; text-align: left; display: flex; flex-direction: column; gap: 8px; min-width: 0; flex: 1; touch-action: manipulation; }\n.gmain:focus-visible { outline: 3px solid var(--accent-ink); outline-offset: 4px; border-radius: 8px; }\n.badge { align-self: flex-start; font-family: var(--font-display); background: var(--accent); color: var(--on-accent); border-radius: 8px 8px 8px 2px; padding: 2px 12px; font-size: 20px; }\n.grade h3 { font-size: 17px; line-height: 1.3; }\n.grade .meta { display: flex; justify-content: space-between; gap: 6px; color: var(--muted); font-size: 14px; flex-wrap: wrap; }\n.stars { letter-spacing: 2px; color: var(--accent-ink); }\n.retry { min-height: 40px; border: 2px solid var(--accent); background: var(--accent-soft); color: var(--accent-ink); border-radius: 10px; padding: 6px 10px; font-size: 14px; }\n.retry:hover { background: var(--accent); color: var(--on-accent); }\n\n/* 문제 */\n.prog { display: flex; flex-direction: column; gap: 6px; }\n.prog .row { display: flex; justify-content: space-between; gap: 8px; font-size: 15px; color: var(--muted); }\n.bar { height: 10px; border-radius: 999px; background: var(--line); overflow: hidden; }\n.bar i { display: block; height: 100%; background: var(--accent); transition: width .25s; }\n.paper { background: var(--card); border: 2px solid var(--line); border-radius: 14px; padding: 16px; display: flex; flex-direction: column; gap: 16px; }\n.label { font-size: 13px; letter-spacing: .08em; color: var(--muted); display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }\n.listen { min-height: 40px; border: 2px solid var(--accent-ink); background: transparent; color: var(--accent-ink); border-radius: 999px; padding: 2px 16px; font-size: 15px; }\n.listen:hover { background: var(--accent-soft); }\n.listen.big-listen { font-family: var(--font-display); font-size: 20px; min-height: 52px; padding: 8px 28px; background: var(--accent); border-color: var(--accent); color: var(--on-accent); }\n.cells { display: flex; flex-wrap: wrap; gap: 0; }\n.cell { width: 2.1em; height: 2.3em; display: inline-flex; align-items: center; justify-content: center; border: 1px solid var(--line); margin: 0 -1px -1px 0; font-size: 22px; font-family: var(--font-body); position: relative; }\n.cell.bad { background: var(--bad-soft); color: var(--bad); border-color: var(--bad); z-index: 1; font-weight: 700; }\n.cell.miss { background: var(--hl); border-color: var(--accent-ink); z-index: 1; font-weight: 700; color: var(--ink); }\n.cell.bad.sp::after, .cell.miss.sp::after { content: \"\"; width: .8em; height: .35em; border: 2px solid currentColor; border-top: 0; border-radius: 0 0 4px 4px; }\n.q .cell { background: var(--bg); }\n.ans-row { display: flex; gap: 8px; }\n.ans-row input { flex: 1; min-width: 0; min-height: 52px; font: inherit; font-size: 20px; padding: 10px 14px; border: 2px solid var(--line); border-radius: 12px; background: var(--bg); color: var(--ink); }\n.ans-row input:focus { outline: none; border-color: var(--accent-ink); box-shadow: 0 0 0 3px var(--accent-soft); }\n.ans-row input:disabled { opacity: .85; }\n.primary { min-height: 52px; background: var(--accent); color: var(--on-accent); border: 0; border-radius: 12px; padding: 10px 22px; font-family: var(--font-display); font-size: 19px; white-space: nowrap; }\n.primary:hover { filter: brightness(.96); }\n.ghost { min-height: 48px; background: var(--card); border: 2px solid var(--line); border-radius: 12px; padding: 8px 16px; }\n.ghost:hover { border-color: var(--accent); }\n.tip { font-size: 14px; color: var(--muted); margin: 0; }\n\n/* 채점 */\n.cmp { display: flex; flex-direction: column; gap: 8px; }\n.verdict { font-family: var(--font-display); font-size: 21px; padding: 8px 14px; border-radius: 10px; }\n.verdict.ok { background: var(--ok-soft); color: var(--ok); }\n.verdict.no { background: var(--bad-soft); color: var(--bad); }\n.legend { display: flex; flex-wrap: wrap; gap: 6px 16px; font-size: 14px; color: var(--muted); }\n.legend span::before { content: \"\"; display: inline-block; width: 12px; height: 12px; border-radius: 3px; margin-right: 6px; vertical-align: -1px; }\n.legend .l-bad::before { background: var(--bad-soft); border: 1px solid var(--bad); }\n.legend .l-miss::before { background: var(--hl); border: 1px solid var(--accent-ink); }\n.fixlink { align-self: flex-start; min-height: 40px; background: none; border: 0; color: var(--muted); text-decoration: underline; padding: 6px 0; font-size: 14px; }\n\n/* 결과 */\n.score { text-align: center; display: flex; flex-direction: column; gap: 6px; align-items: center; }\n.score .big { font-family: var(--font-display); font-size: 54px; color: var(--accent-ink); line-height: 1.1; }\n.score .stars { font-size: 28px; }\n.list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 8px; }\n.list li { display: flex; gap: 10px; align-items: baseline; border-top: 1px dashed var(--line); padding-top: 8px; min-width: 0; }\n.list .n { font-family: var(--font-display); color: var(--muted); min-width: 1.6em; }\n.list .mark { font-family: var(--font-display); min-width: 1.2em; }\n.list .ok { color: var(--ok); } .list .no { color: var(--bad); }\n.list .txt { min-width: 0; overflow-wrap: anywhere; }\n.list .mine { display: block; font-size: 14px; color: var(--muted); }\n.scroll { overflow-x: auto; }\ntable { border-collapse: collapse; width: 100%; font-size: 15px; }\nth, td { text-align: left; padding: 8px 10px; border-bottom: 1px dashed var(--line); vertical-align: top; }\nth { font-family: var(--font-display); font-weight: 400; color: var(--muted); white-space: nowrap; }\ntd:nth-child(-n+4) { white-space: nowrap; font-variant-numeric: tabular-nums; }\ntd:last-child { min-width: 180px; }\n.actions { display: flex; flex-wrap: wrap; gap: 10px; }\n\n/* 설정 */\n.opts { display: flex; flex-wrap: wrap; gap: 0 20px; }\n.opts label { display: inline-flex; align-items: center; gap: 10px; min-height: 44px; cursor: pointer; font-size: 16px; }\n.opts input { appearance: none; -webkit-appearance: none; margin: 0; width: 24px; height: 24px; flex-shrink: 0; display: grid; place-content: center; background: var(--card); border: 2px solid var(--muted); border-radius: 50%; cursor: pointer; }\n.opts input[type=\"checkbox\"] { border-radius: 7px; }\n.opts input:checked { background: var(--accent); border-color: var(--accent-ink); }\n.opts input[type=\"radio\"]:checked::before { content: \"\"; width: 10px; height: 10px; border-radius: 50%; background: var(--on-accent); }\n.opts input[type=\"checkbox\"]:checked::before { content: \"\"; width: 6px; height: 12px; margin-top: -2px; border: solid var(--on-accent); border-width: 0 3px 3px 0; transform: rotate(45deg); }\n.opts input:focus-visible { outline: 3px solid var(--accent-ink); outline-offset: 2px; }\n.opts input:disabled + span, .opts label:has(input:disabled) { opacity: .55; cursor: default; }\n#voiceSel { width: 100%; }\n.subh { font-size: 18px; color: var(--ink); padding-top: 6px; }\n#settings .paper { gap: 8px; }\n#settings .paper > .actions { padding-top: 4px; }\n.tip:empty { display: none; }\n.sw { font-size: 17px; }\n.swatches { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }\n.sw { min-height: 56px; display: flex; align-items: center; gap: 10px; padding: 8px 12px; background: var(--card); border: 2px solid var(--line); border-radius: 12px; text-align: left; }\n.sw i { width: 24px; height: 24px; border-radius: 50%; flex-shrink: 0; border: 2px solid var(--card); box-shadow: 0 0 0 1px var(--line); }\n.sw[aria-pressed=\"true\"] { border-color: var(--accent-ink); background: var(--accent-soft); }\n.gtabs { display: grid; grid-template-columns: repeat(5, 1fr); gap: 8px; }\n.gtab { min-height: 44px; padding: 0 4px; border: 2px solid var(--line); border-radius: 10px; background: var(--card); font-family: var(--font-display); font-size: 17px; }\n.gtab:hover { border-color: var(--accent); }\n.gtab[aria-pressed=\"true\"] { background: var(--accent); border-color: var(--accent); color: var(--on-accent); }\n.edtitle { font-size: 18px; color: var(--accent-ink); padding-top: 4px; border-top: 1px dashed var(--line); padding-top: 14px; }\nselect { min-height: 48px; font: inherit; font-size: 17px; padding: 6px 12px; border: 2px solid var(--line); border-radius: 12px; background: var(--bg); color: var(--ink); max-width: 100%; }\n.edrow { display: flex; align-items: center; gap: 8px; }\n.edrow .n { font-family: var(--font-display); color: var(--muted); min-width: 1.6em; text-align: right; }\n.edrow input { flex: 1; min-width: 0; min-height: 48px; font: inherit; font-size: 17px; padding: 8px 12px; border: 2px solid var(--line); border-radius: 12px; background: var(--bg); color: var(--ink); }\n.edrow input:focus { outline: none; border-color: var(--accent-ink); box-shadow: 0 0 0 3px var(--accent-soft); }\n.edrow.changed input { border-color: var(--accent); background: var(--accent-soft); }\n.status:empty { display: none; }\ntextarea { width: 100%; min-height: 110px; font: inherit; font-size: 15px; line-height: 1.45; padding: 10px 12px; border: 2px solid var(--line); border-radius: 12px; background: var(--bg); color: var(--ink); resize: vertical; word-break: break-all; }\ntextarea:focus { outline: none; border-color: var(--accent-ink); box-shadow: 0 0 0 3px var(--accent-soft); }\n.status.err { color: var(--bad); }\n.status { min-height: 1.4em; font-size: 15px; color: var(--ok); margin: 0; }\n\n.ptr { position: fixed; left: 50%; top: calc(8px + env(safe-area-inset-top, 0px)); transform: translate(-50%, -64px); background: var(--card); color: var(--accent-ink); border: 2px solid var(--accent); border-radius: 999px; padding: 6px 18px; font-family: var(--font-display); z-index: 10; pointer-events: none; white-space: nowrap; }\n.modal { position: fixed; inset: 0; z-index: 20; display: flex; align-items: center; justify-content: center; padding: 16px; background: rgba(20, 12, 24, .5); }\n.modal-card { width: 100%; max-width: 360px; background: var(--card); border: 2px solid var(--line); border-radius: 16px; padding: 20px; display: flex; flex-direction: column; gap: 12px; box-shadow: 0 8px 28px rgba(0,0,0,.25); }\n.modal-card h3 { font-size: 20px; }\n.modal-card p { margin: 0; color: var(--muted); }\n#fx { position: fixed; inset: 0; width: 100%; height: 100%; z-index: 30; background: rgba(22, 12, 30, .45); opacity: 0; pointer-events: none; transition: opacity .25s; }\n#fx.on { opacity: 1; pointer-events: auto; }\n#fxText { position: fixed; left: 50%; top: 40%; transform: translate(-50%, -50%) scale(.6); z-index: 31; font-family: var(--font-display); font-size: 64px; color: #fff; text-shadow: 0 3px 0 var(--accent-ink), 0 6px 18px rgba(0,0,0,.35); opacity: 0; pointer-events: none; white-space: nowrap; }\n#fxText.on { animation: fxpop .6s cubic-bezier(.2, 1.4, .4, 1) forwards; }\n@keyframes fxpop { to { opacity: 1; transform: translate(-50%, -50%) scale(1); } }\n@media (max-width: 430px) { #fxText { font-size: 52px; } }\n@media (prefers-reduced-motion: reduce) { #fx { display: none; } #fxText.on { animation: none; opacity: 1; transform: translate(-50%, -50%); } }\n.actions.edactions { justify-content: flex-end; }\n.toast { position: fixed; left: 50%; transform: translateX(-50%); bottom: calc(24px + env(safe-area-inset-bottom, 0px)); background: var(--accent-ink); color: var(--card); padding: 10px 20px; border-radius: 999px; font-family: var(--font-display); z-index: 10; box-shadow: 0 4px 14px rgba(0,0,0,.2); }\n@media (max-width: 520px) {\n  :host { font-size: 16px; }\n  #subtitle { display: none; }\n  .cell { font-size: 18px; }\n  .ans-row { flex-direction: column; }\n  .ans-row .primary { width: 100%; }\n  .actions:not(.edactions) > button { flex: 1 1 100%; }\n  .score .big { font-size: 46px; }\n  .swatches { grid-template-columns: repeat(2, 1fr); }\n  .paper { padding: 14px; }\n}\n@media (prefers-reduced-motion: reduce) { * { transition: none !important; } }\n.ptr{width:96px;height:7px;min-height:0;padding:0;border:0;border-radius:99px;background:linear-gradient(90deg,var(--accent-soft),var(--accent));box-shadow:none;}\n\n:host{--font-display:\"Jua\",system-ui,sans-serif;--font-body:\"Gowun Dodum\",system-ui,sans-serif}.wrap{max-width:100%;margin:0;gap:20px}.brand{font-size:23px}.brand small{display:block;margin:5px 0 0;font-size:13px}.nav{flex-wrap:wrap;justify-content:flex-end}.top{align-items:flex-start}.pill{font-size:14px;padding:8px 12px}.modal-card{max-height:85dvh;overflow:auto}button,input,select{touch-action:manipulation}\n</style>\n<div class=\"wrap\">\n  <header class=\"top\">\n    <div class=\"brand\">받아쓰기 공책<small id=\"subtitle\">한글, 틀려도 괜찮아!</small></div>\n    <nav class=\"nav\">\n      <button class=\"pill\" id=\"btnHome\" type=\"button\" hidden>급수 선택</button>\n      <button class=\"pill\" id=\"btnSettings\" type=\"button\" aria-label=\"받아쓰기 설정\">학습 설정</button>\n    </nav>\n  </header>\n\n  <!-- 홈 -->\n  <section id=\"home\" class=\"col\">\n    <div class=\"guide\">\n      <p class=\"now\" id=\"modeInfo\"></p>\n    </div>\n    <div class=\"grades\" id=\"grades\"></div>\n    <div class=\"paper\" id=\"records\" hidden></div>\n  </section>\n\n  <!-- 문제 -->\n  <section id=\"quiz\" class=\"col\" hidden>\n    <div class=\"prog\">\n      <div class=\"row\"><span id=\"qGrade\"></span><span id=\"qCount\"></span></div>\n      <div class=\"bar\"><i id=\"qBar\" style=\"width:0\"></i></div>\n    </div>\n    <div class=\"paper\">\n      <div class=\"q\">\n        <div class=\"label\" id=\"qLabel\">문제 <button class=\"listen\" id=\"btnListen\" type=\"button\">듣기</button></div>\n        <div class=\"cells\" id=\"qCells\" style=\"margin-top:8px\"></div>\n      </div>\n      <form class=\"ans-row\" id=\"form\">\n        <input id=\"answer\" type=\"text\" lang=\"ko\" autocomplete=\"off\" autocapitalize=\"none\" spellcheck=\"false\" enterkeyhint=\"done\" placeholder=\"띄어쓰기와 문장부호를 넣어 써요\">\n        <button class=\"primary\" id=\"btnMain\" type=\"submit\">확인하기</button>\n      </form>\n      <p class=\"tip\" id=\"tip\">문장 끝에는 마침표(.) 물음표(?) 느낌표(!)를 꼭 확인해요.</p>\n      <div id=\"result\" class=\"cmp\" hidden></div>\n    </div>\n  </section>\n\n  <!-- 끝 -->\n  <section id=\"done\" class=\"col\" hidden>\n    <div class=\"paper\">\n      <div class=\"score\">\n        <div id=\"dTitle\" class=\"label\"></div>\n        <div class=\"big\" id=\"dScore\"></div>\n        <div class=\"stars\" id=\"dStars\"></div>\n        <div id=\"dMsg\"></div>\n      </div>\n      <ul class=\"list\" id=\"dList\"></ul>\n      <div class=\"actions\" id=\"dActions\"></div>\n    </div>\n  </section>\n\n  <!-- 설정 -->\n  <section id=\"settings\" class=\"col\" hidden>\n    <p class=\"tip\">설정은 바꾸는 즉시 저장됨.</p>\n    <div class=\"paper\">\n      <h2>연습 방식</h2>\n      <div class=\"opts\" role=\"radiogroup\" aria-label=\"연습 방식\">\n        <label for=\"modeHear\"><input type=\"radio\" name=\"mode\" id=\"modeHear\" value=\"hear\"><span>듣고 쓰기 (글자 숨김)</span></label>\n        <label for=\"modeSee\"><input type=\"radio\" name=\"mode\" id=\"modeSee\" value=\"see\"><span>보고 쓰기 (붙여 쓴 글자)</span></label>\n      </div>\n      <div class=\"opts\">\n        <label for=\"optSpace\"><input type=\"checkbox\" id=\"optSpace\"><span>띄어쓰기·문장부호도 채점</span></label>\n        <label for=\"optShuffle\"><input type=\"checkbox\" id=\"optShuffle\"><span>문제 순서 섞기</span></label>\n      </div>\n    </div>\n\n    <div class=\"paper\">\n      <h2>문제 문장 고치기</h2>\n      <p class=\"tip\">사진에서 잘못 옮긴 문장이 있으면 여기서 고쳐요. 문제는 띄어쓰기와 문장부호 없이 나오고, 정답은 여기에 쓴 그대로 채점돼요.</p>\n      <div class=\"gtabs\" id=\"edTabs\" role=\"group\" aria-label=\"급수 선택\"></div>\n      <h3 class=\"edtitle\" id=\"edTitle\"></h3>\n      <div class=\"col\" id=\"edList\" style=\"gap:8px\"></div>\n      <div class=\"actions edactions\">\n        <button class=\"ghost\" id=\"edReset\" type=\"button\">초기화</button>\n        <button class=\"primary\" id=\"edSave\" type=\"button\">저장</button>\n      </div>\n      <p class=\"status\" id=\"edStatus\" role=\"status\"></p>\n    </div>\n\n    <div class=\"paper\" id=\"voiceBox\">\n      <h2>소리설정</h2>\n      <div class=\"opts\"><label for=\"optSfx\"><input type=\"checkbox\" id=\"optSfx\"><span>효과음 (정답·오답·팡파레)</span></label></div>\n      <select id=\"voiceSel\" aria-label=\"목소리\"></select>\n      <div class=\"actions edactions\">\n        <button class=\"ghost\" id=\"voiceTest\" type=\"button\">미리 듣기</button>\n      </div>\n      <p class=\"tip\" id=\"voiceTip\"></p>\n    </div>\n\n    <div class=\"paper\">\n      <h2>문장 백업</h2>\n      <p class=\"tip\">고친 문장은 이 기기에만 저장돼요.</p>\n      <input type=\"file\" id=\"bkFile\" accept=\".txt,text/plain,application/json\" hidden>\n      <div class=\"actions edactions\">\n        <button class=\"ghost\" id=\"bkExport\" type=\"button\">내보내기</button>\n        <button class=\"primary\" id=\"bkImport\" type=\"button\">가져오기</button>\n      </div>\n      <p class=\"status\" id=\"bkStatus\" role=\"status\"></p>\n    </div>\n  </section>\n</div>\n\n<div id=\"confirmBox\" class=\"modal\" hidden>\n  <div class=\"modal-card\" role=\"dialog\" aria-modal=\"true\" aria-labelledby=\"cfTitle\">\n    <h3 id=\"cfTitle\"></h3>\n    <p id=\"cfMsg\"></p>\n    <div class=\"actions edactions\">\n      <button class=\"ghost\" id=\"cfNo\" type=\"button\">취소</button>\n      <button class=\"primary\" id=\"cfYes\" type=\"button\">초기화</button>\n    </div>\n  </div>\n</div>\n<canvas id=\"fx\" aria-hidden=\"true\"></canvas>\n<div id=\"fxText\" aria-hidden=\"true\"></div>\n<div id=\"toast\" class=\"toast\" role=\"status\" hidden></div>\n\n\n";
const APP_VERSION = '1.6.1';
const DATA = [
  { g: 1, title: "장면을 상상하며", items: ["땀이 송골송골","함께 먹고 싶어.","급식은 짜장면이다!","하얗고 예쁜 집","새끼 고양이들이었어.","곯아떨어졌어.","시원한 산들바람","찾을 수가 없어서","많이 생겼거든.","침대 밑의 공간에"] },
  { g: 2, title: "서로 존중해요", items: ["노력하는 모습","넌 잘하고 있어.","기분이 상하지 않게","앞으로 자주 연락하자.","물건이 쏟아져","긍정적으로 받아들이고","끝까지 듣고","여쭤보면 어떨까?","짖는 개를 보고","상황에 맞는 말을"] },
  { g: 3, title: "내용을 살펴요", items: ["사과를 꼭 해야 해.","뉘우치고 있다는","받아 주든지 말든지","정중하게 물어본다.","말한 까닭을 찾는다.","엄지손가락 굵기만큼","줄기가 질겨져","음식을 청결하게","소매가 짧은 옷","어떡하면 시원할까요?"] },
  { g: 4, title: "마음을 전해요", items: ["그린 것이에요.","뜻깊은 작품을","우체국이 어디 있나요?","도와주어서 고마워!","냄새 맡은 값","눈을 동그랗게 뜨고","웃음을 터뜨렸답니다.","어깨를 들썩거렸습니다.","끝에 있습니다.","느릿한 목소리로"] },
  { g: 5, title: "바른 말로 이야기 나누어요", items: ["축구를 가르쳐 주었어.","꾀를 부려","사진첩이 바랬다.","길을 잃어버렸다.","친구와 부딪치거나","머리를 갸우뚱거리며","꽃씨를 뿌렸습니다.","높이 자랄 거야.","줄넘기를 하고","국물이 시원하고"] },
  { g: 6, title: "매체를 경험해요", items: ["책으로 읽으니","땅에 묻혀 있는","물을 계속 튼 채로","기분이 어땠니?","밑줄을 긋고","선생님을 만났습니다.","깨끗이 씻었습니다.","등산하기 딱 좋다고?","밝은 표정으로","글과 그림을 활용해"] },
  { g: 7, title: "내 생각은 이래요", items: ["우리가 힘을 합쳐","밟을 수도 있다.","반려견이 짖게 되면","귀찮고 힘들다는 생각","몸무게를 조절하는 데에도","학교 뒤뜰을 자유롭게","고구마 심어도 돼요?","뿌듯할 것 같습니다.","날이 참 맑네.","괜찮아."] },
  { g: 8, title: "나도 작가", items: ["눈 내린 등굣길","눈 쌓인 운동장","널따란 호수","떡볶이집 지나서","노랫말로 써 볼 거야.","거센 바람이","풍뎅이를 따라다니던","담요도 덮어 주고","낯선 손님에게는","흠뻑 젖은 채"] },
  { g: 9, title: "알쏭달쏭 한글 맞춤법 (단어편)", items: ["역할","고깔","설렘","곱빼기","쌀뜨물","육개장","껍데기","딱따구리","두루마리","낭떠러지"] },
  { g: 10, title: "알쏭달쏭 한글 맞춤법 (문장편)", items: ["대가를 치르다.","두 시에 봬요.","금세 먹어 치웠다.","반드시 끝내야 한다.","끈을 단단히 매어라.","가방을 메다.","방이 널찍하다.","껍질째 베어먹었다.","기다란 줄을 잡다.","곰곰이 생각하다."] }
];
const DEFAULTS = DATA.map(d => d.items.slice());

const $ = id => view.getElementById(id);
const CAN_SPEAK = "speechSynthesis" in window && typeof SpeechSynthesisUtterance !== "undefined";
const PUNCT = /[\s.,?!~'"“”‘’·…]/g;
const strip = s => s.replace(PUNCT, "");

/* 저장소: 막혀 있어도 앱은 동작한다 */
const ls = {
  get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
};
const store = {
  get() { return ls.get("dictation-best", {}); },
  set(g, n) { const b = store.get(); if (!(b[g] >= n)) { b[g] = n; ls.set("dictation-best", b); } }
};
const wrongStore = {
  get() { return ls.get("dictation-wrong", {}); },
  set(g, list) { const w = wrongStore.get(); if (list.length) w[g] = list; else delete w[g]; ls.set("dictation-wrong", w); }
};
const statStore = { get() { return ls.get("dictation-stats", {}); }, save(a) { ls.set("dictation-stats", a); } };

/* 고친 문장 불러오기 */
{
  const ov = ls.get("dictation-items", {});
  DATA.forEach((d, i) => { const o = ov[d.g]; if (Array.isArray(o) && o.length === d.items.length) d.items = o.map((t, k) => (typeof t === "string" && t.trim()) ? t : DEFAULTS[i][k]); });
}

/* 설정 */
const SET = Object.assign({ mode: "hear", strict: true, shuffle: false, theme: "system", palette: "pink", voice: "", sfx: true }, ls.get("dictation-settings", {}));
let toastTimer = 0;
function toast(msg) {
  const t = $("toast");
  t.textContent = msg; t.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { t.hidden = true; }, 1800);
}
function saveSettings() { ls.set("dictation-settings", SET); toast("설정을 저장했어요"); }

const root = host;
function effectiveMode() { return SET.mode === "hear" && CAN_SPEAK ? "hear" : "see"; }
function updateModeInfo() {
  const el = $("modeInfo");
  el.replaceChildren("지금 방식: ");
  const b = document.createElement("b"); b.textContent = effectiveMode() === "hear" ? "듣고 쓰기" : "보고 쓰기";
  el.append(b);
  if (SET.shuffle) {
    const sh = document.createElement("b"); sh.textContent = "문제 순서 섞기";
    el.append(" · ", sh);
  }
}

/* 설정 화면 연결 */
function initSettings() {
  view.querySelectorAll('input[name="mode"]').forEach(r => {
    r.checked = r.value === effectiveMode();
    r.addEventListener("change", () => { if (r.checked) { SET.mode = r.value; saveSettings(); updateModeInfo(); } });
  });
  if (!CAN_SPEAK) {
    $("modeHear").disabled = true;
    $("modeHear").nextElementSibling.textContent += " (이 기기에서는 소리를 낼 수 없어요)";
  }
  $("optSfx").checked = SET.sfx;
  $("optSfx").addEventListener("change", e => { SET.sfx = e.target.checked; saveSettings(); sound.play("correct"); });
  $("optSpace").checked = SET.strict;
  $("optSpace").addEventListener("change", e => { SET.strict = e.target.checked; saveSettings(); });
  $("optShuffle").checked = SET.shuffle;
  $("optShuffle").addEventListener("change", e => { SET.shuffle = e.target.checked; saveSettings(); updateModeInfo(); });
  $("edTabs").replaceChildren(...DATA.map(d => {
    const b = document.createElement("button");
    b.type = "button"; b.className = "gtab"; b.dataset.g = d.g; b.textContent = d.g + "급";
    b.addEventListener("click", () => renderEditor(d.g));
    return b;
  }));
  $("edSave").addEventListener("click", saveEditor);
  $("bkExport").addEventListener("click", exportItems);
  $("bkImport").addEventListener("click", () => $("bkFile").click());
  $("bkFile").addEventListener("change", e => { importFile(e.target.files[0]); e.target.value = ""; });
  $("edReset").addEventListener("click", () => {
    const g = edCur;
    if (DATA[g - 1].items.every((t, i) => t === DEFAULTS[g - 1][i])) { $("edStatus").textContent = g + "급은 고친 문장이 없어요."; return; }
    askConfirm(g + "급 문장을 초기화할까요?", "고친 문장이 모두 처음 상태로 돌아가요. 되돌릴 수 없어요.", "초기화", resetEditor);
  });
}

/* 효과음: 소리 파일 없이 Web Audio로 만든다. 채점·결과 버튼을 누르는 순간에 켜서, 화면을 누른 뒤에만 소리가 나는 기기(아이폰)에서도 나온다 */
let actx = null;
function ac() {
  try {
    if (!actx) actx = new (window.AudioContext || window.webkitAudioContext)();
    if (actx.state === "suspended") actx.resume();
  } catch (e) {}
  return actx;
}
function tone(f, t0, d, type = "triangle", g = .2, o = {}) {
  const c = ac(); if (!c) return;
  const t = c.currentTime + t0, osc = c.createOscillator(), v = c.createGain();
  osc.type = type; osc.frequency.setValueAtTime(f, t);
  if (o.glide) osc.frequency.exponentialRampToValueAtTime(o.glide, t + d);
  v.gain.setValueAtTime(.0001, t); v.gain.exponentialRampToValueAtTime(g, t + .015); v.gain.exponentialRampToValueAtTime(.0001, t + d);
  if (o.lp) { const fl = c.createBiquadFilter(); fl.type = "lowpass"; fl.frequency.value = o.lp; osc.connect(fl); fl.connect(v); } else osc.connect(v);
  v.connect(c.destination); osc.start(t); osc.stop(t + d + .05);
}
function hiss(t0, d, g, hp) {
  const c = ac(); if (!c) return;
  const n = Math.max(1, Math.floor(c.sampleRate * d)), buf = c.createBuffer(1, n, c.sampleRate), data = buf.getChannelData(0);
  for (let i = 0; i < n; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / n);
  const src = c.createBufferSource(), v = c.createGain(), fl = c.createBiquadFilter(), t = c.currentTime + t0;
  src.buffer = buf; fl.type = "highpass"; fl.frequency.value = hp;
  v.gain.setValueAtTime(g, t); v.gain.exponentialRampToValueAtTime(.0001, t + d);
  src.connect(fl); fl.connect(v); v.connect(c.destination); src.start(t);
}
const sound = {
  play(name) { if (SET.sfx) { try { sound[name](); } catch (e) {} } },
  correct() { tone(880, 0, .28, "triangle", .22); tone(1318.5, .11, .5, "triangle", .22); tone(2637, .11, .3, "sine", .04); },
  wrong() { tone(311, 0, .34, "triangle", .2, { glide: 196 }); tone(233, .2, .34, "triangle", .14, { glide: 147 }); },
  pop() { tone(170, 0, .14, "sine", .1, { glide: 60 }); hiss(0, .07, .04, 3000); },
  fanfare() {
    [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => tone(f, i * .11, .15, "sawtooth", .1, { lp: 2400 }));
    [523.25, 659.25, 783.99, 1046.5].forEach(f => tone(f, .5, 1.2, "sawtooth", .08, { lp: 2200 }));
    hiss(.5, .8, .05, 5000);
  }
};

/* 만점 폭죽: 결과 화면이 열릴 때 한 번 터뜨리고, 모두 사라지면 닫는다. 화면을 누르면 바로 꺼진다 */
const fxCv = $("fx"), fxCtx = fxCv.getContext("2d"), fxTxt = $("fxText");
let fxParts = [], fxRaf = 0, fxTimers = [], fxBursting = false;
function stopFx() {
  fxTimers.forEach(clearTimeout); fxTimers = []; cancelAnimationFrame(fxRaf); fxParts = []; fxBursting = false;
  fxCv.classList.remove("on"); fxTxt.classList.remove("on");
}
function fxBurst(x, y, colors) {
  const n = 34;
  for (let i = 0; i < n; i++) {
    const a = (Math.PI * 2 * i) / n + Math.random() * .3, sp = 2 + Math.random() * 4.2;
    fxParts.push({ x, y, px: x, py: y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 0, max: 55 + Math.random() * 30, color: colors[i % colors.length], w: 2 + Math.random() * 2 });
  }
}
function fxFrame() {
  fxCtx.clearRect(0, 0, innerWidth, innerHeight);
  fxParts = fxParts.filter(p => p.life < p.max);
  for (const p of fxParts) {
    p.px = p.x; p.py = p.y;
    p.vx *= .985; p.vy = p.vy * .985 + .07;
    p.x += p.vx; p.y += p.vy; p.life++;
    fxCtx.globalAlpha = Math.max(0, 1 - p.life / p.max);
    fxCtx.strokeStyle = p.color; fxCtx.lineWidth = p.w; fxCtx.lineCap = "round";
    fxCtx.beginPath(); fxCtx.moveTo(p.px, p.py); fxCtx.lineTo(p.x, p.y); fxCtx.stroke();
  }
  fxCtx.globalAlpha = 1;
  if (fxParts.length || fxBursting) fxRaf = requestAnimationFrame(fxFrame); else stopFx();
}
function playFireworks(text) {
  stopFx();
  fxTxt.textContent = text;
  void fxTxt.offsetWidth; fxTxt.classList.add("on");
  sound.play("fanfare");
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) { fxTimers.push(setTimeout(stopFx, 2200)); return; }
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  fxCv.width = Math.round(innerWidth * dpr); fxCv.height = Math.round(innerHeight * dpr);
  fxCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
  fxCv.classList.add("on");
  const cs = getComputedStyle(root);
  const colors = [cs.getPropertyValue("--accent").trim() || "#f7a8c0", cs.getPropertyValue("--accent-ink").trim() || "#b0305f", "#ffd166", "#ffffff"];
  fxBursting = true;
  [0, 350, 750, 1100, 1500, 1900, 2300].forEach(t => fxTimers.push(setTimeout(() => {
    fxBurst(innerWidth * (.2 + Math.random() * .6), innerHeight * (.18 + Math.random() * .4), colors);
    sound.play("pop");
  }, t)));
  fxTimers.push(setTimeout(() => { fxBursting = false; }, 2400));
  fxRaf = requestAnimationFrame(fxFrame);
}
fxCv.addEventListener("click", stopFx);

/* 확인창: 확인을 누를 때만 실행한다 */
function askConfirm(title, msg, yesLabel, onYes) {
  const box = $("confirmBox");
  $("cfTitle").textContent = title; $("cfMsg").textContent = msg; $("cfYes").textContent = yesLabel;
  const close = () => { box.hidden = true; view.removeEventListener("keydown", onKey); $("cfYes").onclick = $("cfNo").onclick = null; box.onclick = null; };
  const onKey = e => { if (e.key === "Escape") close(); };
  $("cfNo").onclick = close;
  $("cfYes").onclick = () => { close(); onYes(); };
  box.onclick = e => { if (e.target === box) close(); };
  view.addEventListener("keydown", onKey);
  box.hidden = false;
  $("cfNo").focus();
}

/* 문장 고치기 */
let edCur = 1;
let speakTimer = 0;
function renderEditor(g, focusIdx) {
  const d = DATA[g - 1];
  edCur = g;
  $("edTitle").textContent = g + "급 · " + d.title;
  view.querySelectorAll(".gtab").forEach(b => b.setAttribute("aria-pressed", String(+b.dataset.g === g)));
  $("edStatus").textContent = "";
  $("edList").replaceChildren(...d.items.map((t, i) => {
    const row = document.createElement("div");
    row.className = "edrow" + (t !== DEFAULTS[g - 1][i] ? " changed" : "");
    const n = document.createElement("span"); n.className = "n"; n.textContent = i + 1;
    const inp = document.createElement("input");
    inp.type = "text"; inp.maxLength = 100; inp.id = "ed" + i; inp.value = t; inp.lang = "ko"; inp.autocomplete = "off"; inp.spellcheck = false;
    inp.setAttribute("aria-label", g + "급 " + (i + 1) + "번 문장");
    row.append(n, inp);
    if (t !== DEFAULTS[g - 1][i]) inp.title = "처음 문장: " + DEFAULTS[g - 1][i];
    return row;
  }));
  if (focusIdx != null) {
    const el = $("ed" + focusIdx);
    if (el) { el.scrollIntoView({ block: "center" }); el.focus({ preventScroll: true }); }
  }
}
function persistItems() {
  const ov = {};
  DATA.forEach((d, i) => { if (d.items.some((t, k) => t !== DEFAULTS[i][k])) ov[d.g] = d.items; });
  ls.set("dictation-items", ov);
}
function saveEditor() {
  const g = edCur, d = DATA[g - 1];
  d.items = d.items.map((_, i) => { const v = $("ed" + i).value.trim().slice(0,100); return v || DEFAULTS[g - 1][i]; });
  persistItems();
  renderEditor(g);
  $("edStatus").textContent = g + "급 문장을 저장했어요.";
}
function resetEditor() {
  const g = edCur;
  DATA[g - 1].items = DEFAULTS[g - 1].slice();
  persistItems();
  renderEditor(g);
  $("edStatus").textContent = g + "급 문장을 처음 상태로 초기화했어요.";
}
/* 문장 백업: 고친 급수만 글로 내보내고, 붙여 넣어 가져온다 */
function setBk(msg, err) { const el = $("bkStatus"); el.textContent = msg; el.classList.toggle("err", !!err); }
const isIOS = () => /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
function downloadFile(text, name) {
  const url = URL.createObjectURL(new Blob([text], { type: "text/plain;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url; a.download = name;
  document.body.append(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}
/* 아이폰은 링크로 내려받기가 조용히 무시되는 경우가 있어서 공유창을 열어 '파일에 저장'을 고르게 한다.
   브라우저는 저장이 끝났는지 알려 주지 않으므로, 안내 문구는 확인된 사실만 쓴다 */
async function exportItems() {
  const items = {};
  DATA.forEach((d, i) => { if (d.items.some((t, k) => t !== DEFAULTS[i][k])) items[d.g] = d.items; });
  const edited = Object.keys(items).length;
  if (!edited) DATA.forEach(d => { items[d.g] = d.items; });
  const n = Object.keys(items).length;
  const text = JSON.stringify({ app: "dictation-note", version: 1, items });
  const d = new Date(), pad = x => String(x).padStart(2, "0");
  const name = "dictation-backup-" + d.getFullYear() + pad(d.getMonth() + 1) + pad(d.getDate()) + ".txt";
  const what = edited ? n + "개 급수" : "모든 급수";
  try {
    if (isIOS() && navigator.share && navigator.canShare) {
      const file = new File([text], name, { type: "text/plain" });
      if (navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({ files: [file], title: "받아쓰기 문장 백업" });
          setBk(what + "를 공유창으로 내보냈어요. '파일에 저장'을 골랐다면 파일 앱에서 확인해 주세요.");
        } catch (e) {
          if (e && e.name === "AbortError") setBk("내보내기를 취소했어요.");
          else { downloadFile(text, name); setBk(what + " 파일(" + name + ") 저장을 요청했어요. 다운로드 폴더에서 확인해 주세요."); }
        }
        return;
      }
    }
    downloadFile(text, name);
    setBk(what + " 파일(" + name + ") 저장을 요청했어요. 다운로드 폴더에서 확인해 주세요.");
  } catch (e) {
    setBk("파일로 저장하지 못했어요. 브라우저에서 다운로드가 막혀 있는지 확인해 주세요.", true);
  }
}
function parseBackup(text) {
  let obj;
  try { obj = JSON.parse(text.trim()); } catch (e) { return null; }
  if (!obj || obj.app !== "dictation-note" || !obj.items || typeof obj.items !== "object") return null;
  const out = {};
  for (const k of Object.keys(obj.items)) {
    const g = Number(k), arr = obj.items[k];
    if (!Number.isInteger(g) || g < 1 || g > DATA.length) return null;
    if (!Array.isArray(arr) || arr.length !== DATA[g - 1].items.length || arr.some(t => typeof t !== "string" || t.length > 100)) return null;
    out[g] = arr.map((t, i) => t.trim() || DEFAULTS[g - 1][i]);
  }
  return Object.keys(out).length ? out : null;
}
function importText(text) {
  const parsed = parseBackup(text);
  if (!parsed) { setBk("가져올 수 없는 파일이에요. 내보내기로 만든 .txt 파일을 골라 주세요.", true); return; }
  const gs = Object.keys(parsed);
  askConfirm(gs.length + "개 급수를 가져올까요?", "이 기기의 " + gs.map(g => g + "급").join(", ") + " 문장이 파일의 문장으로 바뀌어요.", "가져오기", () => {
    gs.forEach(g => { DATA[g - 1].items = parsed[g]; });
    persistItems();
    renderEditor(edCur);
    setBk(gs.length + "개 급수를 가져왔어요.");
  });
}
function importFile(file) {
  if (!file) return;
  if (file.size > 1024 * 1024) { setBk("파일이 너무 커요. 내보내기로 만든 .txt 파일을 골라 주세요.", true); return; }
  const r = new FileReader();
  r.onload = () => importText(String(r.result));
  r.onerror = () => setBk("파일을 읽지 못했어요. 다시 시도해 주세요.", true);
  r.readAsText(file, "utf-8");
}

function openSettings(g, idx) {
  show("settings");
  renderEditor(g || 1, idx);
}

/* 급수별 기록 */
function recordRun(g, full, results, order) {
  const all = statStore.get();
  const s = all[g] || { runs: 0, last: null, best: null, miss: {} };
  const n = results.filter(r => r.ok).length;
  if (full) { s.runs++; s.last = n; s.best = Math.max(s.best ?? 0, n); }
  results.forEach((r, i) => { if (!r.ok) s.miss[order[i]] = (s.miss[order[i]] || 0) + 1; });
  all[g] = s;
  statStore.save(all);
}
function renderRecords() {
  const all = statStore.get(), box = $("records");
  const rows = DATA.filter(d => all[d.g] && all[d.g].runs > 0);
  if (!rows.length) { box.hidden = true; return; }
  const table = document.createElement("table");
  table.innerHTML = "<thead><tr><th>급수</th><th>도전</th><th>최근</th><th>최고</th><th>자주 틀린 문제</th></tr></thead>";
  const tb = document.createElement("tbody");
  for (const d of rows) {
    const s = all[d.g];
    const top = Object.entries(s.miss).sort((a, b) => b[1] - a[1]).slice(0, 3)
      .map(([i, c]) => (d.items[i] || "") + " (" + c + "회)").join(", ") || "없어요";
    const tr = document.createElement("tr");
    [d.g + "급", s.runs + "회", s.last + "/10", s.best + "/10", top].forEach(t => {
      const td = document.createElement("td"); td.textContent = t; tr.append(td);
    });
    tb.append(tr);
  }
  table.append(tb);
  const h = document.createElement("h2"); h.textContent = "급수별 기록";
  const sc = document.createElement("div"); sc.className = "scroll"; sc.append(table);
  box.replaceChildren(h, sc);
  box.hidden = false;
}
const stars = n => n >= 10 ? "★★★" : n >= 8 ? "★★☆" : n >= 5 ? "★☆☆" : "☆☆☆";

/* 글자 단위 비교: 최장 공통 부분열로 맞은 곳, 빠진 곳, 더 쓴 곳을 구한다 */
function diff(ans, mine, strict) {
  const a = Array.from(strict ? ans : strip(ans));
  const b = Array.from(strict ? mine : strip(mine));
  const n = a.length, m = b.length;
  const dp = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
  for (let i = n - 1; i >= 0; i--)
    for (let j = m - 1; j >= 0; j--)
      dp[i][j] = a[i] === b[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
  const ops = []; let i = 0, j = 0;
  while (i < n && j < m) {
    if (a[i] === b[j]) { ops.push({ t: "eq", c: a[i] }); i++; j++; }
    else if (dp[i + 1][j] >= dp[i][j + 1]) ops.push({ t: "miss", c: a[i++] });
    else ops.push({ t: "extra", c: b[j++] });
  }
  while (i < n) ops.push({ t: "miss", c: a[i++] });
  while (j < m) ops.push({ t: "extra", c: b[j++] });
  return { ops, ok: ops.every(o => o.t === "eq") };
}
function cell(c, cls) {
  const s = document.createElement("span");
  s.className = "cell" + (cls ? " " + cls : "") + (c === " " ? " sp" : "");
  if (c !== " ") s.textContent = c;
  return s;
}

/* 화면 전환 */
let S = null; // { grade, order, idx, results, checked, full, strict, hear }
function show(name) {
  clearTimeout(speakTimer);
  try { speechSynthesis.cancel(); } catch {}
  stopFx();
  for (const id of ["home", "quiz", "done", "settings"]) $(id).hidden = id !== name;
  $("btnHome").hidden = name === "home";
  $("btnSettings").classList.toggle("on", name === "settings");
  $("subtitle").hidden = name !== "home";
  window.scrollTo(0, 0);
}

function renderHome() {
  const best = store.get();
  const wrongAll = wrongStore.get();
  $("grades").replaceChildren(...DATA.map(d => {
    const card = document.createElement("div");
    card.className = "grade";
    const b = document.createElement("button");
    b.type = "button"; b.className = "gmain";
    const bs = best[d.g];
    b.innerHTML = '<span class="badge"></span><h3></h3><div class="meta"><span></span><span class="stars"></span></div>';
    b.querySelector(".badge").textContent = d.g + "급";
    b.querySelector("h3").textContent = d.title;
    b.querySelector(".meta span").textContent = bs != null ? "최고 " + bs + "/10" : "아직 안 풀었어요";
    b.querySelector(".stars").textContent = bs != null ? stars(bs) : "";
    b.addEventListener("click", () => start(d.g));
    card.append(b);
    const wrong = wrongAll[d.g] || [];
    if (wrong.length) {
      const r = document.createElement("button");
      r.type = "button"; r.className = "retry";
      r.textContent = "틀린 문제 다시 풀기 (" + wrong.length + ")";
      r.addEventListener("click", () => start(d.g, wrong.slice()));
      card.append(r);
    }
    return card;
  }));
  updateModeInfo();
  renderRecords();
  show("home");
}

function start(g, only) {
  const d = DATA.find(x => x.g === g);
  let order = only || d.items.map((_, i) => i);
  if (!only && SET.shuffle) { order=order.slice();for(let i=order.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[order[i],order[j]]=[order[j],order[i]];} }
  S = { grade: d, order, idx: 0, results: [], checked: false, full: !only, strict: SET.strict, hear: effectiveMode() === "hear" };
  show("quiz");
  renderQ();
}

function renderQ() {
  const d = S.grade, total = S.order.length;
  const text = d.items[S.order[S.idx]];
  $("qGrade").textContent = d.g + "급 · " + d.title;
  $("qCount").textContent = (S.idx + 1) + " / " + total;
  $("qBar").style.width = (S.idx / total * 100) + "%";
  $("qCells").replaceChildren(...Array.from(strip(text)).map(c => cell(c)));
  $("qCells").hidden = S.hear;
  $("btnListen").classList.toggle("big-listen", S.hear);
  $("btnListen").textContent = S.hear ? "다시 듣기" : "듣기";
  $("qLabel").firstChild.textContent = S.hear ? "문제를 잘 듣고 써요 " : "문제 ";
  if (S.hear) speakTimer = setTimeout(() => { if (!$("quiz").hidden) speak(); }, 150);
  const inp = $("answer");
  inp.value = ""; inp.disabled = false;
  $("btnMain").textContent = "확인하기";
  $("result").hidden = true;
  $("tip").hidden = false;
  S.checked = false;
  inp.focus({ preventScroll: true });
}

function check() {
  const idx = S.order[S.idx];
  const text = S.grade.items[idx];
  const mine = $("answer").value;
  const r = diff(text, mine, S.strict);
  S.results.push({ q: text, mine, ok: r.ok });
  sound.play(r.ok ? "correct" : "wrong");
  S.checked = true;
  $("answer").disabled = true;
  $("tip").hidden = true;

  const res = $("result");
  const myRow = document.createElement("div"), anRow = document.createElement("div");
  myRow.className = anRow.className = "cells";
  for (const o of r.ops) {
    if (o.t === "eq") { myRow.append(cell(o.c)); anRow.append(cell(o.c)); }
    else if (o.t === "extra") myRow.append(cell(o.c, "bad"));
    else anRow.append(cell(o.c, "miss"));
  }
  if (!mine) myRow.append(Object.assign(document.createElement("span"), { textContent: "(아무것도 쓰지 않았어요)", className: "tip" }));

  const verdict = document.createElement("div");
  verdict.className = "verdict " + (r.ok ? "ok" : "no");
  verdict.textContent = r.ok ? "정답이에요! 잘 썼어요." : "아쉬워요. 빨간 칸과 노란 칸을 확인해요.";
  const l1 = document.createElement("div"); l1.className = "label"; l1.textContent = "내가 쓴 글";
  const l2 = document.createElement("div"); l2.className = "label"; l2.textContent = "바른 글";
  const legend = document.createElement("div"); legend.className = "legend";
  legend.innerHTML = '<span class="l-bad">잘못 쓴 글자</span><span class="l-miss">빠뜨리거나 바꿔야 할 글자</span>';
  const fix = document.createElement("button");
  fix.type = "button"; fix.className = "fixlink"; fix.textContent = "문제 문장이 잘못됐나요? 고치러 가기";
  fix.addEventListener("click", () => openSettings(S.grade.g, idx));
  res.replaceChildren(verdict);
  if (!r.ok) res.append(l1, myRow, l2, anRow, legend);
  else res.append(l2, anRow);
  res.append(fix);
  res.hidden = false;
  $("btnMain").textContent = S.idx === S.order.length - 1 ? "결과 보기" : "다음 문제";
  $("btnMain").focus({ preventScroll: true });
  $("qBar").style.width = ((S.idx + 1) / S.order.length * 100) + "%";
}

function next() {
  if (S.idx < S.order.length - 1) { S.idx++; renderQ(); } else finish();
}

function finish() {
  const total = S.results.length, n = S.results.filter(r => r.ok).length;
  if (S.full) store.set(S.grade.g, n);
  recordRun(S.grade.g, S.full, S.results, S.order);
  {
    const failed = [], passed = [];
    S.results.forEach((r, i) => (r.ok ? passed : failed).push(S.order[i]));
    const kept = S.full ? [] : (wrongStore.get()[S.grade.g] || []).filter(x => !passed.includes(x));
    wrongStore.set(S.grade.g, [...new Set([...kept, ...failed])].sort((a, b) => a - b));
  }
  $("dTitle").textContent = S.grade.g + "급 · " + S.grade.title + (S.full ? "" : " (틀린 문제 다시)");
  $("dScore").textContent = n + " / " + total;
  $("dStars").textContent = stars(n === total ? 10 : Math.round(n / total * 10));
  $("dMsg").textContent = n === total ? "모두 맞혔어요! 정말 대단해요." : n >= total * .8 ? "거의 다 맞혔어요. 틀린 문제만 한 번 더 해 볼까요?" : "틀리면서 배우는 거예요. 틀린 문제를 다시 써 봐요.";
  $("dList").replaceChildren(...S.results.map((r, i) => {
    const li = document.createElement("li");
    li.innerHTML = '<span class="n"></span><span class="mark"></span><span class="txt"></span>';
    li.children[0].textContent = (i + 1);
    li.children[1].textContent = r.ok ? "O" : "X";
    li.children[1].classList.add(r.ok ? "ok" : "no");
    const t = li.children[2]; t.textContent = r.q;
    if (!r.ok) { const m = document.createElement("span"); m.className = "mine"; m.textContent = "내가 쓴 글: " + (r.mine || "(비어 있음)"); t.append(m); }
    return li;
  }));
  const acts = $("dActions"); acts.replaceChildren();
  const wrong = [];
  S.results.forEach((r, i) => { if (!r.ok) wrong.push(S.order[i]); });
  const mk = (txt, fn, cls) => { const b = document.createElement("button"); b.type = "button"; b.className = cls; b.textContent = txt; b.addEventListener("click", fn); return b; };
  if (wrong.length) acts.append(mk("틀린 문제 다시 풀기 (" + wrong.length + ")", () => start(S.grade.g, wrong), "primary"));
  acts.append(mk("이 급수 처음부터", () => start(S.grade.g), wrong.length ? "ghost" : "primary"));
  acts.append(mk("급수 고르기", renderHome, "ghost"));
  show("done");
  if (n === total) playFireworks(S.full ? "100점!" : "모두 정답!");
}

/* 소리 듣기 */
function say(text) {
  try {
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "ko-KR"; u.rate = .75;
    const v = SET.voice && koVoices().find(x => x.voiceURI === SET.voice);
    if (v) { u.voice = v; u.lang = v.lang; }
    speechSynthesis.cancel(); speechSynthesis.speak(u);
  } catch (e) {}
}
function speak() { say(S.grade.items[S.order[S.idx]]); }

/* 목소리 선택: 기기에 설치된 한국어 음성만 보여 준다 */
const HELPER_VOICES = ["eddy", "flo", "grandma", "grandpa", "reed", "rocko", "sandy", "shelley",
  "albert", "bad", "bahh", "bells", "boing", "bubbles", "cellos", "good", "jester", "organ", "superstar", "trinoids", "whisper", "wobble", "zarvox", "fred", "junior", "ralph", "espeak"];
const GOOD_VOICE = /프리미엄|고급|향상|premium|enhanced/i;
/* 음질 등급: 기기가 주는 voiceURI로 판단한다. super-compact(간이) < compact(기본) < enhanced(향상된) < premium(프리미엄) */
const TIERS = [["super-compact", 0, "간이"], ["compact", 1, "기본"], ["enhanced", 2, "향상된"], ["premium", 3, "프리미엄"]];
function voiceTier(v) {
  const uri = (v.voiceURI || "").toLowerCase();
  const hit = TIERS.find(t => uri.includes(t[0]));
  if (hit) return hit;
  if (GOOD_VOICE.test(v.name)) return ["", 2, ""];
  return ["", 1, ""];
}
function voiceLabel(v) {
  const t = voiceTier(v);
  const label = v.name + (t[2] && !GOOD_VOICE.test(v.name) ? " (" + t[2] + ")" : "");
  return label + (v.localService ? "" : " (온라인)");
}
function koVoices() {
  try {
    /* super-compact(간이) 음성은 음질이 낮아서 항상 숨긴다. 목록이 비어도 '자동'으로 기기 기본 음성을 쓸 수 있다 */
    const all = speechSynthesis.getVoices()
      .filter(v => /^ko([-_]|$)/i.test(v.lang) && !/super-compact/i.test(v.voiceURI || "") && !HELPER_VOICES.includes(v.name.trim().split(/[\s(]/)[0].toLowerCase()));
    /* 같은 이름에 더 좋은 등급이 있으면 낮은 등급은 숨긴다. 가장 좋은 등급은 항상 남아서 목록이 비지 않는다 */
    return all
      .filter(v => !all.some(o => o !== v && o.name === v.name && voiceTier(o)[1] > voiceTier(v)[1]))
      .sort((a, b) => voiceTier(b)[1] - voiceTier(a)[1]);
  } catch (e) { return []; }
}
function refreshVoices() {
  const sel = $("voiceSel"), list = koVoices();
  const auto = new Option("자동 (기기 기본 음성)", "");
  sel.replaceChildren(auto, ...list.map(v => new Option(voiceLabel(v), v.voiceURI)));
  sel.value = list.some(v => v.voiceURI === SET.voice) ? SET.voice : "";
  $("voiceTip").textContent = list.length ? "" : "이 기기에서 한국어 음성 목록을 찾지 못했어요. 기본 음성으로 읽어요.";
}
$("btnListen").addEventListener("click", speak);
if (!CAN_SPEAK) $("btnListen").hidden = true;

$("form").addEventListener("submit", e => {
  e.preventDefault();
  if (!S) return;
  S.checked ? next() : check();
});
$("btnHome").addEventListener("click", () => { if(hasDraft()&&!confirm("급수 선택으로 돌아갈까요? 작성 중인 답과 저장하지 않은 문장은 사라져요."))return;renderHome(); });
$("btnSettings").addEventListener("click", () => openSettings(S ? S.grade.g : 1));

if (CAN_SPEAK) {
  refreshVoices();
  if(speechSynthesis.addEventListener){speechSynthesis.addEventListener("voiceschanged",refreshVoices);disposers.push(()=>speechSynthesis.removeEventListener("voiceschanged",refreshVoices));}
  [500, 1500, 3500].forEach(t => setTimeout(refreshVoices, t));
  $("voiceSel").addEventListener("change", e => { SET.voice = e.target.value; saveSettings(); say("받아쓰기를 시작해 볼까요?"); });
  $("voiceTest").addEventListener("click", () => say("받아쓰기를 시작해 볼까요?"));
} else {
  $("voiceBox").hidden = true;
}

initSettings();
renderHome();


function hasDraft(){
  if(!$('quiz').hidden)return true;
  return !$('settings').hidden&&DATA[edCur-1].items.some((text,i)=>$('ed'+i)?.value.trim()!==text);
}
return {
  hasDraft,
  refresh(){if(!$('home').hidden)renderHome();},
  destroy(){stopFx();for(const id of timers)window.clearTimeout(id);timers.clear();disposers.forEach(fn=>fn());if(actx)actx.close().catch(()=>{});try{speechSynthesis.cancel();}catch{}},
};
  }
};
