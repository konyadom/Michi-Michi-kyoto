export function homeMarkup({home,family,icon,esc,stats,frequent,nearby,auto,shopCard,extra,dayContext}){
 return `<div class="home-heading"><span class="eyebrow">岩倉西河原町</span><h1>銀くんのホーム</h1></div>
 <div data-day-context>${dayContext}</div>
 <div class="home-quick-menu" aria-label="暮らしのメニュー">
 <button data-action="nutrition" class="quick-food">${icon('food')}<strong>食事・栄養</strong><small>食べた・買ったものを記録</small></button>
 <button data-action="pet" class="quick-pet">${icon('paw')}<strong>ネズミの部屋</strong><small>ごはん・お水・散歩</small></button>
 <button data-action="anniversaries">${icon('calendar')}<strong>記念日</strong><small>登録・あと何日</small></button>
 <button data-action="local-stories" class="quick-stories">${icon('ghost')}<strong>岩倉の心霊スポット</strong><small>鬼法教・岩倉児童公園 ほか</small></button>
 <button data-action="go-work">${icon('building')}<strong>職場</strong><small>場所・施設情報</small></button>
 <button data-action="school">${icon('calendar')}<strong>大学のお知らせ</strong><small>行事・教員の紹介</small></button>
 </div>
 <div class="home-utilities"><button data-nav="journal">${icon('route')}あしあと</button><button data-nav="saved">${icon('bookmark')}しおり</button><button data-action="updates">更新情報 ↗</button></div>
 ${extra||''}
 <form id="home-search" class="home-search"><label class="search">${icon('search')}<input type="search" name="q" maxlength="120" placeholder="施設・お店を探す" aria-label="施設・お店を探す"><button type="submit" aria-label="検索">${icon('arrow')}</button></label></form><section class="house-card"><div class="house-illustration">${icon('home')}<span class="house-tree">${icon('leaf')}</span><i></i></div><div><span class="home-overline">おうち</span><h2>${esc(home.name)}</h2><button class="home-focus" data-action="go-home">自宅の周辺を見る ${icon('arrow')}</button></div><button class="home-edit" data-action="edit-home" aria-label="自宅の位置を調整">${icon('pen')}</button></section>
 <button class="work-card" data-action="go-work">${icon('building')}<span><small>銀くんの勤務先</small><strong>ウルトラファクトリー</strong><em>京都芸術大学 · 至誠館4階</em></span>${icon('chevron')}</button>
 <div class="section-head family-head"><h2>うちのメンバー</h2><span>2人と2台</span></div>
 <div class="family-grid">${family.map(m=>`<div class="family-member"><span class="family-avatar ${m.tone}">${m.kind==='robot'?icon('robot'):esc(m.initial)}</span><div><strong>${esc(m.name)}</strong><small>${esc(m.role)}</small></div></div>`).join('')}</div>
 ${stats}
 <div class="section-head"><h2>よく行くお店</h2><button class="auto-switch ${auto?'on':''}" data-action="toggle-auto-shops" aria-pressed="${auto}">GPS検出 ${auto?'ON':'OFF'}</button></div>
 <p class="section-caption">${auto?'掲載済み・自分で追加したお店が対象。<br>GPS記録中に4分以上滞在し、別の日に3回訪れると追加します。':'GPS検出はOFFです。<br>「今日来た」から手動で記録できます。'}</p>
 ${frequent.length?frequent.map(p=>shopCard(p,true)).join(''):'<div class="frequent-empty">まだ登録はありません。<br>お店の「今日来た」からも記録できます。</div>'}
 <button class="text-btn manage-shops" data-action="shops">お店を探す・追加する →</button>
 <div class="section-head nearby-head"><h2>近くのお店</h2><span>掲載店</span></div>${nearby.map(p=>shopCard(p,false)).join('')}
 <button class="review-shortcut" data-action="reviews">${icon('cup')}<span><strong>食べた人の感想から探す</strong><small>高安・天下一品総本店・ラーメン二郎京都店</small></span></button>
 <div class="neighborhood-links"><button data-action="local-stories">${icon('ghost')}<span><strong>岩倉の心霊スポット</strong><small>古い書き込みや噂も出典つきで</small></span>${icon('chevron')}</button><button data-action="facilities">${icon('building')}<span><strong>周辺の施設</strong><small>大学・病院・工場の所在地</small></span>${icon('chevron')}</button></div>`;
}
