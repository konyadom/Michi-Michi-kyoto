import {jstDay,validDate} from './anniversaries.js?v=e5ad2ae6d30a';
export const DRI_URL='https://www.mhlw.go.jp/web/t_doc?dataId=78ab4652';
export const MEXT_URL='https://www.mext.go.jp/a_menu/syokuhinseibun/mext_00001.html';
// DRI 2025, male 18–29 years. RDA/AI/DG are intentionally distinct.
export const NUTRIENTS={
 energy:{label:'エネルギー',unit:'kcal',type:'EER',target:2600},protein:{label:'たんぱく質',unit:'g',type:'RDA',target:65},fat:{label:'脂質',unit:'g',type:'ratio',range:[20,30],factor:9},carb:{label:'炭水化物',unit:'g',type:'ratio',range:[50,65],factor:4},salt:{label:'食塩相当量',unit:'g',type:'DGmax',target:7.5},fiber:{label:'食物繊維',unit:'g',type:'DGmin',target:20},saturated:{label:'飽和脂肪酸',unit:'g',type:'ratioMax',range:[0,7],factor:9},calcium:{label:'カルシウム',unit:'mg',type:'RDA',target:800},iron:{label:'鉄',unit:'mg',type:'RDA',target:7},zinc:{label:'亜鉛',unit:'mg',type:'RDA',target:9},vitA:{label:'ビタミンA',unit:'µgRAE',type:'RDA',target:850},vitD:{label:'ビタミンD',unit:'µg',type:'AI',target:9},vitE:{label:'ビタミンE',unit:'mg',type:'AI',target:6.5},vitB1:{label:'ビタミンB1',unit:'mg',type:'RDA',target:1.1},vitB2:{label:'ビタミンB2',unit:'mg',type:'RDA',target:1.6},vitB6:{label:'ビタミンB6',unit:'mg',type:'RDA',target:1.5},vitB12:{label:'ビタミンB12',unit:'µg',type:'AI',target:4},vitC:{label:'ビタミンC',unit:'mg',type:'RDA',target:100},folate:{label:'葉酸',unit:'µg',type:'RDA',target:240}
};
export const ENERGY={low:2250,moderate:2600,high:3000};
export const freshNutrition=()=>({activity:'moderate',entries:[],completeDays:[]});
export function validNutrients(n){return n&&typeof n==='object'&&!Array.isArray(n)&&Object.keys(n).every(k=>NUTRIENTS[k]&&(n[k]===null||Number.isFinite(n[k])&&n[k]>=0&&n[k]<=1e6));}
export function validNutrition(n){return n&&Object.hasOwn(ENERGY,n.activity)&&Array.isArray(n.entries)&&n.entries.length<=10000&&n.entries.every(e=>e&&typeof e.id==='string'&&e.id.length<=100&&(e.foodId==null||typeof e.foodId==='string'&&e.foodId.length<=100)&&typeof e.name==='string'&&e.name.trim()&&e.name.length<=140&&validDate(e.day)&&['ate','bought'].includes(e.status)&&['breakfast','lunch','dinner','snack'].includes(e.meal)&&Number.isFinite(e.quantity)&&e.quantity>0&&e.quantity<=10000&&typeof e.unit==='string'&&e.unit.length<=40&&Number.isFinite(e.updated)&&validNutrients(e.nutrients)&&typeof e.source==='string'&&e.source.length<=500&&['official','composition','label','estimate'].includes(e.evidence))&&Array.isArray(n.completeDays)&&n.completeDays.length<=4000&&n.completeDays.every(validDate);}
export function normalizeNutrition(n){return validNutrition(n)?{activity:n.activity,entries:n.entries.map(e=>({...e,nutrients:{...e.nutrients}})),completeDays:[...new Set(n.completeDays)]}:freshNutrition();}
export function nutritionSum(entries){const rows=entries.filter(e=>e.status==='ate');return Object.fromEntries(Object.keys(NUTRIENTS).map(k=>{const known=rows.filter(e=>Number.isFinite(e.nutrients[k]));return [k,{value:known.reduce((s,e)=>s+e.nutrients[k]*e.quantity,0),known:known.length,total:rows.length,complete:!!rows.length&&known.length===rows.length}];}));}
export const roundN=(v,k)=>Number(v.toFixed(k==='energy'||['calcium','vitA','folate'].includes(k)?0:2));
export function nutritionPeriod(n,day=jstDay(),week=false){
 const start=new Date(Date.parse(day+'T00:00:00Z')-6*86400000).toISOString().slice(0,10);
 const days=week?[...new Set(n.completeDays)].filter(d=>d>=start&&d<=day&&n.entries.some(e=>e.status==='ate'&&e.day===d)):[day];
 const entries=n.entries.filter(e=>e.status==='ate'&&days.includes(e.day));
 const count=week?days.length:1,sum=nutritionSum(entries);for(const k of Object.keys(sum))sum[k].value/=count||1;
 return {sum,entries,days,count,complete:week?days.length>=3:n.completeDays.includes(day),week};
}
export function nutritionAdvice(report,activity='moderate'){
 const s=report.sum,out=[];if(!report.entries.length)return ['食べたものを登録すると、カロリーと栄養の内訳が出ます。買っただけの食品は合計に入りません。'];
 const suffix=report.week?'記録を完了した日の平均':'この日の記録';
 if(s.salt.known&&s.salt.value>=7.5)out.push(suffix+'の食塩が目標の7.5g未満を上回っています。次は汁物やソースを少なめに。');
 if(report.week&&report.count>=3){
  if(s.protein.complete&&s.protein.value<65)out.push('たんぱく質の記録平均が推奨量65gより少なめです。卵・魚・豆腐などを食事に足す候補に。');
  if(s.fiber.complete&&s.fiber.value<20)out.push('食物繊維の記録平均が目標の20g以上に届いていません。豆・野菜・果物・全粒穀物を組み合わせてみて。');
  if(s.calcium.complete&&s.calcium.value<800)out.push('カルシウムの記録平均が推奨量800mgより少なめです。乳製品や豆腐、小魚などを足す候補に。');
  if(s.vitC.complete&&s.vitC.value<100)out.push('ビタミンCの記録平均が推奨量100mgより少なめです。キウイやブロッコリーなどを足す候補に。');
  const other=['iron','zinc','vitA','vitB1','vitB2','vitB6','folate'].filter(k=>s[k].complete&&s[k].value<NUTRIENTS[k].target);
  if(other.length)out.push('ほかに記録平均が推奨量より少ない項目：'+other.map(k=>NUTRIENTS[k].label).join('・')+'。詳細の内訳で確認できます。肉・魚・卵・豆類・野菜の組み合わせを見直す手がかりです。');
  if(s.energy.complete&&s.energy.value>0){for(const key of ['fat','saturated']){const m=NUTRIENTS[key];if(s[key].complete&&s[key].value*m.factor/s.energy.value*100>m.range[1])out.push(key==='fat'?'脂質の記録平均はエネルギー比30％を超えています。菓子パンや揚げ物が重なる日は他の食事の油を控えめに。':'飽和脂肪酸の記録平均はエネルギー比7％を超えています。バターや脂身の多い食品の量を見直す候補です。');}}
 }
 if(!report.week)out.push('1日だけで栄養不足とは判断できません。「1日分の入力完了」を3日以上つけると、7日間の傾向で少なめの栄養も確認できます。');
 else if(report.count<3)out.push('完了した日が3日分たまると、平均から少なめの栄養を振り返ります。');
 if(Object.values(s).some(x=>!x.complete))out.push('未掲載の成分があります。空欄をゼロにせず、その栄養素の不足判定を止めています。');
 if(report.entries.some(e=>e.foodId?.startsWith('croquant')))out.push('クロッカンは種類によって1個475〜525kcal。主に炭水化物と脂質を含みます。卵や無糖ヨーグルト、果物などを組み合わせると食品の種類を増やせます。');
 if(!out.length)out.push('記録の内訳を確認できました。推奨量を超えただけでは摂りすぎとは判定していません。');
 return out;
}
export function mergeNutrition(current,incoming){const map=new Map(current.entries.map(e=>[e.id,e]));for(const e of incoming.entries){if(!map.has(e.id)||e.updated>map.get(e.id).updated)map.set(e.id,e);}return {activity:current.activity,entries:[...map.values()].slice(-10000),completeDays:[...new Set([...current.completeDays,...incoming.completeDays])].sort().slice(-4000)};}
export function consumePurchase(n,id,quantity,day,meal,newId,now=Date.now()){
 const p=n.entries.find(e=>e.id===id&&e.status==='bought');if(!p||!Number.isFinite(quantity)||quantity<=0||quantity>p.quantity||!validDate(day)||!['breakfast','lunch','dinner','snack'].includes(meal))throw Error('食べた量・日付を確認してください。');
 const eaten={...p,id:newId,quantity,status:'ate',day,meal,updated:now};const entries=n.entries.filter(e=>e.id!==id);if(p.quantity>quantity)entries.push({...p,quantity:Number((p.quantity-quantity).toFixed(6)),updated:now});entries.push(eaten);return {...n,entries,completeDays:n.completeDays.filter(d=>d!==day)};
}

