// Canvas vector basemap. Only roads, water, selected place names and flat landcover.
// GSI's contours, elevation markers and terrain symbols are never drawn.
const P=globalThis.protomapsL;
const width=(stops)=>(z)=>{const x=z-1;for(let i=1;i<stops.length;i++){if(x<=stops[i][0]){const[a,b]=stops[i-1],[c,d]=stops[i];return b+(d-b)*Math.max(0,(x-a)/(c-a));}}return stops.at(-1)[1];};
const flags=(z,f)=>z<18?(f.props.vt_flag17===undefined||[0,1].includes(f.props.vt_flag17)):[1,2].includes(f.props.vt_flag17);
const motorway=f=>f.props.vt_rdctg==='高速自動車国道等'||f.props.vt_motorway===1;
const major=f=>['国道','都道府県道','主要道路'].includes(f.props.vt_rdctg)&&!motorway(f);
const path=f=>[2721,2722,2723,2724,2731,2732].includes(f.props.vt_code);
const minor=f=>!motorway(f)&&!major(f)&&!path(f);
function line(layer,color,stops,filter=()=>true,minzoom=8,extra={}){
 return {dataLayer:layer,minzoom,filter:(z,f)=>flags(z,f)&&filter(f),symbolizer:new P.LineSymbolizer({color,width:width(stops),...extra})};
}
function label(codes,minzoom,size,fill){return {dataLayer:'Anno',minzoom,
 filter:(z,f)=>flags(z,f)&&f.geomType===1&&codes.includes(f.props.vt_code)&&!!f.props.vt_text,
 symbolizer:new P.CenteredTextSymbolizer({labelProps:['vt_text'],font:`500 ${size}px sans-serif`,fill,stroke:'#fff',width:2,padding:10,maxLineChars:18})};}
export const paintRules=[
 {dataLayer:'WA',symbolizer:new P.PolygonSymbolizer({fill:'#afd7e5'})},
 line('RvrCL','#afd7e5',[[8,.8],[12,2],[15,4],[17,8]]),
 line('RdCL','#aebcaf',[[13,.8],[16,1.4],[17,2.2]],path,14,{dash:[2,2]}),
 line('RdCL','#cbd1d6',[[11,.6],[13,1.8],[14,3.5],[15,6.6],[16,11],[17,18]],minor,12),
 line('RdCL','#fff',[[11,.2],[13,.7],[14,2],[15,4.8],[16,9],[17,15.5]],minor,12),
 line('RdCL','#d3ccb5',[[8,.8],[11,2],[13,4],[15,9.5],[17,23]],major),
 line('RdCL','#fff3c4',[[8,.4],[11,1.1],[13,2.6],[15,7.3],[17,20]],major),
 line('RailCL','#fff',[[9,1],[13,2.6],[16,4]]),
 line('RailCL','#89939d',[[9,.7],[13,1.2],[16,2]]),
 line('RdCL','#7697ad',[[8,1.2],[11,3.2],[13,5.5],[15,10],[17,24]],motorway),
 line('RdCL','#9ab8cb',[[8,.7],[11,2],[13,4],[15,7.8],[17,21]],motorway)
];
export const labelRules=[
 label([422],12,13,'#42718b'),
 label([311,312,313,314,315,316,333,810],10,13,'#527459'),
 label([110,140],9,16,'#626a70'),
 label([210,220,800],14,12,'#747c82'),
 label([321,322,820],12,12,'#56889b'),
 label([534,870],14,12,'#5b7d59'),
 label([661,662,532],16,11,'#7c8079'),
 label([411],14,11,'#7b8084'),
 {dataLayer:'Anno',minzoom:14,filter:(z,f)=>flags(z,f)&&f.geomType===2&&f.props.vt_code===411,
  symbolizer:new P.LineLabelSymbolizer({labelProps:['vt_text'],font:'11px sans-serif',fill:'#7b8084',stroke:'#fff',width:2,repeatDistance:350})}
];
export function installBasemap(map,onError,onLoad){
 const layer=P.leafletLayer({url:'https://cyberjapandata.gsi.go.jp/xyz/optimal_bvmap-v1/optimal_bvmap-v1.pmtiles',
  levelDiff:1,maxDataZoom:16,paintRules,labelRules,backgroundColor:'transparent',attribution:'',noWrap:true,bounds:[[20,122],[46,154]],maxZoom:18});
 // Protomaps intentionally paints an empty tile on fetch errors; surface them in our UI.
 for(const view of layer.views.values()){
  const get=view.getDisplayTile.bind(view);
  view.getDisplayTile=async(...args)=>{try{const tile=await get(...args);onLoad();return tile;}catch(error){if(error.name!=='AbortError')onError();throw error;}};
 }
 layer.addTo(map);
 return layer;
}
export async function installGreen(map,onError){
 map.createPane('flatGreen');map.getPane('flatGreen').style.zIndex=190;map.getPane('flatGreen').style.pointerEvents='none';
 const renderer=L.canvas({pane:'flatGreen',padding:.3});
 const cache=new Map(),pending=new Set();let allowed;
 try{const res=await fetch('green-index.json');if(!res.ok)throw Error();allowed=new Set(await res.json());}catch{onError();return;}
 const wanted=()=>{if(map.getZoom()<13)return new Set(['overview']);const b=map.getBounds().pad(.15),keys=new Set();
  for(let lat=Math.floor(b.getSouth()*10);lat<=Math.floor(b.getNorth()*10);lat++)for(let lon=Math.floor(b.getWest()*10);lon<=Math.floor(b.getEast()*10);lon++){const key=`${lat}-${lon}`;if(allowed.has(key))keys.add(key);}return keys;};
 async function update(){const keys=wanted();for(const[k,l]of cache){if(keys.has(k)){if(!map.hasLayer(l))l.addTo(map);}else map.removeLayer(l);}
  await Promise.all([...keys].filter(k=>!cache.has(k)&&!pending.has(k)).map(async key=>{pending.add(key);try{const r=await fetch(`green-${key}.geojson`);if(!r.ok)throw Error();const geo=await r.json();const layer=L.geoJSON(geo,{renderer,interactive:false,style:{stroke:false,fillColor:'#d7e8d4',fillOpacity:1}});cache.set(key,layer);if(wanted().has(key))layer.addTo(map);}catch{onError();}finally{pending.delete(key);}}));
  // Keep at most 24 off-screen chunks cached on mobile.
  const current=wanted();if(cache.size>24)for(const[k,l]of cache){if(cache.size<=24)break;if(!current.has(k)){map.removeLayer(l);cache.delete(k);}}
 }
 map.on('moveend',update);await update();
}
