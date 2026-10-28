import {distance} from './core.js';
export const VISIT_MIN_MS=4*60*1000;
export const AUTO_FREQUENT_DAYS=3;
export const dayKey=t=>new Date(t+9*3600000).toISOString().slice(0,10);
// Conservative stop inference: a known shop within 35 m, accuracy <= 35 m,
// continuous samples no more than 90 s apart. Nearby competing shops are ambiguous.
export function detectShopStop(previous,sample,shops){
 const {point,time,accuracy}=sample;
 if(!Number.isFinite(time)||!Number.isFinite(accuracy)||accuracy>35||accuracy<0)return {candidate:null,visit:null};
 const matches=shops.filter(s=>Array.isArray(s.pos)).map(s=>({id:s.id,d:distance(s.pos,point)})).filter(s=>s.d<=35).sort((a,b)=>a.d-b.d);
 if(!matches.length||(matches[1]&&matches[1].d-matches[0].d<12))return {candidate:null,visit:null};
 const id=matches[0].id;
 if(previous&&time<=previous.last)return {candidate:previous,visit:null};
 const c=previous?.id===id&&time-previous.last<=90000?{...previous,last:time}:{id,start:time,last:time,reported:false};
 if(!c.reported&&time-c.start>=VISIT_MIN_MS){c.reported=true;return {candidate:c,visit:{shopId:id,day:dayKey(time),time,source:'gps'}};}
 return {candidate:c,visit:null};
}
export function mergeVisits(existing,incoming){
 const result=new Map();
 for(const v of [...existing,...incoming]){const key=`${v.shopId}|${v.day}`;const old=result.get(key);if(!old||v.source==='manual')result.set(key,v);}
 return [...result.values()].sort((a,b)=>a.time-b.time);
}
export function visitCount(visits,id){return new Set(visits.filter(v=>v.shopId===id).map(v=>v.day)).size;}
export function frequentShopIds(visits,pinned=[],dismissed=[]){
 const result=new Set(pinned);
 for(const id of new Set(visits.map(v=>v.shopId)))if(visitCount(visits,id)>=AUTO_FREQUENT_DAYS&&!dismissed.includes(id))result.add(id);
 return [...result];
}
export function validVisits(visits){return Array.isArray(visits)&&visits.length<=20000&&visits.every(v=>typeof v.shopId==='string'&&v.shopId.length<160&&/^\d{4}-\d{2}-\d{2}$/.test(v.day)&&Number.isFinite(v.time)&&['gps','manual'].includes(v.source));}
