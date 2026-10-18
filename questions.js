/* 곱셈 정원 v1.6.0: bounded question generators and explicit answer contracts. */
var GardenQuestions = (() => {
  const conditionCache = new Map();
  const tableValues = n => Array.from({length:9},(_,i)=>n*(i+1));
  const range = (a,b) => Array.from({length:b-a+1},(_,i)=>a+i);
  const expressions = [];
  for(let x=2;x<=9;x++)for(let y=x;y<=9;y++)expressions.push({x,y,value:x*y});
  const bounds = [...new Map(expressions.map(e=>[e.value,e])).values()];
  const factorizations = new Map();
  for(const e of expressions){if(!factorizations.has(e.value))factorizations.set(e.value,[]);factorizations.get(e.value).push([e.x,e.y]);}
  const alternativeProducts = [...factorizations].filter(([,pairs])=>pairs.length>1).map(([n])=>n);
  function compare(n,op,v){return op==='<'?n<v:op==='<='?n<=v:op==='>'?n>v:n>=v;}
  const relationText = (e,op) => `${e.x} × ${e.y}보다 ${op==='<'?'작습니다':op==='<='?'작거나 같습니다':op==='>'?'큽니다':'크거나 같습니다'}.`;
  function conditionBank(a){
    if(conditionCache.has(a))return conditionCache.get(a);
    const bank=[];
    for(let c=2;c<=9;c++){
      if(c===a||a%c===0||c%a===0)continue;
      const aa=tableValues(a),cc=tableValues(c),common=aa.filter(n=>cc.includes(n));
      if(common.length<2)continue;
      const add=clauses=>{
        const pass=n=>clauses.every(k=>compare(n,k.op,k.bound.value));
        const hits=common.filter(pass);
        if(hits.length!==1||aa.filter(pass).length<2||cc.filter(pass).length<2)return;
        if(clauses.length===2&&clauses.some((_,i)=>common.filter(n=>compare(n,clauses[1-i].op,clauses[1-i].bound.value)).length<2))return;
        bank.push({a,c,target:hits[0],clauses});
      };
      for(const bound of bounds)for(const op of ['<','<=','>','>='])add([{bound,op}]);
      for(const low of bounds)for(const high of bounds){
        if(low.value>=high.value)continue;
        for(const lop of ['>','>='])for(const hop of ['<','<='])add([{bound:low,op:lop},{bound:high,op:hop}]);
      }
    }
    // 5 and 7 have only one shared table product with any different 2..9 table.
    // A parity clue keeps the size condition meaningful for those selected tables.
    if(!bank.length)for(const parity of [0,1]){
      const aa=tableValues(a),cc=range(1,81).filter(n=>n%2===parity),common=aa.filter(n=>cc.includes(n));
      const add=clauses=>{
        const pass=n=>clauses.every(k=>compare(n,k.op,k.bound.value)),hits=common.filter(pass);
        if(hits.length!==1||aa.filter(pass).length<2||cc.filter(pass).length<2)return;
        if(clauses.length===2&&clauses.some((_,i)=>common.filter(n=>compare(n,clauses[1-i].op,clauses[1-i].bound.value)).length<2))return;
        bank.push({a,c:null,parity,target:hits[0],clauses});
      };
      for(const bound of bounds)for(const op of ['<','<=','>','>='])add([{bound,op}]);
      for(const low of bounds)for(const high of bounds)if(low.value<high.value)for(const lop of ['>','>='])for(const hop of ['<','<='])add([{bound:low,op:lop},{bound:high,op:hop}]);
    }
    if(!bank.length)throw new Error(`조건 문제를 만들 수 없습니다: ${a}단`);
    conditionCache.set(a,bank);return bank;
  }
  const pick = arr => arr[rand(0,arr.length-1)];
  function writing(q,sample,rubric){q.writing={sample,rubric};return q;}
  function make(t,dan='all',sceneIndex=null,preset={}){
    const a=preset.a??(dan==='all'?rand(2,9):+dan),b=preset.b??rand(2,9);
    const q={t,a,b,kind:'fields',fields:[],visual:'',text:'',hint:'',variant:preset.variant??rand(0,t===10?3:2)};
    if(t===0||t===8){
      const item=window.GardenPictures?window.GardenPictures.choose('groups',preset.avoidPicture):pick(pictureItems);q.pictureItem=item;q.visual=groupPicture(a,b,item);
      q.ordered=t===8&&q.variant!==2;
      q.text=t===0?'그림을 보고 덧셈식과 곱셈식을 완성해 보세요.':q.ordered?'한 묶음의 수 × 묶음 수 = 전체 수가 되도록 빈칸을 채우세요.':'그림에 맞는 곱셈식을 완성해 보세요. 두 수의 순서를 바꾸어도 좋아요.';
      q.fields=t===0?[field('덧셈의 합',a*b),field('곱',a*b)]:[field('한 묶음의 수',a),field('묶음 수',b),field('전체 수',a*b)];
      q.hint=`한 묶음에 ${a}개씩 ${b}묶음입니다. ${a} × ${b} = ${a*b}입니다.${q.ordered?' 첫 빈칸은 한 묶음의 수, 둘째 빈칸은 묶음 수입니다.':''}`;
    }
    if(t===1){
      q.small=rand(1,b-1);q.text='□ 안에 알맞은 수를 써 보세요.';
      q.fields=[field(`${a} × ${q.small} =`,a*q.small),field('더 있는 묶음 수',b-q.small),field('더 큰 만큼',a*(b-q.small))];
      q.hint=`묶음은 ${b-q.small}묶음 더 많습니다. ${a}씩 ${b-q.small}묶음이므로 ${a*(b-q.small)}만큼 더 큽니다.`;
    }
    if(t===2){
      q.prev=q.variant===0?b-1:rand(1,b-1);const added=a*(b-q.prev);
      q.text=`${a} × ${b}${subjectJosa(b)} 두 가지 방법으로 구해 보세요.`;
      q.fields=[field('방법 ① 더하는 횟수',b),field('방법 ① 덧셈의 합',a*b),field('방법 ② 문장에서 더할 수',added),field('방법 ② 곱',a*b),field('화살표 옆 더할 수',added)];
      q.hint=`${a}씩 ${b}번 더하면 ${a*b}입니다. ${a} × ${q.prev} = ${a*q.prev}에서 ${a}씩 ${b-q.prev}묶음인 ${added}만큼 더하면 ${a*b}입니다.`;
    }
    if(t===3){
      q.kind='multi';const item=window.GardenPictures?window.GardenPictures.choose('dense',preset.avoidPicture):pick(pictureItems);q.pictureItem=item;q.text=`그림에 있는 ${item[0]}의 전체 개수를 구하는 바른 방법을 모두 고르세요.`;q.visual=arrayPicture(a,b,item);
      const candidates=[
        {text:`${a}씩 ${b}번 더해서 구합니다.`,value:a*b},
        {text:`${b}씩 ${a}번 더해서 구합니다.`,value:a*b},
        {text:`${a} × ${b-1}의 값에 ${a}만큼 더해서 구합니다.`,value:a*(b-1)+a},
        {text:`${a-1} × ${b}의 값에 ${b}만큼 더해서 구합니다.`,value:(a-1)*b+b},
        {text:`${b} × ${a}의 곱으로 구합니다.`,value:a*b},
        {text:`${a}${josa(a,'와/과')} ${b}${josa(b,'을/를')} 더해서 구합니다.`,value:a+b},
        {text:`${a}씩 ${b-1}번 더해서 구합니다.`,value:a*(b-1)},
        {text:`${a} × ${b}의 값에 1만큼 더해서 구합니다.`,value:a*b+1},
        {text:`${a} × ${b}의 값에서 ${a}만큼 빼서 구합니다.`,value:a*b-a},
        {text:`${b}씩 ${a-1}번 더해서 구합니다.`,value:b*(a-1)}
      ];
      const unique=[...new Map(candidates.map(o=>[o.text,o])).values()];const count=(q.variant%3)+1;
      q.options=shuffle([...shuffle(unique.filter(o=>o.value===a*b)).slice(0,count),...shuffle(unique.filter(o=>o.value!==a*b)).slice(0,4-count)]).map(o=>({...o,ok:o.value===a*b}));
      q.expected=q.options.flatMap((o,i)=>o.ok?[String(i)]:[]);
      q.hint=`그림은 ${a}개씩 ${b}묶음 또는 ${b}개씩 ${a}묶음으로 셀 수 있습니다. 전체는 ${a*b}개입니다. 보기마다 계산 결과가 ${a*b}인지 확인하세요.`;
    }
    if(t===4){
      q.kind='grid';q.text=`숫자판에서 ${a}단 곱셈구구의 곱을 모두 누르세요. ${a} × 1부터 ${a} × 9까지 찾으세요.`;
      const targets=tableValues(a),others=shuffle(range(1,81).filter(n=>!targets.includes(n))).slice(0,21);
      q.nums=[...targets,...others].sort((x,y)=>x-y);q.expected=targets.map(String);q.hint=`${a}단의 곱은 ${targets.join(', ')}입니다.`;
    }
    if(t===5){
      const bank=conditionBank(a),targets=[...new Set(bank.map(k=>k.target))];
      const target=pick(targets),possible=bank.filter(k=>k.target===target);
      const desired=q.variant===2?2:1,filtered=possible.filter(k=>k.clauses.length===desired);
      const spec=pick(filtered.length?filtered:possible);q.condition=spec;
      q.text='모든 조건에 맞는 수를 구해 보세요.';
      const conditions=[`${a}단 곱셈구구의 곱입니다.`,...spec.clauses.map(k=>relationText(k.bound,k.op)),spec.c?`${spec.c}단 곱셈구구의 곱이기도 합니다.`:spec.parity===0?'짝수입니다.':'홀수입니다.'];
      q.visual=`<div class="condition-box">${conditions.map(s=>`<p>• ${s}</p>`).join('')}</div>`;q.fields=[field('답',spec.target)];
      q.hint=`${spec.clauses.map(k=>`${k.bound.x} × ${k.bound.y} = ${k.bound.value}`).join(', ')}입니다. 모든 조건을 만족하는 수는 ${spec.target} 하나입니다. ${a} × ${spec.target/a} = ${spec.target}입니다.${spec.c?` ${spec.c} × ${spec.target/spec.c} = ${spec.target}도 확인하세요.`:` ${spec.target}${subjectJosa(spec.target)} ${spec.parity===0?'짝수':'홀수'}입니다.`}`;
    }
    if(t===6){
      q.kind='match';q.text='곱이 같은 식을 골라보세요!!';q.pairs=[];const used=new Set();
      const candidates=shuffle(alternativeProducts),selected=candidates.find(p=>factorizations.get(p).some(pair=>pair.includes(a)));
      const products=[...(selected?[selected]:[]),...candidates.filter(p=>p!==selected)].slice(0,3);
      for(let i=0;i<3;i++){
        const value=products[i],pairs=factorizations.get(value),eligible=i===0&&selected?pairs.filter(p=>p.includes(a)):pairs;
        let left=[...pick(eligible)];if(i===0&&selected&&left[1]===a)left.reverse();else if(rand(0,1))left.reverse();
        const unordered=[...left].sort((x,y)=>x-y);const alternate=pick(pairs.filter(p=>p[0]!==unordered[0]||p[1]!==unordered[1]));
        // Two different decompositions, plus an optional commutative pair in the third row.
        let right=[...alternate],mode='combination';if(i===2&&q.variant===0&&left[0]!==left[1]){right=[left[1],left[0]];mode='swap';}else if(rand(0,1))right.reverse();
        q.pairs.push({left:`${left[0]} × ${left[1]}`,right:`${right[0]} × ${right[1]}`,leftFactors:left,rightFactors:right,value,mode});used.add(value);
      }
      q.right=shuffle(q.pairs.map(p=>p.right));q.expected=q.pairs.map(p=>String(q.right.indexOf(p.right)));
      q.hint=q.pairs.map(p=>`${p.left} = ${p.right} = ${p.value}`).join('\n')+'\n두 수의 조합이 달라도 곱이 같을 수 있습니다. 각 식의 곱을 확인하세요.';
      if(dan!=='all'&&!selected)q.scopeNote=`${a}단은 2~9의 다른 두 수 조합으로 같은 곱을 만들 수 없어, 이 문제는 다른 단으로 연습해요.`;
    }
    if(t===7){
      q.sceneIndex=sceneIndex??rand(0,lifeScenes.length-1);const scene=lifeScenes[q.sceneIndex];q.unit=scene[2];q.moveMode=q.variant;
      q.text=q.moveMode===0?`그림을 보고 ${scene[0]}의 ${scene[3]} 거리를 곱셈식으로 나타내 보세요.`:q.moveMode===1?`${scene[0]}의 전체 이동 거리는 ${a*b}${q.unit}입니다. 그림을 보고 이동 횟수를 구하세요.`:`${scene[0]}의 전체 이동 거리는 ${a*b}${q.unit}입니다. 같은 길이의 구간을 보고 한 번의 이동 거리를 구하세요.`;
      q.visual=movementPicture(a,b,scene,q.moveMode===2);
      q.fields=q.moveMode===0?[field('이동 횟수',b),field('전체 거리',a*b)]:[field(q.moveMode===1?'이동 횟수':'한 번의 이동 거리',q.moveMode===1?b:a)];
      q.hint=`한 번에 ${a}${q.unit}씩 ${b}번 이동했습니다. ${a} × ${b} = ${a*b}이므로 전체 거리는 ${a*b}${q.unit}입니다. 구간은 ${b}개이고 경계점은 ${b+1}개입니다.`;
    }
    if(t===9){
      const scene=pick(wordScenes);q.text=scene.text(a,b)+' 전체 개수를 나타내는 식이므로 두 수의 순서를 바꾸어도 좋아요.';q.unit=scene.unit;
      q.fields=[field('식의 첫 번째 수',a),field('식의 두 번째 수',b),field('식의 곱',a*b),field('답',a*b)];q.hint=`${a}씩 ${b}묶음이므로 ${a} × ${b} = ${a*b}입니다. 답은 ${a*b}${q.unit}입니다.`;
    }
    if(t===10){
      const factor=q.variant%2;q.zeroOne={left:q.variant>=2?factor:a,right:q.variant>=2?a:factor};
      const {left,right}=q.zeroOne;q.text='□ 안에 알맞은 수를 써 보세요.';q.fields=[field('곱',left*right)];
      q.hint=factor===0?'어떤 수에 0을 곱하거나, 0에 어떤 수를 곱하면 곱은 0입니다.':'어떤 수에 1을 곱하거나, 1에 어떤 수를 곱하면 곱은 그 수입니다.';
    }
    if(t===11){
      q.missingSide=q.variant%2;q.text='곱셈구구를 떠올려 □ 안에 알맞은 수를 써 보세요.';q.fields=[field(q.missingSide===0?'첫 번째 수':'두 번째 수',q.missingSide===0?a:b)];q.hint=`${a} × ${b} = ${a*b}입니다.`;
    }
    if(t===12){
      const rows=[...new Set([a,q.variant===0?0:1,...shuffle(range(0,9).filter(n=>n!==a&&n!==(q.variant===0?0:1))).slice(0,2)])].sort((x,y)=>x-y);
      const cols=shuffle(range(0,9)).slice(0,4).sort((x,y)=>x-y);const positions=shuffle(rows.flatMap((r,ri)=>cols.map((c,ci)=>({ri,ci,r,c}))));
      const required=positions.find(p=>p.r===a),blanks=[required,...positions.filter(p=>p!==required).slice(0,2)];
      q.table={rows,cols,blanks};q.text='곱셈표에서 □ 안에 알맞은 수를 써 보세요.';q.fields=blanks.map(p=>field(`${p.r} × ${p.c}`,p.r*p.c));q.hint=blanks.map(p=>`${p.r} × ${p.c} = ${p.r*p.c}`).join('\n')+'\n왼쪽 머리글과 위쪽 머리글을 곱합니다.';
    }
    if(t===13){
      q.kind='single';const left=a*b,relation=q.variant===0?'<':q.variant===1?'=':'>';
      const candidates=range(1,9).flatMap(x=>range(1,9).map(y=>({x,y,value:x*y}))).filter(e=>!(e.x===a&&e.y===b)&& (relation==='='?e.value===left:relation==='<'?e.value>left:e.value<left));
      const other=pick(candidates.length?candidates:[{x:b,y:a,value:left}]);q.compare={a,b,x:other.x,y:other.y};
      q.text=`${a} × ${b} □ ${other.x} × ${other.y}\n□ 안에 알맞은 기호를 고르세요.`;q.options=['<','=','>'].map(text=>({text}));q.expected=[String(left<other.value?0:left===other.value?1:2)];q.hint=`${a} × ${b} = ${left}, ${other.x} × ${other.y} = ${other.value}입니다. 알맞은 기호는 ${q.options[+q.expected[0]].text}입니다.`;
    }
    if(t===14){
      q.text=q.variant===0?`빨간 구슬은 ${a}개입니다. 파란 구슬은 빨간 구슬 수의 ${b}배입니다. 파란 구슬은 몇 개인가요?`:q.variant===1?`빨간 구슬은 ${a}개이고 파란 구슬은 ${a*b}개입니다. 파란 구슬 수는 빨간 구슬 수의 몇 배인가요?`:`파란 구슬은 ${a*b}개입니다. 파란 구슬 수가 빨간 구슬 수의 ${b}배라면 빨간 구슬은 몇 개인가요?`;
      q.fields=[field(q.variant===0?'파란 구슬 수':q.variant===1?'몇 배':'빨간 구슬 수',q.variant===0?a*b:q.variant===1?b:a)];
      q.visual=`<p class="picture-label">빨간 구슬${q.variant===2?'':` ${a}개`}</p>${groupPicture(a,1,['빨간 구슬','🔴'])}<p class="picture-label">같은 수씩 묶은 파란 구슬</p>${groupPicture(a,b,['파란 구슬','🔵'])}`;
      q.hint=`${a}의 ${b}배는 ${a}씩 ${b}묶음입니다. ${a} × ${b} = ${a*b}이므로 파란 구슬은 ${a*b}개입니다.`;
    }
    if(t===15){
      q.text='아래 풀이는 틀렸어요. 바른 곱을 써 보세요.';
      const sum=a+b;q.errorType=(q.variant===0||b===2)&&sum!==a*b?'add':'groups';
      const wrongSum=Array(b-1).fill(a).join(' + ');
      q.wrongEquation=q.errorType==='add'?`${a} × ${b} = ${a} + ${b} = ${sum}`:b===2?`${a} × ${b} = ${a}`:`${a} × ${b} = ${wrongSum} = ${a*(b-1)}`;
      q.visual=`<div class="error-equation"><span class="error-label">잘못된 풀이</span><div>${esc(q.wrongEquation)}</div></div>`;q.fields=[field('바르게 구한 곱',a*b)];q.hint=`${q.errorType==='add'?'두 수를 한 번씩 더한 계산입니다.':`${a}${josa(a,'을/를')} ${b-1}번만 더한 계산입니다.`} ${a} × ${b}${subjectJosa(b)} ${a}씩 ${b}번 더하는 뜻입니다. ${a} × ${b} = ${Array(b).fill(a).join(' + ')} = ${a*b}입니다.`;
    }
    if(t===16){
      q.text=`${a} × ${b-1} = ${a*(b-1)}${josa(a*(b-1),'을/를')} 이용하여 ${a} × ${b}${josa(b,'을/를')} 구하는 방법을 설명하세요.`;q.fields=[field('곱',a*b)];
      q.hint=`${a} × ${b} = ${a*b}입니다. 계산 방법은 말이나 식으로 설명할 수 있습니다.`;
      writing(q,`${a}씩 한 묶음 더 많으므로 ${a*(b-1)}에 ${a}만큼 더해 ${a*b}입니다.`,[`${a}씩 한 묶음이 더 있다는 관계를 설명했나요?`,`${a*(b-1)}에서 ${a}만큼 더하는 계산이 맞나요?`]);
    }
    if(t===17){
      q.text=`${a}개씩 ${b}묶음인 이야기를 만들고 전체 개수를 구하세요.`;q.visual=`<div class="life-equation">${a} × ${b} = □</div>`;q.fields=[field('전체 개수',a*b)];q.hint=`전체 개수는 ${a*b}입니다. 물건이나 상황이 달라도 묶음의 뜻이 맞으면 좋습니다.`;
      writing(q,`사탕이 ${a}개씩 ${b}봉지 있습니다. 모두 ${a*b}개입니다.`,[`한 묶음의 수가 ${a}개인가요?`,`묶음 수가 ${b}묶음인가요?`,'이야기와 식이 서로 맞나요?']);
    }
    if(t===18){
      q.kind='multi';q.allFactors=a*b;q.text=`두 수가 모두 1~9인 식입니다. 보기에서 곱이 ${a*b}인 식을 모두 고르세요.`;
      const pairs=range(1,9).flatMap(x=>range(1,9).map(y=>({text:`${x} × ${y}`,value:x*y,factors:[x,y]})));
      q.options=shuffle([...pairs.filter(p=>p.value===a*b),...shuffle(pairs.filter(p=>p.value!==a*b)).slice(0,3)]).map(p=>({...p,ok:p.value===a*b}));
      q.expected=q.options.flatMap((p,i)=>p.ok?[String(i)]:[]);q.hint=`곱이 ${a*b}인 식은 ${q.options.filter(p=>p.ok).map(p=>p.text).join(', ')}입니다. 순서가 다른 식도 각각 고릅니다.`;
    }
    return q;
  }
  return {make,conditionBank,tableValues,alternativeProducts,factorizations};
})();
