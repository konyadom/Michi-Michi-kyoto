// 帰宅の「おつかれさま！」と、夜の流れ（お風呂 → ご飯 → ゆっくり）、電気毛布チャレンジ。
import {distance} from './core.js';
export const HOME_RADIUS=90,AWAY_RADIUS=450;
export const EVENING_STEPS=[['bath','お風呂','あたたまる'],['meal','ご飯','食べる'],['relax','ゆっくり','休む']];
export const COLD_CHECKS=[['blanket','毛布、持ってきた？'],['socks','靴下を履こう'],['drink','あたたかい飲みもの']];
export const freshEvening=(day='')=>({day,cameHome:null,dismissed:false,steps:{},source:''});
export function normalizeEvening(v,day){
 if(!v||typeof v!=='object'||v.day!==day)return freshEvening(day);
 const steps={};for(const [k] of EVENING_STEPS)if(v.steps?.[k])steps[k]=true;
 return {day,cameHome:Number.isFinite(v.cameHome)?v.cameHome:null,dismissed:!!v.dismissed,steps,source:['gps','tap','auto'].includes(v.source)?v.source:''};
}
export function normalizeBlanket(v){
 const out={};const nights=v&&typeof v.nights==='object'&&v.nights?v.nights:{};
 for(const [d,n] of Object.entries(nights))if(/^\d{4}-\d{2}-\d{2}$/.test(d)&&n&&typeof n==='object'){const row={temp:Number.isFinite(n.temp)?n.temp:null};for(const [k] of COLD_CHECKS)if(n[k])row[k]=true;if(n.level==='弱'||n.level==='中'||n.level==='強')row.blanket=true;out[d]=row;}
 return {nights:out};
}
const shift=(day,n)=>new Date(Date.parse(day+'T00:00:00Z')+n*86400000).toISOString().slice(0,10);
export function blanketStreak(blanket,day){const has=d=>!!blanket.nights[d]?.blanket;let n=0,d=has(day)?day:shift(day,-1);while(has(d)){n++;d=shift(d,-1);}return n;}
export function coldestNight(blanket){let best=null;for(const [d,n] of Object.entries(blanket.nights))if(Number.isFinite(n.temp)&&(!best||n.temp<best.temp))best={day:d,temp:n.temp};return best;}
export const isEveningHour=hour=>hour>=16||hour<4;
// 開いたときに自動で声をかける条件：夕方以降・今日まだ声をかけていない・今日どこかへ歩いている
export function shouldGreet(ev,walkedToday,hour){return hour>=17&&!ev.cameHome&&!ev.dismissed&&walkedToday;}
// GPSで「家から離れたあと、家に戻った」を検知
export function createHomecoming({home,onHome}){
 let away=false;
 return {observe(point,now=Date.now()){const d=distance(point,home());if(d>AWAY_RADIUS)away=true;else if(d<HOME_RADIUS&&away){away=false;onHome(now);}},isAway:()=>away};
}
export function blanketMarkup({blanket,day,tonight,esc,compact=false}){
 const night=blanket.nights[day]||{},streak=blanketStreak(blanket,day),cold=coldestNight(blanket);
 const temp=Number.isFinite(tonight)?'今夜の岩倉 '+esc(tonight)+'°':'今夜の気温は取得中';
 const checks='<div class="cold-checks">'+COLD_CHECKS.map(([k,label])=>'<button data-cold="'+k+'" aria-pressed="'+!!night[k]+'"><i>'+(night[k]?'✓':'')+'</i>'+label+'</button>').join('')+'</div>';
 const stats='<small class="blanket-stats">'+(streak?'毛布 '+streak+'夜連続':'')+(cold?(streak?' · ':'')+'いちばん寒かった夜 '+esc(cold.temp)+'°（'+cold.day.slice(5).replace('-','/')+'）':'')+'</small>';
 if(compact)return '<div class="blanket-mini"><span class="eyebrow">電気毛布チャレンジ</span><strong>'+temp+'</strong>'+checks+stats+'</div>';
 return '<div class="blanket-corner"><div class="blanket-head"><span class="eyebrow">電気毛布チャレンジ</span><strong>'+temp+'</strong><small>明け方の予報</small></div>'+checks+stats+'</div>';
}
export function eveningMarkup({ev,blanket,day,time,tonight,kmToday,esc}){
 const done=k=>!!ev.steps[k],allDone=EVENING_STEPS.every(([k])=>done(k));
 return '<section class="welcome-card'+(allDone?' welcome-done':'')+'" aria-label="おかえりなさい"><div class="welcome-head"><span class="eyebrow">おかえりなさい · '+esc(time)+'</span><button class="text-btn" data-evening-dismiss aria-label="おかえりの表示を閉じる">閉じる</button></div><h2>おつかれさま！</h2><p>'+(kmToday>0?'今日は '+esc(kmToday.toFixed(1))+' km 歩いた。':'')+(allDone?'全部済んだ。':'お風呂、ご飯、それからゆっくりしよう。')+'</p><div class="evening-steps">'+EVENING_STEPS.map(([k,label,hint],i)=>'<button data-evening-step="'+k+'" aria-pressed="'+done(k)+'"><span class="step-no">'+(done(k)?'✓':i+1)+'</span><strong>'+label+'</strong><small>'+hint+'</small></button>').join('')+'</div>'+(done('meal')?'':'<button class="text-btn evening-dinner" data-meal-open="dinner">晩ごはんを記録</button>')+blanketMarkup({blanket,day,tonight,esc})+'</section>';
}
