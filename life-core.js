export const CARE_COOLDOWN=4*60*60*1000;
export function freshPet(now=Date.now()){return {name:'やぎべえ',created:now,updated:now,food:70,water:70,joy:75,careCount:0,careTimes:{},careDays:[],paperCount:0,unlocked:[]};}
export function normalizePet(value,now=Date.now()){
 const p=freshPet(now);if(!value||typeof value!=='object'||Array.isArray(value))return p;
 for(const k of ['food','water','joy'])if(Number.isFinite(value[k]))p[k]=Math.max(0,Math.min(100,value[k]));
 for(const k of ['created','updated','careCount','paperCount'])if(Number.isSafeInteger(value[k])&&value[k]>=0)p[k]=value[k];
 for(const k of ['feed','water','brush','paper'])if(Number.isFinite(value.careTimes?.[k]))p.careTimes[k]=Math.max(0,value.careTimes[k]);
 p.careDays=Array.isArray(value.careDays)?[...new Set(value.careDays.filter(s=>typeof s==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(s)))].slice(-500):[];
 p.unlocked=Array.isArray(value.unlocked)?[...new Set(value.unlocked.filter(s=>typeof s==='string'&&s.length<100))].slice(-50):[];
 return p;
}
export function petStatus(p,now=Date.now()){const hours=Math.max(0,now-p.updated)/3600000;return {food:Math.max(0,Math.round(p.food-hours*2)),water:Math.max(0,Math.round(p.water-hours*2.5)),joy:Math.max(0,Math.round(p.joy-hours))};}
export function carePet(original,kind,candidates,now=Date.now()){
 const p=normalizePet(original,now);if(!['feed','water','brush','paper'].includes(kind))return {pet:p,credited:false,unlocked:null};
 const ready=!p.careTimes[kind]||now-p.careTimes[kind]>=CARE_COOLDOWN;const mood=petStatus(p,now);Object.assign(p,mood,{updated:now});
 if(kind==='paper')p.paperCount++;
 if(!ready)return {pet:p,credited:false,unlocked:null};
 p.careTimes[kind]=now;p.careCount++;const date=new Date(now+9*3600000).toISOString().slice(0,10);if(!p.careDays.includes(date))p.careDays.push(date);
 if(kind==='feed')p.food=Math.min(100,p.food+35);if(kind==='water')p.water=Math.min(100,p.water+40);if(kind==='brush'||kind==='paper')p.joy=Math.min(100,p.joy+30);
 let unlocked=null;if(p.careCount%3===0){unlocked=candidates.find(id=>!p.unlocked.includes(id))||null;if(unlocked)p.unlocked.push(unlocked);}
 return {pet:p,credited:true,unlocked};
}
export function validPet(p){if(!p||typeof p!=='object'||Array.isArray(p))return false;return ['careCount','paperCount','created','updated'].every(k=>Number.isSafeInteger(p[k])&&p[k]>=0)&&['food','water','joy'].every(k=>Number.isFinite(p[k])&&p[k]>=0&&p[k]<=100)&&Array.isArray(p.unlocked)&&p.unlocked.length<=50&&p.unlocked.every(x=>typeof x==='string'&&x.length<100);}
export function eventPhase(e,now=Date.now()){const start=Date.parse(e.start),end=Date.parse(e.end);if(now>end)return 'ended';return now>=start?'active':'upcoming';}
export function makeEventIcs(e){const escape=s=>String(s).replace(/\\/g,'\\\\').replace(/\n/g,'\\n').replace(/,/g,'\\,').replace(/;/g,'\\;');const stamp=s=>new Date(s).toISOString().replace(/[-:]/g,'').replace(/\.\d{3}/,'');return ['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Michishirube//Kyoto//JA','BEGIN:VEVENT','UID:'+escape(e.id)+'@michishirube.local','DTSTAMP:'+stamp(new Date()),'DTSTART:'+stamp(e.calendarStart||e.start),'DTEND:'+stamp(e.calendarEnd||e.end),...(e.rrule?['RRULE:'+e.rrule]:[]),...(e.exclude?.length?['EXDATE:'+e.exclude.join(',')]:[]),'SUMMARY:'+escape(e.title),'LOCATION:'+escape(e.location),'DESCRIPTION:'+escape(e.summary+'\n'+e.url),'URL:'+e.url,'BEGIN:VALARM','TRIGGER:-PT1H','ACTION:DISPLAY','DESCRIPTION:'+escape(e.title),'END:VALARM','END:VEVENT','END:VCALENDAR',''].map(foldIcs).join('\r\n');}

function foldIcs(line){let out='',part='',bytes=0;for(const char of line){const size=new TextEncoder().encode(char).length;if(bytes+size>74){out+=part+'\r\n ';part='';bytes=1;}part+=char;bytes+=size;}return out+part;}
