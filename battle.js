import {ENEMIES,planBattle,applyAnswer,battleOutcome} from './battle-engine.js?v=e5ad2ae6d30a';
import {ginArt,enemyArt} from './characters.js?v=e5ad2ae6d30a';
import {play} from './sound.js?v=e5ad2ae6d30a';
// 止まらないバトル。場面が5つ、高速で出る。出た選択肢をすぐ選ぶ。遅い・間違いはダメージ。HPが0で力尽きる。
export function playBattle(modal,{kind='salary',instant=false,onWin=()=>{},stats={}}={}){
 kind=ENEMIES[kind]?kind:'salary';const foe=ENEMIES[kind];
 let closed=false,timers=[],plan=planBattle(kind,stats);
 modal('<div class="quest-battle"></div>');
 const dialog=document.querySelector('#dialog'),root=dialog.querySelector('.quest-battle');dialog.classList.add('quest-dialog');
 const arena=(hp,foeHp,cls='')=>'<div class="quest-arena '+cls+'"><div class="quest-fighter"><b>銀くん</b>'+ginArt+'<div class="quest-health"><i style="width:'+Math.round(hp)+'%"></i></div></div><span class="quest-vs">VS</span><div class="quest-fighter foe"><b>'+foe.name+'</b>'+enemyArt[kind]+'<div class="quest-health"><i style="width:'+Math.round(foeHp)+'%"></i></div></div></div>';
 const later=(fn,ms)=>timers.push(setTimeout(()=>{if(!closed)fn();},ms));
 function intro(){const power=plan.power;root.innerHTML='<div class="quest-overline">洛北ナイトクエスト · 架空のバトル</div><h2>'+foe.name+'が現れた</h2><p class="quest-fiction">'+foe.subtitle+' 登場人物は創作。</p>'+arena(100,100)+'<div class="quest-power"><span>今日の力 <b>'+power.total+'</b> / 相手 '+foe.threshold+'</span><small>'+power.parts.map(([k,v])=>k+' +'+v).join(' · ')+'</small></div><button class="quest-primary" id="battle-start">いく</button><small class="quest-foot">始めたら止まらない。出てきた3つからすぐ選ぶ。遅いか間違えるとダメージ。力が高いと持ち時間が長く、一撃が重い。</small>';
  root.querySelector('#battle-start').onclick=start;}
 function start(){plan=planBattle(kind,stats);let state={hp:100,foeHp:100,hits:0,misses:0,late:0},i=0,deadline=null;
  const show=(text,cls,choices)=>{root.innerHTML='<div class="quest-overline">洛北ナイトクエスト · '+(i+1)+' / '+plan.prompts.length+'</div>'+arena(state.hp,state.foeHp,cls)+'<div class="quest-status" role="status">'+text+'</div>'+(choices?'<div class="quest-timer"><i style="animation-duration:'+choices.window+'ms"></i></div><div class="quest-choices">'+choices.options.map((o,j)=>'<button class="quest-choice" data-choice="'+j+'">'+o+'</button>').join('')+'</div>':'');};
  const next=()=>{if(i>=plan.prompts.length||state.hp<=0||state.foeHp<=0){finish(state);return;}const p=plan.prompts[i];show(p.text+(/[」？！]$/.test(p.text)?'':'！'),'',p);play('pop');
   root.querySelectorAll('.quest-choice').forEach(b=>b.onclick=()=>answer(Number(b.dataset.choice)));
   deadline=setTimeout(()=>answer(-1),p.window);timers.push(deadline);};
  const answer=choice=>{clearTimeout(deadline);const p=plan.prompts[i];if(!p)return;state=applyAnswer(state,p,choice);i++;
   show(state.ok?p.options[p.correct]+'。当たった':choice<0?'遅い！ −'+p.missDamage:'ちがう！ −'+p.missDamage,state.ok?'hit-foe':'hit-me');play(state.ok?'ting':'door');
   later(next,state.ok?240:300);};
  show('…','');later(next,350);}
 function finish(state){const out=battleOutcome(state),power=plan.power,won=out==='won';
  root.innerHTML='<div class="quest-overline">洛北ナイトクエスト</div>'+arena(state.hp,state.foeHp,won?'victory':out==='dead'?'down':'')+'<h3 class="quest-result">'+(won?'勝った':out==='dead'?'力尽きた':'倒しきれなかった')+'</h3><p class="quest-fiction">'+(won?'当たり '+state.hits+'、はずれ '+state.misses+'。':out==='dead'?'はずれ '+state.misses+'（遅れ '+state.late+'）。HPが0になった。':'当たり '+state.hits+' で相手のHPが '+state.foeHp+' 残った。')+' 今日の力 '+power.total+'（一撃 '+plan.rules.hit+'、持ち時間 ×'+plan.rules.time.toFixed(2)+'）。1km歩くと +6、ジム1回で +8。</p><div class="quest-buttons"><button class="quest-primary" id="battle-again">もう一度</button><button class="quest-secondary" data-action="close-modal">閉じる</button></div>';
  play(won?'chime':'door');if(won)onWin(kind);
  root.querySelector('#battle-again').onclick=start;}
 const clean=()=>{closed=true;timers.forEach(clearTimeout);dialog.classList.remove('quest-dialog');};
 dialog.addEventListener('close',clean,{once:true});
 if(instant)start();else intro();
}
