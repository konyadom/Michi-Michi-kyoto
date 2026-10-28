export function reviewsMarkup(p,esc){
 if(!p.reviews?.length)return '';
 const items=p.reviews.map(r=>`<article class="review-item ${r.tone}"><div class="review-top"><span>${esc(r.topic)}</span><b>${r.tone==='positive'?'よかったという声':r.tone==='negative'?'合わなかったという声':'訪問時のメモ'}</b></div><p>${esc(r.text)}</p><a href="${esc(r.url)}" target="_blank" rel="noopener noreferrer">${esc(r.by)} · ${esc(r.date)} ↗</a></article>`).join('');
 return `<section class="review-section"><div class="section-head"><h3>食べた人の感想</h3><span>${p.reviews.length}件を抜粋</span></div><p class="review-caption">個人の感想を要約しています。お店全体の評価や現在の品質を保証するものではありません。${p.oldReviews?'古い口コミを含むため、年月もご確認ください。':''}</p>${items}${p.dispute?`<div class="review-dispute"><b>接客を巡る投稿について</b><p>${esc(p.dispute.text)}</p><a href="${esc(p.dispute.url)}" target="_blank" rel="noopener noreferrer">${esc(p.dispute.source)} ↗</a></div>`:''}</section>`;
}
