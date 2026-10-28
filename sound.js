// 効果音：音声ファイルは使わず、Web Audio でその場で合成する（軽い・オフラインでも鳴る）。
// ブラウザの決まりで、最初のタップより前には鳴らない。iPhoneのマナースイッチが入っていると鳴らない。
let ctx=null,enabled=true,unlocked=false;const MASTER=2.6; // スマホのスピーカーで聞きやすい大きさに
function context(){if(!ctx){const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return null;try{ctx=new AC();}catch{return null;}}return ctx;}
function unlock(){const c=context();if(!c)return;if(c.state==='suspended')c.resume().catch(()=>{});unlocked=true;}
for(const ev of ['pointerdown','keydown','touchend'])document.addEventListener(ev,unlock,{passive:true,capture:true});
export function setSoundEnabled(on){enabled=!!on;}
export function soundEnabled(){return enabled;}
export function soundSupported(){return !!(window.AudioContext||window.webkitAudioContext);}
function ready(){const c=context();return enabled&&c&&c.state==='running'?c:null;}
// 基本の音：周波数の動きと減衰を指定して1音
function tone(c,{type='sine',from=440,to=from,start=0,dur=.15,gain=.08,attack=.005,filter=null}){
 const t0=c.currentTime+start,osc=c.createOscillator(),g=c.createGain();osc.type=type;osc.frequency.setValueAtTime(from,t0);if(to!==from)osc.frequency.exponentialRampToValueAtTime(Math.max(20,to),t0+dur);
 g.gain.setValueAtTime(0,t0);g.gain.linearRampToValueAtTime(gain*MASTER,t0+attack);g.gain.exponentialRampToValueAtTime(.0001,t0+dur);
 let node=osc;if(filter){const f=c.createBiquadFilter();f.type=filter.type||'lowpass';f.frequency.value=filter.freq||1200;f.Q.value=filter.q||.7;osc.connect(f);node=f;}
 node.connect(g);g.connect(c.destination);osc.start(t0);osc.stop(t0+dur+.05);
}
// ノイズの短い粒：かじる音・かけらの音
function crackle(c,{start=0,dur=.05,gain=.05,freq=2600}){
 const t0=c.currentTime+start,n=Math.floor(c.sampleRate*dur),buf=c.createBuffer(1,n,c.sampleRate),d=buf.getChannelData(0);
 for(let i=0;i<n;i++)d[i]=(Math.random()*2-1)*(1-i/n);
 const src=c.createBufferSource(),f=c.createBiquadFilter(),g=c.createGain();src.buffer=buf;f.type='bandpass';f.frequency.value=freq;f.Q.value=1.2;g.gain.value=gain*MASTER;src.connect(f);f.connect(g);g.connect(c.destination);src.start(t0);
}
export const sounds={
 // ぽりぽり：かじる粒を10回（ノイズの粒だけ。声の成分なし）
 nibble(c){for(let i=0;i<10;i++){crackle(c,{start:i*.26,dur:.045,gain:.07,freq:2200+(i%3)*500});tone(c,{type:'triangle',from:180,to:120,start:i*.26,dur:.06,gain:.03});}},
 // お水：水滴がはねる短い音
 plip(c){for(let i=0;i<3;i++)tone(c,{type:'sine',from:1400+i*200,to:900,start:i*.3,dur:.07,gain:.05,attack:.002});},
 // なでる：小さな鈴
 ting(c){for(const [m,g] of [[1,.06],[2.76,.02],[5.4,.008]])tone(c,{type:'sine',from:2093*m,dur:.5,gain:g,attack:.003});tone(c,{type:'sine',from:2637,start:.14,dur:.45,gain:.045,attack:.003});},
 // 戸：ことっ
 door(c){tone(c,{type:'triangle',from:240,to:160,dur:.12,gain:.05,filter:{freq:700}});tone(c,{type:'triangle',from:200,to:140,start:.14,dur:.1,gain:.035,filter:{freq:600}});},
 // おつかれさま：二音のチャイム
 chime(c){for(const [f,s] of [[659.3,0],[880,.22]])for(const [m,g] of [[1,.07],[2,.025],[3,.012]])tone(c,{type:'sine',from:f*m,start:s,dur:1.1-s*.4,gain:g,attack:.01});},
 // ステップ完了：ぽん
 pop(c){tone(c,{type:'sine',from:620,to:880,dur:.09,gain:.06,attack:.003});},
 // 19時：三音の合図
 dinner(c){[[523.3,0],[659.3,.18],[784,.36]].forEach(([f,s])=>{tone(c,{type:'sine',from:f,start:s,dur:.5,gain:.06,attack:.01});tone(c,{type:'sine',from:f*2,start:s,dur:.3,gain:.015,attack:.01});});},
 // ロボット掃除機：低いモーター音が通りすぎる
 vacuum(c){const t0=c.currentTime,n=Math.floor(c.sampleRate*3),buf=c.createBuffer(1,n,c.sampleRate),d=buf.getChannelData(0);for(let i=0;i<n;i++)d[i]=Math.random()*2-1;const src=c.createBufferSource(),f=c.createBiquadFilter(),g=c.createGain();src.buffer=buf;f.type='bandpass';f.frequency.value=260;f.Q.value=2;g.gain.setValueAtTime(0,t0);g.gain.linearRampToValueAtTime(.12*MASTER,t0+.6);g.gain.setValueAtTime(.12*MASTER,t0+2.2);g.gain.linearRampToValueAtTime(0,t0+3);src.connect(f);f.connect(g);g.connect(c.destination);src.start(t0);tone(c,{type:'triangle',from:110,to:118,dur:2.8,gain:.025,attack:.5,filter:{freq:400}});}
};
export function play(name){const c=ready();if(!c||!sounds[name])return false;try{sounds[name](c);return true;}catch{return false;}}
export function audioUnlocked(){return unlocked&&ctx?.state==='running';}
