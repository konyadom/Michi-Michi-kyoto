export function autoTrackId(time){return 'auto-'+new Date(time+9*3600000).toISOString().slice(0,10);}
export function autoTrackName(time){return new Date(time).toLocaleDateString('ja-JP',{timeZone:'Asia/Tokyo',month:'numeric',day:'numeric'})+' の自動記録';}
export function commitAutoWalk(walks,session,now=Date.now()){
 if(!session?.auto||session.points.length<2)return walks;
 const entry={id:session.id,name:autoTrackName(session.started),mode:'walk',date:new Date(session.started).toISOString(),points:session.points.map(p=>p.slice()),source:'gps',automatic:true,memberId:'gin',duration:Math.max(0,now-session.started)};
 const i=walks.findIndex(w=>w.id===entry.id);return i<0?[...walks,entry]:walks.map((w,n)=>n===i?entry:w);
}
export function resumeAutoWalk(walks,now=Date.now()){
 const id=autoTrackId(now),old=walks.find(w=>w.id===id);return {id,auto:true,source:'gps',shopStops:[],points:old?.points.map(p=>p.slice())||[],started:old?Date.parse(old.date):now,paused:false,status:'位置情報を確認しています…'};
}