// 足りないものを具体的に。推奨量・目安量・目標量に対する達成率で並べ、銀くんの定番から足し方を提案する。
export const GAP_FOODS={
 protein:{foods:'鶏を焼く（もも1枚で約50g）・ゆで卵・納豆・豆腐',pick:'gin-grilled-chicken-plate'},
 fiber:{foods:'野菜スープ・玄米ごはん・ブロッコリー・りんご',pick:'gin-vegetable-soup'},
 vitC:{foods:'りんごとセロリのジュース・ブロッコリー・キウイ',pick:'gin-apple-celery-juice'},
 calcium:{foods:'牛乳・ヨーグルト・木綿豆腐',pick:null},
 iron:{foods:'ほうれんそう・納豆・さば・鶏もも',pick:null},
 zinc:{foods:'鶏もも・納豆・玄米ごはん',pick:'gin-grilled-chicken-plate'},
 vitA:{foods:'にんじん入りのスープ・ほうれんそう',pick:'gin-vegetable-soup'},
 vitD:{foods:'鮭・さば・ゆで卵',pick:null},
 vitE:{foods:'アーモンド・オリーブ油のパスタ',pick:'gin-peperoncino'},
 vitB1:{foods:'玄米ごはん・納豆・枝豆',pick:null},
 vitB2:{foods:'牛乳・ヨーグルト・ゆで卵・さば',pick:null},
 vitB6:{foods:'鶏むね肉・バナナ・鮭',pick:'gin-grilled-chicken-plate'},
 vitB12:{foods:'鮭・さば・ゆで卵・牛乳',pick:null},
 folate:{foods:'ブロッコリー・ほうれんそう・枝豆・納豆',pick:'gin-vegetable-soup'}
};
export const GAP_KEYS=Object.keys(GAP_FOODS);
export function fmtAmount(v,k){const n={...NUTRIENTS[k],unit:k==='vitA'?'µg':NUTRIENTS[k].unit};const d=['energy','calcium','vitA','folate','vitC'].includes(k)?0:['protein','fiber','zinc','iron','vitD','vitE'].includes(k)?1:2;return Number(v.toFixed(d))+' '+n.unit;}
export function nutrientGaps(report,activity='moderate'){
 const s=report.sum;if(!report.entries.length)return {items:[],energy:null,salt:null,empty:true};
 const items=GAP_KEYS.map(k=>{const m=NUTRIENTS[k],v=s[k],value=v.known?v.value:0,ratio=Math.min(2,value/m.target);
  return {key:k,label:m.label,unit:m.unit,target:m.target,value,ratio,short:Math.max(0,m.target-value),partial:!v.complete,unknown:!v.known,foods:GAP_FOODS[k].foods,pick:GAP_FOODS[k].pick,kind:m.type};});
 // 並び順：達成率が低い順。ただし主要な栄養（たんぱく質・食物繊維・ビタミンC・カルシウム・鉄・亜鉛）を優先し、微量なビタミンは少し後ろに。
 const tier=k=>['protein','fiber','vitC','calcium','iron','zinc'].includes(k)?0:['vitA','vitB1','vitB2','vitB6','folate'].includes(k)?.25:.4;
 items.sort((a,b)=>(a.ratio+tier(a.key))-(b.ratio+tier(b.key)));
 const eer=ENERGY[activity],ev=s.energy.known?s.energy.value:0;
 return {items,empty:false,energy:{value:ev,target:eer,ratio:ev/eer,partial:!s.energy.complete},salt:{value:s.salt.known?s.salt.value:0,target:NUTRIENTS.salt.target,over:s.salt.known&&s.salt.value>=NUTRIENTS.salt.target,partial:!s.salt.complete}};
}
// 足りていない上位を短い文に（晩ごはんの相談用）。
export function gapSummary(gaps,limit=3){
 if(!gaps||gaps.empty)return {text:'',keys:[]};
 const low=gaps.items.filter(i=>i.ratio<.7).slice(0,limit);
 if(!low.length)return {text:'主な栄養はここまでで目安に届いている。',keys:[]};
 return {text:'少なめ：'+low.map(i=>i.label+'（あと'+fmtAmount(i.short,i.key)+'）').join('・'),keys:low.map(i=>i.key)};
}
