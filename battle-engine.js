// 街角バトル：止まらない。5つの選択肢が高速で出る。遅いか間違えるとダメージ。HPが0で力尽きる。
// 今日の行動（歩いた距離・ジム・ねずみの体型）が「力」になり、持ち時間と一撃の重さに効く。
export const ENEMIES={
 salary:{name:'疲れきったサラリーマン',subtitle:'「それ、今日中で」の怨念が残っている。',threshold:48},
 student:{name:'暴れ大学生',subtitle:'提出まであと3時間。テンションだけが高い。',threshold:58},
 ramen:{name:'コール番長',subtitle:'架空のラーメン店員ボス。コールは待ってくれない。',threshold:68}
};
// 出てくる場面と選択肢。先頭が正解。順番は毎回シャッフル。
export const PROMPTS={
 salary:[
  ['終電ダッシュで突っ込んでくる',['よける','止める','一緒に走る']],
  ['未読メールの山を投げてきた',['既読にする','読む','返信する']],
  ['「差し戻しで」と言った',['聞き流す','謝る','反論する']],
  ['よろけた。隙だ',['体当たり','様子を見る','声をかける']],
  ['名刺を出してきた',['受け取らない','受け取る','交換する']]
 ],
 student:[
  ['謎の胴上げが始まった',['逃げる','参加する','撮る']],
  ['「単位ください」と迫る',['断る','あげる','考える']],
  ['徹夜テンションで叫んだ',['耳をふさぐ','聞く','叫び返す']],
  ['コンビニ袋を振り回す',['しゃがむ','ジャンプ','つかむ']],
  ['息切れしてる。隙だ',['体当たり','休ませる','水をあげる']]
 ],
 ramen:[
  ['麺が飛んできた',['よける','食べる','見とれる']],
  ['「ニンニク入れますか」',['ヤサイマシ','あとで','無言']],
  ['追いコールが来た',['即答','聞き返す','帰る']],
  ['替え玉流星群',['しゃがむ','受け止める','数える']],
  ['丼を置いた。隙だ',['体当たり','完食','写真']]
 ]
};
// 今日の力：基本40 ＋ 歩いた距離（1kmで6、上限30）＋ ジム（1回8、上限16）＋ ねずみがふつうの体型なら6
export function powerOf({km=0,gym=0,shape='normal'}={}){
 const parts=[['基本',40],['歩いた '+km.toFixed(1)+' km',Math.min(30,Math.round(km*6))],['ジム 今週'+gym+'回',Math.min(16,gym*8)],['ねずみ '+(shape==='normal'?'ふつう':shape==='fat'?'ふっくら':'やせ気味'),shape==='normal'?6:0]];
 return {total:parts.reduce((s,[,v])=>s+v,0),parts:parts.filter(([,v])=>v>0)};
}
// 力が高いほど持ち時間が少し長く、外したときのダメージが軽く、一撃が重い
export function battleRules(power,threshold=48){
 const p=Math.max(30,power);
 const time=0.8+Math.min(.5,p/180);          // 40→1.02倍、60→1.13倍、90→1.3倍
 const miss=Math.min(1.6,threshold/p);       // 相手の基準より力が低いと痛い
 const hit=Math.round(12+p/3);               // 40→25、60→32、90→42（相手のHPは100）
 const windows=[1300,1100,950,850,750].map(w=>Math.round(w*time));
 const missDamage=[20,25,30,35,40].map(d=>Math.round(d*miss));
 return {time,hit,windows,missDamage};
}
export function planBattle(kind,stats,random=Math.random){
 kind=ENEMIES[kind]?kind:'salary';const foe=ENEMIES[kind],power=powerOf(stats),rules=battleRules(power.total,foe.threshold);
 const prompts=PROMPTS[kind].map(([text,options],i)=>{const order=options.map((o,j)=>j);for(let a=order.length-1;a>0;a--){const b=Math.floor(random()*(a+1));[order[a],order[b]]=[order[b],order[a]];}return {text,options:order.map(j=>options[j]),correct:order.indexOf(0),window:rules.windows[i],missDamage:rules.missDamage[i],hitDamage:rules.hit};});
 return {kind,foe:{...foe,kind},power,rules,prompts,hp:100,foeHp:100};
}
// 1つ答えたあとの状態。choice は選んだ番号、-1 は時間切れ
export function applyAnswer(state,prompt,choice){
 const ok=choice===prompt.correct;
 return {...state,hp:ok?state.hp:Math.max(0,state.hp-prompt.missDamage),foeHp:ok?Math.max(0,state.foeHp-prompt.hitDamage):state.foeHp,hits:(state.hits||0)+(ok?1:0),misses:(state.misses||0)+(ok?0:1),late:(state.late||0)+(choice<0?1:0),ok,timedOut:choice<0};
}
export function battleOutcome(state){return state.foeHp<=0?'won':state.hp<=0?'dead':'lost';}
