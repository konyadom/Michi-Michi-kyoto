export function validRelease(value){return !!value&&/^\d+\.\d+(?:\.\d+)?$/.test(value.version)&&/^[a-f0-9]{12}$/.test(value.build)&&Array.isArray(value.changes)&&value.changes.every(s=>typeof s==='string'&&s.length<300);}
export async function fetchRelease(fetcher=fetch,now=Date.now()){
 const response=await fetcher('./version.json?t='+now,{cache:'no-store',credentials:'same-origin'});
 if(!response.ok)throw Error('更新情報を取得できませんでした。通信を確認してもう一度お試しください。');
 const release=await response.json();if(!validRelease(release))throw Error('更新情報を読み込めませんでした。少し待ってからもう一度お試しください。');return release;
}
export function freshUrl(href,build,now=Date.now()){
 const url=new URL(href);url.searchParams.set('v',build);url.searchParams.set('refresh',String(now));return url.href;
}
export function installUpdates({modal,esc,beforeReload}){
 const current={version:document.querySelector('meta[name="app-version"]').content,build:document.querySelector('meta[name="app-build"]').content};
 let latest=null,busy=false,lastCheck=0,message='';
 const different=()=>latest&&latest.build!==current.build;
 const badge=document.querySelector('[data-release-badge]');
 function paintBadge(){badge.textContent=different()?'更新あり':'v'+current.version;badge.classList.toggle('has-update',!!different());}
 function markup(){return '<h2>アプリの更新</h2><p>いま開いている版 <strong>v'+esc(current.version)+'</strong></p><p class="release-message" role="status">'+esc(busy?'更新を確認しています…':message||'新しい版があるか確認できます。')+'</p>'+(latest?'<h3>v'+esc(latest.version)+' の変更</h3><ul class="release-changes">'+latest.changes.map(s=>'<li>'+esc(s)+'</li>').join('')+'</ul>':'')+'<div class="button-row"><button class="secondary" data-update-check '+(busy?'disabled':'')+'>もう一度確認</button><button class="primary" data-update-reload '+(busy?'disabled':'')+'>'+(different()?'新しい版に更新':'画面を再読み込み')+'</button></div><p class="pet-caption">保存したあしあと・食事・ペット・記念日は引き継ぎます。入力中の内容があるときは先に保存してください。</p>';}
 function draw(){modal(markup());}
 async function check(show=false){if(busy)return;busy=true;lastCheck=Date.now();if(show)draw();try{latest=await fetchRelease();message=different()?'新しい版があります。保存してから更新してください。':'最新の版です。';paintBadge();}catch(e){message=e.message;}finally{busy=false;if(show&&document.querySelector('#dialog')?.open&&document.querySelector('[data-update-check]'))draw();}}
 function open(){draw();check(true);}
 document.addEventListener('click',async e=>{const b=e.target.closest('button');if(!b)return;if(b.hasAttribute('data-update-check'))await check(true);if(b.hasAttribute('data-update-reload')){if(!beforeReload())return;location.replace(freshUrl(location.href,latest?.build||current.build));}});
 document.addEventListener('visibilitychange',()=>{if(!document.hidden&&Date.now()-lastCheck>300000)check();});
 paintBadge();check();return {open,current};
}
