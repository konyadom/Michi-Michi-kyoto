// Personal defaults for this owner-private Site. These are never shared as a feed.
export const DEFAULT_HOME={name:'睦荘',address:'京都市左京区岩倉西河原町213-1',pos:[35.07314,135.78391],source:'https://www.elitz.co.jp/detail/59879-0203/'};
export const FAMILY=[
 {id:'gin',name:'銀くん',role:'あなた',kind:'person',initial:'銀',tone:'silver'},
 {id:'koume',name:'小梅ちゃん',role:'婚約者',kind:'person',initial:'梅',tone:'plum'},
 {id:'atsuyaki',name:'あつやきたまご',role:'ロボット掃除機',kind:'robot',tone:'egg'},
 {id:'omurice',name:'おむらいすくん',role:'ロボット掃除機',kind:'robot',tone:'rice'}
];
export const defaults=()=>({version:1,walks:[],notes:[],bookmarks:[],shopVisits:[],pinnedShops:[],dismissedShops:[],shopMemos:{},discoveredPlaces:[],battleEffects:true,autoTrack:true,autoTrackConsent:false,pet:null,goat:null,anniversaries:[],nutrition:null,autoShops:true,startAt:'home',activeMember:'gin',home:null,evening:null,blanket:null});
// 銀くんの食事のくせ。声かけの文面と「いつもの」ボタンに使う。
export const EATING_HABITS={lightBreakfast:true,cooksAtHome:true,dinnerPromptHour:19,specialty:'ペペロンチーノ'};
export const USUAL_FOODS={
 breakfast:[['gin-apple-celery-juice','🍎 りんごとセロリのジュース'],['croquant-banana','🥐 クロッカン']],
 lunch:[['gin-peperoncino','🍝 ペペロンチーノ'],['gin-rice-bowl','🍚 ご飯'],['gin-vegetable-soup','🍲 スープ'],['mcd-double-thick-beef','🍔 ダブル肉厚ビーフ']],
 dinner:[['gin-peperoncino','🍝 ペペロンチーノ'],['gin-grilled-chicken-plate','🍗 鶏を焼いたもの'],['gin-vegetable-soup','🍲 スープ'],['gin-rice-bowl','🍚 ご飯']],
 snack:[['gin-apple-celery-juice','🍎 ジュース'],['croquant-banana','🥐 クロッカン']]
};
