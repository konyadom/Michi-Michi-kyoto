import {normalizePet,carePet} from './life-core.js?v=e5ad2ae6d30a';
const HOUR=3600000;
export const DEFAULT_MOUSE_NAME='ねずみくん';
const jst=now=>new Date(now+9*HOUR);
export const jstDayOf=now=>jst(now).toISOString().slice(0,10);
// 外から拾ってくるもの
export const CURSED_STONE='変な石';
export const WEIRD_ITEMS=['どんぐり','ボタン','ビー玉','レシートの切れ端','鈴','ピンポン玉','折れた割り箸','輪ゴム','10円玉','おみくじ（凶）','知らない鍵','小さい歯車','靴下の片方','クリップ','飴の包み紙','松ぼっくり','謎のネジ','「牛乳」と書いた付箋','銀杏','消しゴムのかけら','イヤホンの片方','貝殻','ガチャガチャのカプセル','枯れた紅葉','ペットボトルのキャップ','将棋の歩'];
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export function mousePet(value,now=Date.now()){
 const p=normalizePet(value,now);p.species='mouse';
 p.name=typeof value?.name==='string'&&value.name.trim()&&value.name.length<=20?value.name.trim():DEFAULT_MOUSE_NAME;
 const t=value?.travel;
 p.travel={state:['home','away','missing'].includes(t?.state)?t.state:'home',departed:Number.isFinite(t?.departed)?t.departed:0,returnAt:Number.isFinite(t?.returnAt)?t.returnAt:null,nextAt:Number.isFinite(t?.nextAt)?t.nextAt:now+12*HOUR,lastSearch:Number.isFinite(t?.lastSearch)?t.lastSearch:0,trips:Number.isSafeInteger(t?.trips)&&t.trips>=0?t.trips:0};
 p.weight=Number.isFinite(value?.weight)?clamp(value.weight,0,100):50;p.weightAt=Number.isFinite(value?.weightAt)?value.weightAt:now;
 p.finds=Array.isArray(value?.finds)?value.finds.filter(f=>f&&typeof f.item==='string'&&f.item.length<=40&&/^\d{4}-\d{2}-\d{2}$/.test(f.day)).map(f=>({item:f.item,day:f.day,...(f.cursed?{cursed:true}:{})})).slice(-40):[];
 p.soothedAt=Number.isFinite(value?.soothedAt)?value.soothedAt:0;
 p.hopes=value?.hopes&&typeof value.hopes.food==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(value.hopes.day)?{food:value.hopes.food.slice(0,60),day:value.hopes.day}:null;
 p.begging=value?.begging&&typeof value.begging.food==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(value.begging.day)?{food:value.begging.food.slice(0,60),day:value.begging.day}:null;
 p.stoneHidden=typeof value?.stoneHidden==='string'?value.stoneHidden:'';
 p.hiddenUntil=Number.isFinite(value?.hiddenUntil)?value.hiddenUntil:0;
 p.pester={count:Number.isSafeInteger(value?.pester?.count)&&value.pester.count>=0?value.pester.count:0,at:Number.isFinite(value?.pester?.at)?value.pester.at:0};
 return p;
}
// 体型：ごはんで増えて、時間で減る（6時間で1.5）
export function currentWeight(p,now=Date.now()){return clamp(p.weight-Math.max(0,now-p.weightAt)/HOUR/6*1.5,0,100);}
export const mouseShape=w=>w<30?'thin':w>70?'fat':'normal';
export const SHAPE_LABEL={thin:'やせ気味',normal:'ふつう',fat:'ふっくら'};
export function isMouseAsleep(now=Date.now()){const h=jst(now).getUTCHours();return h>=23||h<6;}
// レアで「変な石」。呪われているので、部屋で「戻す」と回避できる
export const pickFind=(random=Math.random)=>random()<.04?CURSED_STONE:WEIRD_ITEMS[Math.floor(random()*WEIRD_ITEMS.length)];
const withFind=(p,item,now)=>isCursed(p)?p:({...p,finds:[...p.finds,{item,day:jstDayOf(now),...(item===CURSED_STONE?{cursed:true}:{})}].slice(-40)});
export const isCursed=p=>p.finds.some(f=>f.cursed);
export function returnStone(value,now=Date.now()){const p=mousePet(value,now);return {...p,finds:p.finds.filter(f=>!f.cursed),stoneHidden:''};}
export function hideStoneWarning(value,now=Date.now()){const p=mousePet(value,now);return {...p,stoneHidden:jstDayOf(now)};}
// 時間ごとに固定の乱数（同じ1時間のあいだは同じ気分でいる）
function seeded(seed){let a=seed>>>0;return()=>{a=(a+0x6D2B79F5)>>>0;let t=a;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return((t^(t>>>14))>>>0)/4294967296;};}
// 威嚇：おなかがすいた／さみしい／外に出たい／理由なし（ランダム）／石のせい
export function mouseMood(p,status,now=Date.now()){
 if(p.travel.state!=='home'||isHiding(p,now))return {angry:false,reason:null};
 const r=seeded(Math.floor(now/3600000)*2654435761^(p.created||0)),cursed=isCursed(p);
 const lastCare=Math.max(0,...Object.values(p.careTimes||{})),sinceCare=lastCare?(now-lastCare)/3600000:999,soothed=now-p.soothedAt<3*3600000;
 if(status.food<15)return {angry:true,reason:'hungry'};
 if(cursed&&r()<.45)return {angry:true,reason:'stone'};
 if(!soothed&&sinceCare>18&&r()<.5)return {angry:true,reason:'lonely'};
 const toOut=p.travel.nextAt-now;if(toOut>0&&toOut<3*3600000&&r()<.5)return {angry:true,reason:'out'};
 if(!soothed&&r()<(cursed?.3:.08))return {angry:true,reason:'none'};
 return {angry:false,reason:null};
}
export const MOOD_TEXT={hungry:'歯をむいている。おなかがすいている。',lonely:'歯をむいている。かまってほしいのかもしれない。',out:'戸のほうを向いて歯をむいている。外に出たいらしい。',none:'歯をむいている。理由はわからない。',stone:'石のほうを見たまま歯をむいている。'};
// しつこくすると：2回で威嚇、4回（3回でも半々）で隠れる、隠れているのにさわる・6回で逃げる
export const isHiding=(p,now=Date.now())=>p.hiddenUntil>now&&p.travel.state==='home';
export function pester(value,now=Date.now(),random=Math.random){
 const p=mousePet(value,now),count=(now-p.pester.at>10*60000?0:p.pester.count)+1;
 let pet={...p,pester:{count,at:now}},level='none';
 if(isHiding(p,now)||count>=6){pet=sendMouse(pet,now,random,true);level='flee';}
 else if(count>=4||(count>=3&&random()<.5)){pet.hiddenUntil=now+(15+Math.floor(random()*16))*60000;level='hide';}
 else if(count>=2)level='angry';
 return {pet,level,count};
}
// 隠れているときにごはん・お水を置くと、少し早く出てくる
export function placeFood(value,now=Date.now()){const p=mousePet(value,now);if(!isHiding(p,now))return p;return {...p,hiddenUntil:Math.min(p.hiddenUntil,now+4*60000)};}
export function soothe(value,now=Date.now()){const p=mousePet(value,now);return {...p,soothedAt:now};}
// ジムに行くと引き締まる
export function slimMouse(value,amount=8,now=Date.now()){const p=mousePet(value,now);return {...p,weight:Math.max(0,currentWeight(p,now)-amount),weightAt:now};}
// おこぼれ・ねだり
export function hopeFor(value,food,now=Date.now()){const p=mousePet(value,now);return {...p,hopes:{food,day:jstDayOf(now)}};}
export function scraps(value,rawEntry,now=Date.now(),random=Math.random){
 const entry={...rawEntry,name:String(rawEntry.name||'').replace(/（[^）]*）/g,'').replace(/\([^)]*\)/g,'').trim()||rawEntry.name};
 const p=mousePet(value,now);if(p.travel.state!=='home')return {pet:p,event:null};
 const burger=/ハンバーガー|バーガー|マクドナルド/.test(entry.name)||String(entry.foodId||'').startsWith('mcd-'),hoping=p.hopes&&p.hopes.day===jstDayOf(now);
 const eat=(amount)=>({...p,food:Math.min(100,p.food+amount),weight:Math.min(100,currentWeight(p,now)+Math.round(amount/4)),weightAt:now,updated:now,hopes:null,begging:null});
 if(burger&&random()<.6)return {pet:eat(12),event:{kind:'crumb',food:entry.name}};
 if(hoping&&entry.meal==='dinner'&&random()<.5)return {pet:eat(8),event:{kind:'scrap',food:entry.name}};
 if(random()<(hoping?.9:.3))return {pet:{...p,begging:{food:entry.name,day:jstDayOf(now)},hopes:null},event:{kind:'beg',food:entry.name}};
 return {pet:{...p,hopes:hoping&&entry.meal!=='dinner'?p.hopes:null},event:null};
}
export function shareFood(value,now=Date.now()){const p=mousePet(value,now);if(!p.begging)return p;return {...p,food:Math.min(100,p.food+8),joy:Math.min(100,p.joy+5),weight:Math.min(100,currentWeight(p,now)+1),weightAt:now,updated:now,begging:null};}
export function sendMouse(value,now=Date.now(),random=Math.random,flee=false){
 const p=mousePet(value,now);if(p.travel.state!=='home')return p;
 if(flee){return {...p,hiddenUntil:0,pester:{count:0,at:now},travel:{...p.travel,state:'away',departed:now,returnAt:now+(1+random()*3)*HOUR,trips:p.travel.trips+1}};}
 const chance=random();p.travel={...p.travel,state:chance<.12?'missing':'away',departed:now,returnAt:chance<.12?null:now+(chance<.35?24+random()*24:.5+random()*3.5)*HOUR,trips:p.travel.trips+1};return p;
}
export function advanceMouse(value,now=Date.now(),random=Math.random){
 let p=mousePet(value,now),event='',item=null;
 if(p.travel.state==='away'&&p.travel.returnAt<=now){p.travel={...p.travel,state:'home',returnAt:null,nextAt:now+(8+random()*16)*HOUR};p.joy=Math.min(100,p.joy+10);p.updated=now;event='return';if(random()<.35){item=pickFind(random);p=withFind(p,item,now);}}
 else if(p.travel.state==='home'&&p.travel.nextAt<=now){p=sendMouse(p,now,random);event='leave';}
 return {pet:p,event,item};
}
export function findMouse(value,now=Date.now(),random=Math.random){
 const p=mousePet(value,now);if(p.travel.state==='home')return {pet:p,result:'home',item:null};
 if(p.travel.lastSearch&&now-p.travel.lastSearch<30*60000)return {pet:p,result:'cooldown',item:null};
 p.travel.lastSearch=now;if(random()<.6){p.travel={...p.travel,state:'home',returnAt:null,nextAt:now+12*HOUR};const item=random()<.3?pickFind(random):null;return {pet:item?withFind(p,item,now):p,result:'found',item};}
 return {pet:p,result:'absent',item:null};
}
// 散歩の道で見つかる：歩いた距離が長いほど見つかりやすい（1.2kmで約63%）
export function returnFromWalk(value,km,now=Date.now(),random=Math.random){
 const p=mousePet(value,now);if(p.travel.state==='home'||!(km>=0.3))return {pet:p,found:false,item:null};
 if(random()>=1-Math.exp(-km/1.2))return {pet:p,found:false,item:null};
 let pet={...p,travel:{...p.travel,state:'home',returnAt:null,nextAt:now+12*HOUR},joy:Math.min(100,p.joy+15),updated:now},item=null;
 if(random()<.6){item=pickFind(random);pet=withFind(pet,item,now);}
 return {pet,found:true,item};
}
export function careMouse(value,kind,candidates,now=Date.now()){
 const p=mousePet(value,now);if(p.travel.state!=='home'||!['feed','water','brush'].includes(kind))return {pet:p,credited:false,unlocked:null};
 const r=carePet(p,kind,candidates,now);let pet={...mousePet(r.pet,now),travel:p.travel,weight:p.weight,weightAt:p.weightAt,finds:p.finds,name:p.name,soothedAt:kind==='brush'?now:p.soothedAt,hopes:p.hopes,begging:p.begging,stoneHidden:p.stoneHidden,hiddenUntil:p.hiddenUntil,pester:p.pester};
 if(kind==='feed'&&r.credited)pet={...pet,weight:Math.min(100,currentWeight(pet,now)+5),weightAt:now};
 return {...r,pet};
}
export function renameMouse(value,name,now=Date.now()){const p=mousePet(value,now);const n=String(name||'').trim();return {...p,name:n&&n.length<=20?n:DEFAULT_MOUSE_NAME};}
export function validMouse(p){const t=p?.travel;return (!t||(typeof t==='object'&&['home','away','missing'].includes(t.state)&&['departed','nextAt','lastSearch','trips'].every(k=>Number.isFinite(t[k])&&t[k]>=0)&&(t.returnAt===null||Number.isFinite(t.returnAt)&&t.returnAt>=0)))&&(p?.name===undefined||typeof p.name==='string'&&p.name.length<=20)&&(p?.weight===undefined||Number.isFinite(p.weight))&&(p?.finds===undefined||Array.isArray(p.finds)&&p.finds.length<=100);}
