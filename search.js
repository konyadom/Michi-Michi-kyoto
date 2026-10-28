export const normalizeSearch=value=>String(value||'').normalize('NFKC').toLowerCase().replace(/[ァ-ヶ]/g,c=>String.fromCharCode(c.charCodeAt(0)-0x60)).replace(/[\s\p{P}\p{S}]/gu,'');
function editDistance(a,b){let row=Array.from({length:b.length+1},(_,i)=>i);for(let i=1;i<=a.length;i++){const next=[i];for(let j=1;j<=b.length;j++)next[j]=Math.min(next[j-1]+1,row[j]+1,row[j-1]+(a[i-1]===b[j-1]?0:1));row=next;}return row[b.length];}
export function placeMatch(place,query){
 const tokens=String(query||'').normalize('NFKC').trim().split(/\s+/).map(normalizeSearch).filter(Boolean);if(!tokens.length)return {score:1,approximate:false};
 const names=[place.title,place.place,...(place.aliases||[])].filter(Boolean).map(normalizeSearch);
 const description=normalizeSearch([place.area,place.address,place.body].join(' '));
 let total=0,approximate=false;
 for(const token of tokens){
  if(names.some(name=>name===token)){total+=120;continue;}
  if(names.some(name=>name.includes(token))){total+=90;continue;}
  if(description.includes(token)){total+=35;continue;}
  if(token.length>=3&&names.some(name=>Math.abs(name.length-token.length)<=2&&editDistance(name,token)<=(token.length>=6?2:1))){total+=20;approximate=true;continue;}
  return (place.searchQueries||[]).some(q=>normalizeSearch(q)===normalizeSearch(query))?{score:10,approximate:true}:{score:0,approximate:false};
 }
 return {score:total,approximate};
}
export function photonPlaces(json,boundaryContains){
 const list=[];
 for(const f of json?.features||[]){const p=f.properties||{},coords=f.geometry?.coordinates,pos=Array.isArray(coords)?[coords[1],coords[0]]:null;const type={N:'node',W:'way',R:'relation'}[p.osm_type];
  if(!type||!Number.isSafeInteger(p.osm_id)||!pos?.every(Number.isFinite)||!boundaryContains(pos)||typeof p.name!=='string')continue;
  const shop=p.osm_key==='shop'||['restaurant','cafe','fast_food','food_court','bar','pub'].includes(p.osm_value);
  const mapKind=({station:'駅',subway_entrance:'駅の出入口',bus_stop:'バス停',platform:'乗り場',taxi:'タクシー乗り場',conference_centre:'会議施設',university:'大学',school:'学校',hospital:'病院',restaurant:'飲食店',cafe:'喫茶店',supermarket:'スーパー',convenience:'コンビニ'})[p.osm_value]||'施設';
  const address=[p.state,p.city,p.district,p.street,p.housenumber].filter(Boolean).join(' ');
  list.push({id:`osm-${type}-${p.osm_id}`,title:p.name,place:p.name,pos,category:shop?'shop':'facility',area:p.district||p.city||'京都府',address,kicker:'地図検索で見つかった場所',summary:`${mapKind} · ${address||'OpenStreetMapの施設情報'}`,body:address||'施設名と位置をOpenStreetMapから取得しました。',source:'OpenStreetMap contributors / Photon',url:`https://www.openstreetmap.org/${type}/${p.osm_id}`,note:'公開地図の登録情報です。営業状況や入口の位置は現地の案内をご確認ください。',external:true});
 }return list;
}
export function validDiscoveredPlaces(list,contains){return Array.isArray(list)&&list.length<=1000&&list.every(p=>p&&typeof p==='object'&&Object.keys(p).every(k=>['id','title','place','pos','category','area','address','kicker','summary','body','source','url','note','external','searchQueries','aliases'].includes(k))&&(!p.searchQueries||(Array.isArray(p.searchQueries)&&p.searchQueries.every(q=>typeof q==='string'&&q.length<300)))&&/^osm-(node|way|relation)-\d+$/.test(p.id)&&typeof p.title==='string'&&p.title.length<300&&typeof p.body==='string'&&p.body.length<3000&&Array.isArray(p.pos)&&p.pos.length===2&&p.pos.every(Number.isFinite)&&contains(p.pos)&&['shop','facility'].includes(p.category)&&/^https:\/\/www\.openstreetmap\.org\/(node|way|relation)\/\d+$/.test(p.url)&&(!p.aliases||(Array.isArray(p.aliases)&&p.aliases.every(a=>typeof a==='string'&&a.length<300))));}
