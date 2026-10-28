# みちしるべ — 京都の散歩地図

歩いた道を回数別に色分けする京都の地図アプリ（v2.2）。
ChatGPT Sites で作った版を、GitHub Pages など普通の静的ホスティングで動く形にしたものです。
記録（あしあと・食事・ペット・記念日）は各自のブラウザにだけ保存されます。

## 公開のしかた（GitHub Pages）

1. GitHub で新しいリポジトリを作る（Public）
2. このフォルダの中身を **すべて同じ階層に** アップロードする（index.html がリポジトリ直下に来るように）
3. リポジトリの Settings → Pages → Source を「Deploy from a branch」、Branch を `main` / `/(root)` にして Save
4. 数分後に `https://ユーザー名.github.io/リポジトリ名/` で開ける

スマホの「ホーム画面に追加」でアプリのように使えます。位置情報の記録には https が必要なので、GitHub Pages ならそのまま動きます。

## 更新のしかた（2回目以降）

`https://github.com/ユーザー名/リポジトリ名/upload/main` を開いて、新しいフォルダの中身を全部選んでアップロード → 「Commit changes」。
同じ名前のファイルは上書きされます。1〜2分で反映され、開いている人には「更新あり」と出ます（`version.json` と `index.html` の build が同じ値になっていること）。

## v2.2

- しつこさ（mouse-core.js の pester）：10分以内の回数で、2回で威嚇、4回（3回でも半々）で15〜30分隠れる、隠れているのにさわる／6回で逃げる（1〜4時間の外出）。ごはん・お水を置くと隠れる時間が4分に
- ジムは LifeFit 宝ヶ池店（gym.js）

## v2.1

- ジム（gym.js）：国際会館駅の目安位置にピン。詳細の「ジムの位置を直す」で正しい場所へ。訪問はGPS滞在（4分）か「今日来た」。1回で体型−8。週ノルマはホームのカード
- ねずみの気分（mouse-core.js の mouseMood）：1時間ごとに固定の乱数で、空腹／さみしい／外に出たい／理由なし／石
- おこぼれ（scraps）：ハンバーガー60%でかけら、自炊の晩ごはん50%でおこぼれ、それ以外はねだり→「少し分ける」
- 変な石：拾いものの4%。置いておくと威嚇が増え部屋が暗くなる。「戻す」で解除

## v2.0

- ねずみ：名前・体型（ごはんで増え、6時間で1.5減る）・威嚇（空腹か、クールダウン中に2回なでる）・睡眠（23〜6時）・散歩で見つかる（距離で確率）・拾いもの・ロボット掃除機への反応（`mouse-core.js` / `life-ui.js` / `characters.js`）
- 電気毛布チャレンジは3つのチェックボタンに（`evening.js`）
- 効果音は鈴・水滴・ノイズだけ。声のような音は使わない（`sound.js`）

## v1.9.1

- 効果音（`sound.js`）。音声ファイルは使わず Web Audio で合成。設定の「効果音」で切れます。最初のタップ前と、iPhoneのマナーモード中は鳴りません

## v1.9 で変わったこと

- 配色を藍（インディゴ）系に。おかえり・晩ごはんのカードは暖色で区別（`style.css` の `:root` トークンと各CSS）
- ねずみくんをシンプルな形に。えさ皿・かけら・水滴の演出（`characters.js` / `life.css`）
- 帰宅の「おつかれさま！」と夜の3ステップ、電気毛布チャレンジ（`evening.js`。GPSで家に戻ったとき／17時以降に歩いた日の初回起動／設定の「ただいま」）
- 今夜の最低気温は Open-Meteo の daily から（`day-context.js`）
- ホーム画面に追加の案内と Android のインストールボタン、`manifest.webmanifest` のショートカット

## v1.8 で変わったこと

- ねずみくんが絵文字からイラストに。呼吸・まばたき・耳・しっぽが動き、ごはんでもぐもぐ、なでると跳ねます（`characters.js` / `life.css`）
- 食事・栄養に「今日ここまでで足りていないもの」。推奨量まであと何gかと、銀くんの定番からの足し方（`nutrition-core.js` の `nutrientGaps`）
- 19時以降に晩ごはんが未記録なら「今日の晩御飯はどうしようか？ どんなパスタ？得意のペペロンチーノ？」の相談モード。足りない栄養から候補を並べ、決めたら「今夜は○○」として覚えます（`day-context.js`）
- いつものボタンを時間帯ごとに。朝は「軽めでも大丈夫」の声かけ（`household.js` の `USUAL_FOODS` / `EATING_HABITS` で変更できます）
- 通知：アプリを開いたまま裏に回していれば19時に通知（`sw.js`）。閉じていても届くものは `dinner-reminder.ics`（毎日19時の予定）をカレンダーに入れる方式

## 構成

- `index.html` — 画面。JS は `app.js` から各モジュール（`*.js`）を読み込みます
- `leaflet.js` / `protomaps-leaflet.js` / `leaflet.css` — 地図ライブラリ
- `kyoto.json` — 京都府の境界（府内判定用）。地球地図日本（国土地理院）を [dataofjapan/land](https://github.com/dataofjapan/land) が GeoJSON 化したものから抽出
- `search-config.json` — 施設検索の接続先（Photon / OpenStreetMap）
- `sw.js` — 通知の表示だけを担当（ページのキャッシュはしません）
- `dinner-reminder.ics` — 毎日19時「今日の晩御飯はどうしようか？」の予定（iPhoneのカレンダーに追加できます）
- `map-data.txt` — 設定画面から開く地図データの出典
- `version.json` — 「アプリの更新」で参照。新しい版を置くときは `version`・`build` を `index.html` の `<meta name="app-version">` / `app-build` と揃える
- `green-index.json` / `green-overview.geojson` — 緑地レイヤー。元データが取り出せなかったため、いまは空（地図は緑地の薄緑なしで表示されます）。元サイトの `green/` 一式が手に入ったら `green-<キー>.geojson` の名前で置き、`green-index.json` にキーの配列を書くと復活します

## 地図・データの出典

- 地図：[国土地理院ベクトルタイル](https://maps.gsi.go.jp/vector/)（最適化ベクトルタイル）
- 境界：地球地図日本（国土地理院）
- 検索：© [OpenStreetMap](https://www.openstreetmap.org/copyright) contributors（Photon）
- 天気：[Open-Meteo](https://open-meteo.com/)
