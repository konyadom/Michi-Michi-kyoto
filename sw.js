// みちしるべ service worker: 通知の表示とタップ時の復帰だけを担当。
// ページのキャッシュはしない（更新がすぐ届くように）。
self.addEventListener('install',()=>self.skipWaiting());
self.addEventListener('activate',event=>event.waitUntil(self.clients.claim()));
self.addEventListener('notificationclick',event=>{
 event.notification.close();
 const target=new URL(event.notification.data?.url||'./#home',self.registration.scope).href;
 event.waitUntil(self.clients.matchAll({type:'window',includeUncontrolled:true}).then(list=>{
  for(const client of list){if('focus' in client){if(client.navigate)client.navigate(target).catch(()=>{});return client.focus();}}
  return self.clients.openWindow(target);
 }));
});
