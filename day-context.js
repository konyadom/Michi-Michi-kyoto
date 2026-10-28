import {jstDay} from './anniversaries.js';
import {EATING_HABITS,USUAL_FOODS} from './household.js';
import {nutritionPeriod,nutrientGaps,gapSummary} from './nutrition-core.js';
export const WEATHER_URL='https://api.open-meteo.com/v1/forecast?latitude=35.07&longitude=135.78&current=temperature_2m,apparent_temperature,is_day,precipitation,weather_code&daily=temperature_2m_min&timezone=Asia%2FTokyo&forecast_days=2';
export const WEATHER_TTL=15*60*1000;
export const DINNER_TITLE='今日の晩御飯はどうしようか？';
export function japanClock(now=Date.now()){
 const d=new Date(now+9*3600000),hour=d.getUTCHours(),minute=d.getUTCMinutes();
 return {day:jstDay(now),hour,time:String(hour).padStart(2,'0')+':'+String(minute).padStart(2,'0'),date:(d.getUTCMonth()+1)+'月'+d.getUTCDate()+'日（'+'日月火水木金土'[d.getUTCDay()]+'）'};
}
// 時間帯ごとの声かけ。朝は軽め、19時を過ぎて晩ごはんが未記録なら「どうしようか？」の相談モードになる。
export function mealPrompt(entries=[],now=Date.now(),habits=EATING_HABITS){
 const clock=japanClock(now),meal=clock.hour>=5&&clock.hour<11?'breakfast':clock.hour>=11&&clock.hour<16?'lunch':clock.hour>=16?'dinner':'snack';
 const label={breakfast:'朝ごはん',lunch:'昼ごはん',dinner:'晩ごはん',snack:'夜の食事'}[meal];
 const rows=entries.filter(e=>e.day===clock.day&&e.status==='ate'&&e.meal===meal);
 const recorded=rows.length>0,decide=meal==='dinner'&&!recorded&&clock.hour>=habits.dinnerPromptHour;
 let title,body;
 if(recorded){title=label+'は記録済み';body=rows.map(e=>e.name).join('・');}
 else if(decide){title=DINNER_TITLE;body='どんなパスタ？得意の'+habits.specialty+'？';}
 else if(meal==='breakfast'&&habits.lightBreakfast){title='朝ごはん（軽めでOK）';body='ジュースだけなら下から1タップ。';}
 else if(meal==='dinner'){title='晩ごはんは何を食べた？';body='まだなら'+habits.dinnerPromptHour+'時に候補を出す。';}
 else if(meal==='snack'){title='夜に食べたものはある？';body='なければ記録なしでOK。';}
 else{title=label+'は何を食べた？';body='いつものものなら下から選べます。';}
 return {...clock,meal,label,key:clock.day+'-'+meal,recorded,decide,title,body,usual:USUAL_FOODS[meal]||[]};
}
// 今日ここまでの記録から、晩ごはんの候補を並べる（足りない栄養を補えるものを先に）。
export function dinnerIdeas(nutrition,now=Date.now()){
 const r=nutritionPeriod(nutrition,jstDay(now),false),g=nutrientGaps(r,nutrition.activity),sum=gapSummary(g,3),low=new Set(sum.keys),ideas=[];
 if(['protein','zinc','vitB6','vitB12','iron'].some(k=>low.has(k)))ideas.push(['gin-grilled-chicken-plate','鶏を焼く']);
 if(['fiber','vitA','folate','vitC'].some(k=>low.has(k)))ideas.push(['gin-vegetable-soup','野菜スープ']);
 if(low.has('vitC'))ideas.push(['gin-apple-celery-juice','りんごとセロリのジュース']);
 ideas.push(['gin-peperoncino','得意のペペロンチーノ'],['gin-tomato-pasta','トマトのパスタ'],['gin-rice-bowl','ご飯とおかず'],['gin-grilled-chicken-plate','鶏を焼く']);
 const seen=new Set(),unique=ideas.filter(([id])=>!seen.has(id)&&seen.add(id)).slice(0,4);
 return {text:g.empty?'今日の記録はまだない。昼までを記録すると、足りない栄養から候補を出す。':sum.text+(sum.keys.length?'。補えるものから順。':''),ideas:unique,empty:g.empty};
}
export function weatherLabel(code,isDay=true){
 if(code===0)return {symbol:isDay?'☀️':'🌙',label:'快晴'};
 if([1,2].includes(code))return {symbol:isDay?'🌤️':'🌙',label:'晴れ時々くもり'};
 if(code===3)return {symbol:'☁️',label:'くもり'};
 if([45,48].includes(code))return {symbol:'🌫️',label:'霧'};
 if([51,53,55,56,57].includes(code))return {symbol:'🌧️',label:'霧雨'};
 if([61,63,65,66,67,80,81,82].includes(code))return {symbol:'🌧️',label:'雨'};
 if([71,73,75,77,85,86].includes(code))return {symbol:'🌨️',label:'雪'};
 if([95,96,99].includes(code))return {symbol:'⛈️',label:'雷雨'};
 return {symbol:'',label:'天気不明'};
}
export function parseWeather(payload,now=Date.now()){
 const c=payload?.current,stamp=typeof c?.time==='string'?Date.parse(c.time+'+09:00'):NaN;
 if(!c||!Number.isFinite(c.temperature_2m)||c.temperature_2m< -60||c.temperature_2m>60||!Number.isFinite(c.weather_code)||!Number.isFinite(stamp)||Math.abs(now-stamp)>2*3600000)throw Error('現在の天気を確認できません');
 const mins=payload.daily?.temperature_2m_min,tonightMin=Array.isArray(mins)&&Number.isFinite(mins[1])?mins[1]:Array.isArray(mins)&&Number.isFinite(mins[0])?mins[0]:null;
 return {temperature:c.temperature_2m,feels:Number.isFinite(c.apparent_temperature)?c.apparent_temperature:null,code:c.weather_code,isDay:c.is_day===1,forecastAt:stamp,fetchedAt:now,tonightMin};
}
export function weatherHint(weather,now=Date.now()){
 if(!weather||now-weather.fetchedAt>WEATHER_TTL)return '';
 if([51,53,55,56,57,61,63,65,66,67,80,81,82].includes(weather.code))return '岩倉は雨の予報。出かけるなら傘を。';
 if(weather.temperature>=28)return '暑い時間帯。水分も忘れずに。';
 if(weather.temperature<=12)return '外は冷えています。温かい飲みものもどうぞ。';
 return '';
}
// 通知の状態。iPhoneはホーム画面に追加した画面でだけ Notification が使える。
export function notifyState(){if(typeof Notification==='undefined')return 'unsupported';return Notification.permission;}
export function installDayContext({getNutrition,esc,toast=()=>{},getEvening=()=>({markup:'',dock:null}),onDinnerPrompt=()=>{},onPlan=()=>{}}){
 let weather=null,busy=false,lastAttempt=0,dismissed='',plan=null,notifiedDay='',belledDay='',belledTries=0;
 try{dismissed=sessionStorage.getItem('michishirube-meal-later')||'';}catch{}
 try{plan=JSON.parse(localStorage.getItem('michishirube-dinner-plan')||'null');notifiedDay=localStorage.getItem('michishirube-dinner-notified')||'';}catch{}
 const foodName=id=>{for(const list of Object.values(USUAL_FOODS))for(const [fid,label] of list)if(fid===id)return label.replace(/^\S+\s/,'');return {'gin-tomato-pasta':'トマトのパスタ','gin-apple-celery-juice':'りんごとセロリのジュース'}[id]||'決めたもの';};
 function weatherMarkup(){const w=weather&&Date.now()-weather.fetchedAt<=WEATHER_TTL?weather:null;const summary=w?weatherLabel(w.code,w.isDay):null;
  return '<div class="today-weather"><span class="weather-symbol" aria-hidden="true">'+(summary?.symbol||'◌')+'</span><div><strong>'+(w?esc(w.temperature)+'° <small>'+summary.label+'</small>':busy?'天気を確認中…':'天気を取得できません')+'</strong><small>岩倉'+(w?' · '+japanClock(w.forecastAt).time+'の予報値':'')+'</small></div><button data-weather-refresh aria-label="天気を更新" '+(busy?'disabled':'')+'>↻</button></div>';
 }
 function usualButtons(p){return '<div class="usual-foods">'+p.usual.map(([id,label])=>'<button data-meal-food="'+esc(id)+'">'+esc(label)+'</button>').join('')+'<button data-meal-open="'+p.meal+'">ほかのもの</button></div>';}
 function dinnerMarkup(p){const n=getNutrition(),today=plan&&plan.day===p.day?plan:null;
  if(today)return '<div class="today-question"><strong>今夜は'+esc(foodName(today.id))+'</strong><button data-dinner-plan="" aria-label="晩ごはんの予定を変える">変える</button></div><p class="today-food-note">食べたら記録する。</p><div class="usual-foods dinner-ideas"><button data-meal-food="'+esc(today.id)+'">記録する</button><button data-meal-open="dinner">ほかのもの</button></div>';
  const d=dinnerIdeas(n);
  return '<div class="today-question"><strong>'+esc(p.title)+'</strong><button data-meal-later aria-label="食事の声かけをあとでにする">あとで</button></div><p class="dinner-ask">'+esc(p.body)+'</p><p class="today-food-note dinner-note">'+esc(d.text)+'</p><div class="usual-foods dinner-ideas">'+d.ideas.map(([id,label])=>'<button data-dinner-plan="'+esc(id)+'">'+esc(label)+'</button>').join('')+'<button data-meal-open="dinner">食べたものを記録</button></div>';
 }
 function notifyMarkup(){const st=notifyState();return '<div class="dinner-notify"><span>'+(st==='granted'?'19時の通知：オン':st==='denied'?'通知はブラウザ設定で拒否中':st==='unsupported'?'通知：ホーム画面に追加した画面で設定できます':'アプリを開いているとき19時に通知')+'</span>'+(st==='default'?'<button data-notify-dinner>オンにする</button>':'')+'<a href="dinner-reminder.ics">カレンダーに毎日19時 ↗</a></div>';}
 function markup(){const p=mealPrompt(getNutrition().entries),skip=dismissed===p.key,hint=weatherHint(weather),evening=getEvening();
  const food=skip?'<button class="text-btn" data-meal-open="'+p.meal+'">食べたものを記録する →</button>':p.decide?dinnerMarkup(p):'<div class="today-question"><strong>'+esc(p.title)+'</strong>'+(p.recorded?'':'<button data-meal-later aria-label="食事の声かけをあとでにする">あとで</button>')+'</div><p class="today-food-note">'+esc(p.body)+'</p>'+usualButtons(p);
  return (evening.markup||'')+'<section class="today-card'+(p.decide&&!skip?' dinner-time':'')+'" aria-label="時刻と天気と食事"><div class="today-top"><div class="today-clock"><time>'+p.time+'</time><span>'+p.date+' · 日本時間</span></div>'+weatherMarkup()+'</div><div class="today-food">'+food+(hint?'<p class="weather-hint">'+esc(hint)+'</p>':'')+(p.meal==='dinner'?notifyMarkup():'')+(p.meal==='dinner'&&!evening.greeted?'<div class="tadaima-row"><span>家に着いたら</span><button data-action="tadaima">ただいま</button></div>':'')+'</div><small class="weather-credit">天気：<a href="https://open-meteo.com/" target="_blank" rel="noopener noreferrer">Open-Meteo</a> · 岩倉の地域予報</small></section>';}
 function paint(){const header=document.querySelector('[data-header-clock]'),c=japanClock();if(header){header.textContent=c.time;header.title=c.date+' 日本時間';}const host=document.querySelector('[data-day-context]');if(host)host.innerHTML=markup();const dock=document.querySelector('#mobile-sidebar');if(dock){const p=mealPrompt(getNutrition().entries),w=weather&&Date.now()-weather.fetchedAt<=WEATHER_TTL?weather:null,today=plan&&plan.day===p.day&&p.meal==='dinner'&&!p.recorded;const ev=getEvening();dock.querySelector('strong').textContent=ev.dock?ev.dock.title:dismissed===p.key?'睦荘のホーム':today?'今夜は'+foodName(plan.id)+'。食べたら記録':p.title;dock.querySelector('small').textContent=ev.dock?ev.dock.sub:p.decide&&!today?'どんなパスタ？得意のペペロンチーノ？':w?'岩倉 '+w.temperature+'° · '+weatherLabel(w.code,w.isDay).label+' · ホームへ':'食事と今日の天気 · ホームへ';}maybeNotify();}
 async function showNotification(title,body){const options={body,tag:'michishirube-dinner',icon:'icon-192.png',badge:'icon-192.png',lang:'ja',data:{url:'./#home'}};try{const reg=await navigator.serviceWorker?.getRegistration();if(reg?.showNotification){await reg.showNotification(title,options);return true;}}catch{}try{new Notification(title,options);return true;}catch{return false;}}
 // 開いたままの画面が裏に回っていても、19時を過ぎたら一度だけ通知する（閉じているときはカレンダーの通知が担当）。
 function maybeNotify(){const p=mealPrompt(getNutrition().entries);if(p.decide&&belledDay!==p.day&&!document.hidden){if(onDinnerPrompt()===true||++belledTries>10){belledDay=p.day;belledTries=0;}}if(!p.decide||notifiedDay===p.day||notifyState()!=='granted'||!document.hidden)return;notifiedDay=p.day;try{localStorage.setItem('michishirube-dinner-notified',notifiedDay);}catch{}const d=dinnerIdeas(getNutrition());showNotification(DINNER_TITLE,'どんなパスタ？得意のペペロンチーノ？'+(d.empty?'':' '+d.text));}
 async function enableNotify(){const st=notifyState();if(st==='unsupported'){toast('このブラウザでは通知を使えません。iPhoneはSafariの共有メニューから「ホーム画面に追加」し、その画面で設定してください。');return;}if(st==='denied'){toast('通知はブラウザの設定で拒否されています。設定から許可に変えると使えます。');return;}let r=st;if(st==='default'){try{r=await Notification.requestPermission();}catch{r='denied';}}paint();if(r==='granted'){const ok=await showNotification('通知をオンにしました','19時を過ぎて晩ごはんが未記録なら、ここに「今日の晩御飯はどうしようか？」と出します。');toast(ok?'通知をオンにした。開いたままなら19時に届く。':'通知を表示できなかった。ホーム画面に追加した画面で試してください。');}else toast('通知は許可されませんでした。');}
 async function refresh(force=false){if(busy||!force&&Date.now()-lastAttempt<WEATHER_TTL)return;lastAttempt=Date.now();busy=true;paint();const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),10000);try{const response=await fetch(WEATHER_URL,{signal:controller.signal,credentials:'omit'});if(!response.ok)throw Error();weather=parseWeather(await response.json());}catch{}finally{busy=false;clearTimeout(timer);paint();}}
 document.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;if(b.hasAttribute('data-weather-refresh'))refresh(true);if(b.hasAttribute('data-meal-later')){dismissed=mealPrompt(getNutrition().entries).key;try{sessionStorage.setItem('michishirube-meal-later',dismissed);}catch{}paint();}if(b.hasAttribute('data-dinner-plan')){const id=b.dataset.dinnerPlan;plan=id?{id,day:jstDay()}:null;try{if(plan)localStorage.setItem('michishirube-dinner-plan',JSON.stringify(plan));else localStorage.removeItem('michishirube-dinner-plan');}catch{}paint();if(plan){onPlan(foodName(id));toast('今夜は'+foodName(id));}}if(b.hasAttribute('data-notify-dinner'))enableNotify();});
 setInterval(()=>{paint();if(!document.hidden&&Date.now()-lastAttempt>=WEATHER_TTL)refresh();},30000);
 document.addEventListener('visibilitychange',()=>{paint();if(!document.hidden)refresh();});
 if('serviceWorker' in navigator){try{navigator.serviceWorker.register('sw.js').catch(()=>{});}catch{}}
 paint();refresh();return {markup,paint,enableNotify,notifyState,getWeather:()=>weather&&Date.now()-weather.fetchedAt<=6*3600000?weather:null};
}
