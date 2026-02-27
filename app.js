/* ==========================================
   KeyDrill — Main Application Logic
   ========================================== */

// ===== CONFIGURATION =====
const DATA_DIR = 'data';

// ===== SOUND EFFECTS (Web Audio API — no external files, copyright-free) =====
let audioCtx = null;
function getAudioCtx() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  return audioCtx;
}

const SFX = {
  // 正解音: 明るい上昇チャイム
  correct() {
    const ctx = getAudioCtx();
    const now = ctx.currentTime;
    [523.25, 659.25, 783.99].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.18, now + i * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 0.3);
      osc.connect(gain).connect(ctx.destination);
      osc.start(now + i * 0.08);
      osc.stop(now + i * 0.08 + 0.3);
    });
  },

  // ミス音: 低い下降ブザー
  wrong() {
    const ctx = getAudioCtx();
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(300, now);
    osc.frequency.exponentialRampToValueAtTime(150, now + 0.2);
    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
    osc.connect(gain).connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.25);
  },

  // ゲーム開始音: 軽快なスタート音
  start() {
    const ctx = getAudioCtx();
    const now = ctx.currentTime;
    [440, 554.37, 659.25].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.15, now + i * 0.1);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.1 + 0.25);
      osc.connect(gain).connect(ctx.destination);
      osc.start(now + i * 0.1);
      osc.stop(now + i * 0.1 + 0.25);
    });
  },

  // ゲーム終了ファンファーレ
  fanfare() {
    const ctx = getAudioCtx();
    const now = ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.15, now + i * 0.15);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.15 + 0.5);
      osc.connect(gain).connect(ctx.destination);
      osc.start(now + i * 0.15);
      osc.stop(now + i * 0.15 + 0.5);
    });
    // 和音でフィニッシュ
    setTimeout(() => {
      const t = ctx.currentTime;
      [523.25, 659.25, 783.99, 1046.5].forEach(freq => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.1, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.8);
        osc.connect(gain).connect(ctx.destination);
        osc.start(t);
        osc.stop(t + 0.8);
      });
    }, 700);
  },

  // キー押下のクリック音
  keypress() {
    const ctx = getAudioCtx();
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = 800;
    gain.gain.setValueAtTime(0.05, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
    osc.connect(gain).connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.05);
  },
};

// Shortcuts that cannot be prevented by the browser (Chrome on Windows)
const BLOCKED_SHORTCUTS = [
  // ウィンドウ・タブ操作（ブラウザが強制的に処理）
  'Alt+F4',           // ウィンドウ終了
  'Ctrl+W',           // タブを閉じる
  'Ctrl+T',           // 新しいタブ
  'Ctrl+N',           // 新しいウィンドウ
  'Ctrl+Shift+W',     // ウィンドウを閉じる
  'Ctrl+Shift+T',     // 閉じたタブを復元
  'Ctrl+Shift+N',     // シークレットウィンドウ
  // タブ移動
  'Ctrl+Tab',         // 次のタブ
  'Ctrl+Shift+Tab',   // 前のタブ
  'Ctrl+PageDown',    // 次のタブ
  'Ctrl+PageUp',      // 前のタブ
  'Ctrl+1',           // タブ1に移動
  'Ctrl+2',           // タブ2に移動
  'Ctrl+3',           // タブ3に移動
  'Ctrl+4',           // タブ4に移動
  'Ctrl+5',           // タブ5に移動
  'Ctrl+6',           // タブ6に移動
  'Ctrl+7',           // タブ7に移動
  'Ctrl+8',           // タブ8に移動
  'Ctrl+9',           // 最後のタブ
  // ブラウザ機能
  'F11',              // 全画面切替
  'F12',              // DevTools
  'Ctrl+Shift+I',     // DevTools
  'Ctrl+Shift+J',     // DevTools Console
  'Ctrl+Shift+Q',     // Chrome終了
  'Ctrl+L',           // アドレスバー
  'Alt+D',            // アドレスバー
  'Ctrl+Shift+Delete', // 履歴削除
  'Alt+Home',         // ホームページ
  'Ctrl+J',           // ダウンロード
  'Ctrl+H',           // 履歴
  'Ctrl+Shift+B',     // ブックマークバー
  'Ctrl+D',           // ブックマーク追加
  'Ctrl+Shift+O',     // ブックマーク管理
  'Alt+ArrowLeft',    // 戻る
  'Alt+ArrowRight',   // 進む
  'Ctrl+E',           // 検索バー
  'Ctrl+G',           // 次を検索
  'Ctrl+Shift+G',     // 前を検索
  'Ctrl+U',           // ソース表示
  'Ctrl+Shift+M',     // プロフィール切替
];

// Normalize a shortcut key string to enable comparison
function normalizeKeys(keysStr) {
  return keysStr
    .split('+')
    .map(k => k.trim().toLowerCase())
    .sort()
    .join('+');
}

function isBlocked(keysStr) {
  const norm = normalizeKeys(keysStr);
  return BLOCKED_SHORTCUTS.some(b => normalizeKeys(b) === norm);
}

// ===== STATE =====
const state = {
  availableSoftware: [],   // [{ name, filename, data: [] }]
  selectedSoftware: null,
  questions: [],
  currentIndex: 0,
  correctCount: 0,
  missCount: 0,
  missedQuestions: [],
  startTime: null,
  questionStartTime: null,
  totalAnswerTime: 0,
  timerInterval: null,
  gameActive: false,
  hintUsed: false,
};

// ===== DOM REFS =====
const $ = id => document.getElementById(id);

const dom = {
  titleScreen: $('title-screen'),
  gameScreen: $('game-screen'),
  resultScreen: $('result-screen'),
  softwareList: $('software-list'),
  questionCount: $('question-count'),
  questionOrder: $('question-order'),
  categoryFilter: $('category-filter'),
  startBtn: $('start-btn'),
  gameTimer: $('game-timer'),
  currentQ: $('current-q'),
  totalQ: $('total-q'),
  correctCount: $('correct-count'),
  missCount: $('miss-count'),
  questionCategory: $('question-category'),
  questionText: $('question-text'),
  keyDisplay: $('key-display'),
  feedback: $('feedback'),
  hintBtn: $('hint-btn'),
  hintText: $('hint-text'),
  skipBtn: $('skip-btn'),
  progressBar: $('progress-bar'),
  resultRank: $('result-rank'),
  resultAccuracy: $('result-accuracy'),
  resultTime: $('result-time'),
  resultAvg: $('result-avg'),
  resultMisses: $('result-misses'),
  resultDetails: $('result-details'),
  missedList: $('missed-list'),
  retryBtn: $('retry-btn'),
  backBtn: $('back-btn'),
};

// ===== CSV PARSER =====
function parseCSV(text) {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return [];
  const headers = lines[0].split(',').map(h => h.trim());
  return lines.slice(1).map(line => {
    const values = [];
    let current = '';
    let inQuotes = false;
    for (const char of line) {
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current.trim());
    const obj = {};
    headers.forEach((h, i) => { obj[h] = values[i] || ''; });
    return obj;
  });
}

// ===== FALLBACK DATA (for file:// protocol where fetch fails) =====
const FALLBACK_DATA = {
  'Excel': `category,operation,keys,difficulty
基本操作,コピー,Ctrl+C,1
基本操作,貼り付け,Ctrl+V,1
基本操作,切り取り,Ctrl+X,1
基本操作,元に戻す,Ctrl+Z,1
基本操作,やり直し,Ctrl+Y,1
基本操作,上書き保存,Ctrl+S,1
基本操作,名前を付けて保存,F12,1
基本操作,印刷,Ctrl+P,1
基本操作,検索,Ctrl+F,1
基本操作,置換,Ctrl+H,2
基本操作,全選択,Ctrl+A,1
基本操作,新しいブックを作成,Ctrl+N,1
基本操作,ブックを開く,Ctrl+O,1
基本操作,ブックを閉じる,Ctrl+W,2
基本操作,形式を選択して貼り付け,Ctrl+Alt+V,2
基本操作,直前の操作を繰り返す,F4,2
基本操作,ジャンプダイアログ,F5,2
セル編集,セルの編集モード,F2,1
セル編集,セル内で改行,Alt+Enter,2
セル編集,今日の日付を入力,Ctrl+;,2
セル編集,現在の時刻を入力,Ctrl+:,2
セル編集,上のセルをコピー,Ctrl+D,2
セル編集,左のセルをコピー,Ctrl+R,2
セル編集,セルの削除,Delete,1
セル編集,選択したセルに同じ値を一括入力,Ctrl+Enter,2
セル編集,入力を確定して下に移動,Enter,1
セル編集,入力を確定して上に移動,Shift+Enter,2
セル編集,入力を確定して右に移動,Tab,1
セル編集,入力をキャンセル,Escape,1
セル編集,セル参照の絶対/相対切替,F4,2
選択,行全体を選択,Shift+Space,2
選択,列全体を選択,Ctrl+Space,2
選択,選択範囲を1セル拡張（下）,Shift+ArrowDown,1
選択,選択範囲を1セル拡張（右）,Shift+ArrowRight,1
選択,選択範囲を1セル拡張（上）,Shift+ArrowUp,1
選択,選択範囲を1セル拡張（左）,Shift+ArrowLeft,1
選択,データの端まで選択（下）,Ctrl+Shift+ArrowDown,2
選択,データの端まで選択（右）,Ctrl+Shift+ArrowRight,2
選択,データの端まで選択（上）,Ctrl+Shift+ArrowUp,2
選択,データの端まで選択（左）,Ctrl+Shift+ArrowLeft,2
選択,先頭セルまで選択,Ctrl+Shift+Home,3
選択,末尾セルまで選択,Ctrl+Shift+End,3
書式設定,セルの書式設定を表示,Ctrl+1,2
書式設定,太字,Ctrl+B,1
書式設定,斜体,Ctrl+I,1
書式設定,下線,Ctrl+U,1
書式設定,取り消し線,Ctrl+5,2
書式設定,標準の書式,Ctrl+Shift+~,3
書式設定,通貨の書式,Ctrl+Shift+$,3
書式設定,パーセントの書式,Ctrl+Shift+%,2
書式設定,桁区切りの書式,Ctrl+Shift+!,3
書式設定,日付の書式,Ctrl+Shift+#,3
書式設定,時刻の書式,Ctrl+Shift+@,3
書式設定,外枠の罫線を適用,Ctrl+Shift+&,3
書式設定,罫線を削除,Ctrl+Shift+-,3
ナビゲーション,シートの先頭に移動,Ctrl+Home,2
ナビゲーション,シートの末尾に移動,Ctrl+End,2
ナビゲーション,次のシートに移動,Ctrl+PageDown,2
ナビゲーション,前のシートに移動,Ctrl+PageUp,2
ナビゲーション,データの端に移動（下）,Ctrl+ArrowDown,2
ナビゲーション,データの端に移動（右）,Ctrl+ArrowRight,2
ナビゲーション,データの端に移動（上）,Ctrl+ArrowUp,2
ナビゲーション,データの端に移動（左）,Ctrl+ArrowLeft,2
ナビゲーション,指定セルへ移動（名前ボックス）,Ctrl+G,2
挿入・削除,セルの挿入,Ctrl+Shift+=,2
挿入・削除,セルの削除,Ctrl+-,2
挿入・削除,行の挿入（行選択時）,Ctrl+Shift+=,2
挿入・削除,列の挿入（列選択時）,Ctrl+Shift+=,2
関数,SUM関数を挿入（オートSUM）,Alt+Shift+=,2
関数,関数の挿入ダイアログ,Shift+F3,2
関数,数式バーの展開/折りたたみ,Ctrl+Shift+U,3
関数,数式の表示/非表示切替,Ctrl+Shift+\`,3
表示,行の非表示,Ctrl+9,3
表示,行の再表示,Ctrl+Shift+9,3
表示,列の非表示,Ctrl+0,3
表示,ウィンドウの切り替え,Ctrl+F6,3
表示,リボンの表示/非表示,Ctrl+F1,2
再計算,ブック全体を再計算,F9,2
再計算,アクティブシートのみ再計算,Shift+F9,3
その他,VBEを表示,Alt+F11,3
その他,新しいシートを挿入,Shift+F11,2
その他,選択範囲にフィルターを適用,Ctrl+Shift+L,3
その他,ハイパーリンクの挿入,Ctrl+K,2
その他,名前の定義,Ctrl+F3,3
その他,グラフの挿入,Alt+F1,3
その他,マクロダイアログを表示,Alt+F8,3
その他,スペルチェック,F7,2
その他,テーブルの作成,Ctrl+T,2
その他,コメントの挿入,Shift+F2,2`,
  'Googleスプレッドシート': `category,operation,keys,difficulty
基本操作,コピー,Ctrl+C,1
基本操作,貼り付け,Ctrl+V,1
基本操作,切り取り,Ctrl+X,1
基本操作,元に戻す,Ctrl+Z,1
基本操作,やり直し,Ctrl+Y,1
基本操作,検索,Ctrl+F,1
基本操作,検索と置換,Ctrl+H,2
基本操作,全選択,Ctrl+A,1
基本操作,印刷,Ctrl+P,1
基本操作,値のみ貼り付け,Ctrl+Shift+V,2
基本操作,ファイルを開く,Ctrl+O,1
基本操作,リンクを挿入,Ctrl+K,2
セル編集,セルの編集モード,F2,1
セル編集,セル内で改行,Alt+Enter,2
セル編集,入力を確定して下に移動,Enter,1
セル編集,入力を確定して上に移動,Shift+Enter,2
セル編集,入力を確定して右に移動,Tab,1
セル編集,入力を確定して左に移動,Shift+Tab,2
セル編集,入力をキャンセル,Escape,1
セル編集,セルの内容をクリア,Delete,1
セル編集,セルにメモを挿入,Shift+F2,2
セル編集,セルにコメントを挿入,Ctrl+Alt+M,3
セル編集,現在の日付を入力,Ctrl+;,2
セル編集,現在の時刻を入力,Ctrl+Shift+;,2
セル編集,配列数式を入力,Ctrl+Shift+Enter,3
選択,行全体を選択,Shift+Space,2
選択,列全体を選択,Ctrl+Space,2
選択,選択範囲を1セル拡張（下）,Shift+ArrowDown,1
選択,選択範囲を1セル拡張（右）,Shift+ArrowRight,1
選択,選択範囲を1セル拡張（上）,Shift+ArrowUp,1
選択,選択範囲を1セル拡張（左）,Shift+ArrowLeft,1
選択,データの端まで選択（下）,Ctrl+Shift+ArrowDown,2
選択,データの端まで選択（右）,Ctrl+Shift+ArrowRight,2
選択,データの端まで選択（上）,Ctrl+Shift+ArrowUp,2
選択,データの端まで選択（左）,Ctrl+Shift+ArrowLeft,2
選択,先頭まで選択,Ctrl+Shift+Home,3
選択,末尾まで選択,Ctrl+Shift+End,3
書式設定,太字,Ctrl+B,1
書式設定,斜体,Ctrl+I,1
書式設定,下線,Ctrl+U,1
書式設定,取り消し線,Alt+Shift+5,2
書式設定,中央揃え,Ctrl+Shift+E,2
書式設定,左揃え,Ctrl+Shift+L,2
書式設定,右揃え,Ctrl+Shift+R,2
書式設定,上罫線を適用,Alt+Shift+1,3
書式設定,右罫線を適用,Alt+Shift+2,3
書式設定,下罫線を適用,Alt+Shift+3,3
書式設定,左罫線を適用,Alt+Shift+4,3
書式設定,罫線を削除,Alt+Shift+6,3
書式設定,外枠の罫線を適用,Alt+Shift+7,3
書式設定,日付の書式,Ctrl+Shift+3,3
書式設定,時刻の書式,Ctrl+Shift+2,3
書式設定,通貨の書式,Ctrl+Shift+4,3
書式設定,パーセントの書式,Ctrl+Shift+5,2
書式設定,小数点の書式,Ctrl+Shift+1,3
書式設定,書式をクリア,Ctrl+\\,3
ナビゲーション,シートの先頭に移動,Ctrl+Home,2
ナビゲーション,シートの末尾に移動,Ctrl+End,2
ナビゲーション,データの端に移動（下）,Ctrl+ArrowDown,2
ナビゲーション,データの端に移動（右）,Ctrl+ArrowRight,2
ナビゲーション,データの端に移動（上）,Ctrl+ArrowUp,2
ナビゲーション,データの端に移動（左）,Ctrl+ArrowLeft,2
ナビゲーション,次のシートに移動,Ctrl+PageDown,2
ナビゲーション,前のシートに移動,Ctrl+PageUp,2
ナビゲーション,シート一覧を表示,Alt+Shift+K,3
行・列操作,行を上に挿入,Ctrl+Alt+Shift+ArrowUp,3
行・列操作,行を下に挿入,Ctrl+Alt+Shift+ArrowDown,3
行・列操作,列を左に挿入,Ctrl+Alt+Shift+ArrowLeft,3
行・列操作,列を右に挿入,Ctrl+Alt+Shift+ArrowRight,3
行・列操作,行を削除,Ctrl+Alt+-,3
行・列操作,行を非表示,Ctrl+Alt+9,3
行・列操作,行を再表示,Ctrl+Shift+9,3
行・列操作,列を非表示,Ctrl+Alt+0,3
行・列操作,列を再表示,Ctrl+Shift+0,3
行・列操作,行をグループ化,Alt+Shift+ArrowRight,3
行・列操作,行のグループ化を解除,Alt+Shift+ArrowLeft,3
数式,数式バーの展開/折りたたみ,Ctrl+Shift+U,3
数式,数式の表示/非表示,Ctrl+\`,3
数式,SUM関数を挿入,Alt+=,2
その他,メニューを開く（スプレッドシート）,Alt+/,2
その他,フィルターの切替,Ctrl+Shift+L,3
その他,キーボードショートカット一覧,Ctrl+/,2
その他,データの入力規則,Alt+D,3
その他,条件付き書式,Alt+O,3`,
  'GAS': `category,operation,keys,difficulty
基本操作,保存,Ctrl+S,1
基本操作,元に戻す,Ctrl+Z,1
基本操作,やり直し,Ctrl+Y,1
基本操作,コピー,Ctrl+C,1
基本操作,貼り付け,Ctrl+V,1
基本操作,切り取り,Ctrl+X,1
基本操作,全選択,Ctrl+A,1
基本操作,プロジェクトを実行,Ctrl+R,2
編集,行の削除,Ctrl+Shift+K,2
編集,行を上に移動,Alt+ArrowUp,2
編集,行を下に移動,Alt+ArrowDown,2
編集,行を上にコピー,Shift+Alt+ArrowUp,3
編集,行を下にコピー,Shift+Alt+ArrowDown,3
編集,下に空行を挿入,Ctrl+Enter,2
編集,上に空行を挿入,Ctrl+Shift+Enter,2
編集,行のコメントアウト切替,Ctrl+/,2
編集,インデントを追加,Tab,1
編集,インデントを削除,Shift+Tab,1
編集,入力候補の表示（自動補完）,Ctrl+Space,2
編集,行の末尾まで削除,Ctrl+Shift+Backspace,3
編集,選択範囲を大文字に変換,Ctrl+Shift+U,3
編集,コードの整形（フォーマット）,Ctrl+Shift+I,3
ナビゲーション,指定行に移動,Ctrl+G,2
ナビゲーション,行の先頭に移動,Home,1
ナビゲーション,行の末尾に移動,End,1
ナビゲーション,ファイルの先頭に移動,Ctrl+Home,2
ナビゲーション,ファイルの末尾に移動,Ctrl+End,2
ナビゲーション,対応する括弧に移動,Ctrl+Shift+\\,3
ナビゲーション,次のエラーに移動,F8,2
ナビゲーション,前のエラーに移動,Shift+F8,3
ナビゲーション,定義に移動,F12,2
ナビゲーション,1単語右に移動,Ctrl+ArrowRight,2
ナビゲーション,1単語左に移動,Ctrl+ArrowLeft,2
選択,1単語ずつ選択（右）,Ctrl+Shift+ArrowRight,2
選択,1単語ずつ選択（左）,Ctrl+Shift+ArrowLeft,2
選択,行の先頭まで選択,Shift+Home,2
選択,行の末尾まで選択,Shift+End,2
選択,行を選択,Ctrl+L,2
選択,同じ単語を次に選択,Ctrl+D,2
選択,同じ単語を全て選択,Ctrl+Shift+L,3
検索,検索,Ctrl+F,1
検索,置換,Ctrl+H,2
検索,次の検索結果に移動,F3,2
検索,前の検索結果に移動,Shift+F3,2
検索,ファイル内を検索,Ctrl+Shift+F,2
デバッグ,デバッグを実行,Ctrl+Shift+D,2
デバッグ,ブレークポイントの設定/解除,F9,2
デバッグ,ステップイン,F11,2
デバッグ,ステップオーバー,F10,2
デバッグ,ステップアウト,Shift+F11,3
デバッグ,実行を停止,Shift+F5,2
表示,サイドバーの表示切替,Ctrl+Shift+E,3
表示,ズームイン,Ctrl+=,2
表示,ズームアウト,Ctrl+-,2
表示,コードの折りたたみ,Ctrl+Shift+[,3
表示,コードの展開,Ctrl+Shift+],3`,
  'Explorer': `category,operation,keys,difficulty
基本操作,戻る,Alt+ArrowLeft,1
基本操作,進む,Alt+ArrowRight,1
基本操作,一つ上のフォルダへ移動,Alt+ArrowUp,1
基本操作,フォルダを開く,Enter,1
基本操作,ファイル名の変更,F2,1
基本操作,新しいフォルダの作成,Ctrl+Shift+N,2
基本操作,削除,Delete,1
基本操作,完全に削除,Shift+Delete,2
基本操作,プロパティの表示,Alt+Enter,2
基本操作,アドレスバーに移動,Alt+D,2
検索・表示,検索ボックスに移動,Ctrl+E,2
検索・表示,プレビューパネルの切替,Alt+P,2
検索・表示,詳細パネルの切替,Alt+Shift+P,3
選択,全てのファイルを選択,Ctrl+A,1
選択,選択の切替,Ctrl+Space,2`,
  'Chrome': `category,operation,keys,difficulty
タブ管理,新しいタブを開く,Ctrl+T,1
タブ管理,タブを閉じる,Ctrl+W,1
タブ管理,閉じたタブを復元,Ctrl+Shift+T,1
タブ管理,新しいウィンドウ,Ctrl+N,1
タブ管理,シークレットウィンドウ,Ctrl+Shift+N,2
ナビゲーション,戻る,Alt+ArrowLeft,1
ナビゲーション,進む,Alt+ArrowRight,1
ナビゲーション,ページの先頭に移動,Home,1
ナビゲーション,ページの末尾に移動,End,1
ナビゲーション,ページを再読み込み,F5,1
ナビゲーション,強制再読み込み,Ctrl+Shift+R,2
ナビゲーション,アドレスバーに移動,Alt+D,1
ページ操作,ページ内検索,Ctrl+F,1
ページ操作,印刷,Ctrl+P,1
ページ操作,保存,Ctrl+S,2
ページ操作,ズームイン,Ctrl+Shift+=,2
ページ操作,ズームアウト,Ctrl+-,2
ページ操作,ズームリセット,Ctrl+0,2
ページ操作,全画面表示切替,F11,1
テキスト,コピー,Ctrl+C,1
テキスト,貼り付け,Ctrl+V,1
テキスト,切り取り,Ctrl+X,1
テキスト,全選択,Ctrl+A,1
テキスト,元に戻す,Ctrl+Z,1
テキスト,やり直し,Ctrl+Shift+Z,2
ブックマーク,ブックマークに追加,Ctrl+D,1
ブックマーク,ブックマークバーの表示切替,Ctrl+Shift+B,2
ブックマーク,ブックマークマネージャー,Ctrl+Shift+O,2
その他,ダウンロード一覧を開く,Ctrl+J,2
その他,履歴を開く,Ctrl+H,2
その他,閲覧履歴の削除,Ctrl+Shift+Delete,2
その他,デベロッパーツール,F12,2
その他,ソースの表示,Ctrl+U,3`,
  'Word': `category,operation,keys,difficulty
基本操作,コピー,Ctrl+C,1
基本操作,貼り付け,Ctrl+V,1
基本操作,切り取り,Ctrl+X,1
基本操作,元に戻す,Ctrl+Z,1
基本操作,やり直し,Ctrl+Y,1
基本操作,上書き保存,Ctrl+S,1
基本操作,名前を付けて保存,F12,1
基本操作,印刷,Ctrl+P,1
基本操作,全選択,Ctrl+A,1
基本操作,検索,Ctrl+F,1
基本操作,置換,Ctrl+H,2
書式設定,太字,Ctrl+B,1
書式設定,斜体,Ctrl+I,1
書式設定,下線,Ctrl+U,1
書式設定,フォントサイズを大きく,Ctrl+Shift+>,2
書式設定,フォントサイズを小さく,Ctrl+Shift+<,2
書式設定,中央揃え,Ctrl+E,2
書式設定,左揃え,Ctrl+L,1
書式設定,右揃え,Ctrl+R,2
書式設定,両端揃え,Ctrl+J,2
段落・リスト,インデントを増やす,Tab,1
段落・リスト,インデントを減らす,Shift+Tab,1
段落・リスト,行間を1行に設定,Ctrl+1,2
段落・リスト,行間を2行に設定,Ctrl+2,2
段落・リスト,行間を1.5行に設定,Ctrl+5,2
ナビゲーション,文書の先頭に移動,Ctrl+Home,1
ナビゲーション,文書の末尾に移動,Ctrl+End,1
ナビゲーション,1単語右に移動,Ctrl+ArrowRight,2
ナビゲーション,1単語左に移動,Ctrl+ArrowLeft,2
ナビゲーション,ジャンプ,Ctrl+G,2
選択,1単語ずつ選択（右）,Ctrl+Shift+ArrowRight,2
選択,1単語ずつ選択（左）,Ctrl+Shift+ArrowLeft,2
選択,行の先頭まで選択,Shift+Home,2
選択,行の末尾まで選択,Shift+End,2
その他,ハイパーリンクの挿入,Ctrl+K,2
その他,スペルチェック,F7,2
その他,改ページの挿入,Ctrl+Enter,2`,
  'PowerPoint': `category,operation,keys,difficulty
基本操作,コピー,Ctrl+C,1
基本操作,貼り付け,Ctrl+V,1
基本操作,切り取り,Ctrl+X,1
基本操作,元に戻す,Ctrl+Z,1
基本操作,やり直し,Ctrl+Y,1
基本操作,上書き保存,Ctrl+S,1
基本操作,印刷,Ctrl+P,1
基本操作,検索,Ctrl+F,1
基本操作,全選択,Ctrl+A,1
スライド操作,新しいスライドの追加,Ctrl+M,2
スライド操作,スライドショー開始（最初から）,F5,1
スライド操作,スライドショー開始（現在から）,Shift+F5,2
スライド操作,スライドの複製,Ctrl+D,2
スライド操作,スライドショー終了,Escape,1
書式設定,太字,Ctrl+B,1
書式設定,斜体,Ctrl+I,1
書式設定,下線,Ctrl+U,1
書式設定,中央揃え,Ctrl+E,2
書式設定,左揃え,Ctrl+L,1
書式設定,右揃え,Ctrl+R,2
その他,ハイパーリンクの挿入,Ctrl+K,2
その他,名前を付けて保存,F12,1`,
  'VSCode': `category,operation,keys,difficulty
基本操作,コピー,Ctrl+C,1
基本操作,貼り付け,Ctrl+V,1
基本操作,切り取り,Ctrl+X,1
基本操作,元に戻す,Ctrl+Z,1
基本操作,やり直し,Ctrl+Y,1
基本操作,上書き保存,Ctrl+S,1
基本操作,全選択,Ctrl+A,1
基本操作,検索,Ctrl+F,1
基本操作,置換,Ctrl+H,2
編集,行の削除,Ctrl+Shift+K,2
編集,行を上に移動,Alt+ArrowUp,2
編集,行を下に移動,Alt+ArrowDown,2
編集,行を上にコピー,Shift+Alt+ArrowUp,2
編集,行を下にコピー,Shift+Alt+ArrowDown,2
編集,下に空行を挿入,Ctrl+Enter,2
編集,行のコメントアウト切替,Ctrl+/,2
編集,ブロックコメント切替,Shift+Alt+A,3
マルチカーソル,同じ単語を次に選択,Ctrl+D,2
マルチカーソル,同じ単語を全て選択,Ctrl+Shift+L,3
ナビゲーション,ファイルを素早く開く,Ctrl+P,1
ナビゲーション,コマンドパレット,Ctrl+Shift+P,1
ナビゲーション,指定行に移動,Ctrl+G,2
ナビゲーション,定義に移動,F12,2
表示,サイドバー表示切替,Ctrl+B,1
表示,ズームイン,Ctrl+=,2
表示,ズームアウト,Ctrl+-,2`,
  'Windows共通': `category,operation,keys,difficulty
ウィンドウ操作,ウィンドウを最大化,Win+ArrowUp,1
ウィンドウ操作,ウィンドウを左半分にスナップ,Win+ArrowLeft,1
ウィンドウ操作,ウィンドウを右半分にスナップ,Win+ArrowRight,1
ウィンドウ操作,ウィンドウを最小化,Win+ArrowDown,1
ウィンドウ操作,全ウィンドウを最小化,Win+D,1
ウィンドウ操作,アプリの切替,Alt+Tab,1
ウィンドウ操作,タスクビュー,Win+Tab,2
システム,タスクマネージャー,Ctrl+Shift+Escape,2
システム,エクスプローラーを開く,Win+E,1
システム,設定を開く,Win+I,1
システム,ロック画面,Win+L,1
システム,スクリーンショット（全画面）,PrintScreen,1
システム,スクリーンショット（範囲選択）,Win+Shift+S,2
システム,クリップボード履歴,Win+V,2
システム,絵文字パネル,Win+.,2
システム,ファイル名を指定して実行,Win+R,2
デスクトップ,仮想デスクトップの追加,Ctrl+Win+D,3
デスクトップ,仮想デスクトップの切替（右）,Ctrl+Win+ArrowRight,3
デスクトップ,仮想デスクトップの切替（左）,Ctrl+Win+ArrowLeft,3
テキスト,全選択,Ctrl+A,1
テキスト,コピー,Ctrl+C,1
テキスト,貼り付け,Ctrl+V,1
テキスト,切り取り,Ctrl+X,1
テキスト,元に戻す,Ctrl+Z,1
テキスト,やり直し,Ctrl+Y,1`,
  'VBE': `category,operation,keys,difficulty
実行・デバッグ,マクロの実行/続行,F5,1
実行・デバッグ,ステップイン（1行ずつ実行）,F8,1
実行・デバッグ,ステップオーバー,Shift+F8,2
実行・デバッグ,ステップアウト,Ctrl+Shift+F8,3
実行・デバッグ,カーソル行まで実行,Ctrl+F8,2
実行・デバッグ,リセット（実行停止）,Ctrl+Break,2
実行・デバッグ,ブレークポイントの設定/解除,F9,1
実行・デバッグ,すべてのブレークポイントを解除,Ctrl+Shift+F9,3
編集,コピー,Ctrl+C,1
編集,貼り付け,Ctrl+V,1
編集,切り取り,Ctrl+X,1
編集,元に戻す,Ctrl+Z,1
編集,検索,Ctrl+F,1
編集,置換,Ctrl+H,2
編集,次を検索,F3,1
編集,前を検索,Shift+F3,2
編集,全選択,Ctrl+A,1
編集,インデントを追加,Tab,1
編集,インデントを削除,Shift+Tab,1
編集,入力候補の表示,Ctrl+Space,2
編集,クイックヒント,Ctrl+I,2
編集,定数の一覧表示,Ctrl+J,2
ナビゲーション,定義に移動,Shift+F2,2
ナビゲーション,呼び出し元に戻る,Ctrl+Shift+F2,3
ナビゲーション,オブジェクトブラウザー,F2,1
ナビゲーション,プロジェクトエクスプローラー,Ctrl+R,1
ナビゲーション,プロパティウィンドウ,F4,1
ナビゲーション,コードウィンドウ,F7,1
ナビゲーション,オブジェクトの表示,Shift+F7,2
ナビゲーション,イミディエイトウィンドウ,Ctrl+G,1
ウィンドウ操作,次のウィンドウに切替,Ctrl+F6,2
ウィンドウ操作,前のウィンドウに切替,Ctrl+Shift+F6,3
ウィンドウ操作,ウィンドウを閉じる,Ctrl+F4,2
選択,単語の選択,Ctrl+Shift+ArrowRight,2
選択,行末まで選択,Shift+End,2
選択,行頭まで選択,Shift+Home,2
ブックマーク,ブックマークの設定/解除,Ctrl+F2,2
その他,VBEを閉じてExcelに戻る,Alt+Q,1
その他,VBEを開く（Excelから）,Alt+F11,1`
};

// ===== DATA LOADING =====
async function loadSoftwareList() {
  // Clear the list and show loading state
  dom.softwareList.innerHTML = '<p class="sw-loading" style="color: var(--text-muted); text-align: center; grid-column: 1/-1;">読み込み中...</p>';

  let fileList = [];

  // Try to get manifest
  try {
    const resp = await fetch(`${DATA_DIR}/manifest.json`);
    if (resp.ok) {
      fileList = await resp.json();
    }
  } catch (e) {
    // ignore
  }

  if (fileList.length === 0) {
    fileList = Object.keys(FALLBACK_DATA);
  }

  // Remove loading message once we start adding items
  let loadingRemoved = false;
  function removeLoading() {
    if (!loadingRemoved) {
      const loadingEl = dom.softwareList.querySelector('.sw-loading');
      if (loadingEl) loadingEl.remove();
      loadingRemoved = true;
    }
  }

  // Load each software and render immediately when ready
  const loadPromises = fileList.map(name => loadAndRenderSoftware(name, removeLoading));
  await Promise.all(loadPromises);

  // If nothing loaded, show error
  if (state.availableSoftware.length === 0) {
    dom.softwareList.innerHTML = '<p style="color: var(--text-muted); text-align: center; grid-column: 1/-1;">CSVデータが見つかりません。<br><code>data/</code> フォルダにCSVファイルを配置してください。</p>';
  }
}

async function loadAndRenderSoftware(name, removeLoading) {
  let data = null;

  try {
    const resp = await fetch(`${DATA_DIR}/${name}.csv`);
    if (!resp.ok) throw new Error('not ok');
    const text = await resp.text();
    data = parseCSV(text).filter(q => q.keys && !isBlocked(q.keys));
  } catch (e) {
    // Try fallback
    if (FALLBACK_DATA[name]) {
      data = parseCSV(FALLBACK_DATA[name]).filter(q => q.keys && !isBlocked(q.keys));
    }
  }

  if (data && data.length > 0) {
    const sw = { name, filename: `${name}.csv`, data };
    state.availableSoftware.push(sw);
    removeLoading();
    appendSoftwareButton(sw);
  }
}

// ===== RENDER SOFTWARE LIST =====
function appendSoftwareButton(sw) {
  const btn = document.createElement('button');
  btn.className = 'software-btn sw-fade-in';
  btn.innerHTML = `<span class="sw-name">${sw.name}</span><span class="sw-count">${sw.data.length} 問</span>`;
  btn.addEventListener('click', () => selectSoftware(sw, btn));
  dom.softwareList.appendChild(btn);
}

function renderSoftwareList() {
  dom.softwareList.innerHTML = '';
  state.availableSoftware.forEach(sw => {
    appendSoftwareButton(sw);
  });

  if (state.availableSoftware.length === 0) {
    dom.softwareList.innerHTML = '<p style="color: var(--text-muted); text-align: center; grid-column: 1/-1;">CSVデータが見つかりません。<br><code>data/</code> フォルダにCSVファイルを配置してください。</p>';
  }
}

function selectSoftware(sw, btnEl) {
  document.querySelectorAll('.software-btn').forEach(b => b.classList.remove('selected'));
  btnEl.classList.add('selected');
  state.selectedSoftware = sw;
  dom.startBtn.disabled = false;

  // Populate category filter
  const categories = [...new Set(sw.data.map(q => q.category))];
  dom.categoryFilter.innerHTML = '<option value="all">すべて</option>';
  categories.forEach(cat => {
    const opt = document.createElement('option');
    opt.value = cat;
    opt.textContent = cat;
    dom.categoryFilter.appendChild(opt);
  });
}

// ===== SCREEN MANAGEMENT =====
function showScreen(screenId) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(screenId).classList.add('active');
}

// ===== GAME START =====
function startGame() {
  if (!state.selectedSoftware) return;

  let questions = [...state.selectedSoftware.data];

  // Filter by category
  const cat = dom.categoryFilter.value;
  if (cat !== 'all') {
    questions = questions.filter(q => q.category === cat);
  }

  // Shuffle if random
  if (dom.questionOrder.value === 'random') {
    shuffleArray(questions);
  }

  // Limit count
  const count = parseInt(dom.questionCount.value);
  if (count > 0 && questions.length > count) {
    questions = questions.slice(0, count);
  }

  if (questions.length === 0) {
    alert('選択した条件に該当する問題がありません。');
    return;
  }

  // Reset state
  state.questions = questions;
  state.currentIndex = 0;
  state.correctCount = 0;
  state.missCount = 0;
  state.missedQuestions = [];
  state.totalAnswerTime = 0;
  state.hintUsed = false;
  state.gameActive = true;

  // UI
  dom.totalQ.textContent = questions.length;
  dom.correctCount.textContent = '0';
  dom.missCount.textContent = '0';
  dom.progressBar.style.width = '0%';

  showScreen('game-screen');
  showQuestion();
  startTimer();
  SFX.start();
}

function shuffleArray(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

// ===== TIMER =====
function startTimer() {
  state.startTime = Date.now();
  state.timerInterval = setInterval(() => {
    const elapsed = Date.now() - state.startTime;
    dom.gameTimer.textContent = formatTime(elapsed);
  }, 100);
}

function stopTimer() {
  clearInterval(state.timerInterval);
}

function formatTime(ms) {
  const totalSec = Math.floor(ms / 1000);
  const min = Math.floor(totalSec / 60).toString().padStart(2, '0');
  const sec = (totalSec % 60).toString().padStart(2, '0');
  return `${min}:${sec}`;
}

// ===== SHOW QUESTION =====
function showQuestion() {
  const q = state.questions[state.currentIndex];
  dom.currentQ.textContent = state.currentIndex + 1;
  dom.questionCategory.textContent = q.category;
  dom.questionText.textContent = q.operation;

  // Reset input display
  dom.keyDisplay.innerHTML = '<span class="key-placeholder">キーを押してください...</span>';
  dom.keyDisplay.className = 'key-display';
  dom.feedback.classList.add('hidden');
  dom.hintText.classList.add('hidden');
  dom.hintBtn.style.display = '';
  state.hintUsed = false;
  state.choiceAnswered = false;

  // Update progress
  const progress = (state.currentIndex / state.questions.length) * 100;
  dom.progressBar.style.width = `${progress}%`;

  // Generate and render choices
  renderChoices(q.keys);

  state.questionStartTime = Date.now();
}

// ===== KEY INPUT HANDLING =====
function keyToDisplayName(key) {
  const map = {
    'control': 'Ctrl',
    'shift': 'Shift',
    'alt': 'Alt',
    'meta': 'Win',
    'arrowup': '↑',
    'arrowdown': '↓',
    'arrowleft': '←',
    'arrowright': '→',
    'enter': 'Enter',
    'escape': 'Esc',
    'backspace': 'Backspace',
    'delete': 'Delete',
    'tab': 'Tab',
    'space': 'Space',
    ' ': 'Space',
    'home': 'Home',
    'end': 'End',
    'pageup': 'PageUp',
    'pagedown': 'PageDown',
    'insert': 'Insert',
  };
  const lower = key.toLowerCase();
  if (map[lower]) return map[lower];
  if (lower.startsWith('f') && !isNaN(lower.slice(1))) return key.toUpperCase();
  if (key.length === 1) return key.toUpperCase();
  return key;
}

function buildInputKeys(e) {
  const parts = [];
  if (e.ctrlKey) parts.push('Ctrl');
  if (e.shiftKey) parts.push('Shift');
  if (e.altKey) parts.push('Alt');

  const key = e.key;
  // Don't add modifier keys themselves
  if (!['Control', 'Shift', 'Alt', 'Meta'].includes(key)) {
    parts.push(keyToDisplayName(key));
  }

  return parts;
}

function buildInputString(e) {
  const parts = buildInputKeys(e);
  return parts.join('+');
}

function renderKeyBadges(parts) {
  if (parts.length === 0) {
    dom.keyDisplay.innerHTML = '<span class="key-placeholder">キーを押してください...</span>';
    return;
  }

  dom.keyDisplay.innerHTML = parts.map((p, i) => {
    const badge = `<span class="key-badge">${p}</span>`;
    return i < parts.length - 1 ? badge + '<span class="key-plus">+</span>' : badge;
  }).join('');
}

function normalizeInput(str) {
  return str
    .replace(/\s/g, '')
    .split('+')
    .map(k => {
      const lower = k.toLowerCase();
      // Map common aliases
      const aliases = {
        'ctrl': 'ctrl',
        'control': 'ctrl',
        'shift': 'shift',
        'alt': 'alt',
        'option': 'alt',
        '↑': 'arrowup',
        '↓': 'arrowdown',
        '←': 'arrowleft',
        '→': 'arrowright',
        'up': 'arrowup',
        'down': 'arrowdown',
        'left': 'arrowleft',
        'right': 'arrowright',
        'space': ' ',
        'esc': 'escape',
        'del': 'delete',
        'pgup': 'pageup',
        'pgdn': 'pagedown',
        'pgdown': 'pagedown',
        'ins': 'insert',
      };
      return aliases[lower] || lower;
    })
    .sort()
    .join('+');
}

// ===== KEYBOARD LAYOUT FOR CHOICE GENERATION =====
// QWERTY keyboard layout with row/column positions
const KEYBOARD_LAYOUT = {
  // Row 0: Number row
  '1': [0, 0], '2': [0, 1], '3': [0, 2], '4': [0, 3], '5': [0, 4],
  '6': [0, 5], '7': [0, 6], '8': [0, 7], '9': [0, 8], '0': [0, 9],
  '-': [0, 10], '=': [0, 11],
  // Row 1: QWERTY row
  'Q': [1, 0], 'W': [1, 1], 'E': [1, 2], 'R': [1, 3], 'T': [1, 4],
  'Y': [1, 5], 'U': [1, 6], 'I': [1, 7], 'O': [1, 8], 'P': [1, 9],
  '[': [1, 10], ']': [1, 11],
  // Row 2: ASDF row
  'A': [2, 0], 'S': [2, 1], 'D': [2, 2], 'F': [2, 3], 'G': [2, 4],
  'H': [2, 5], 'J': [2, 6], 'K': [2, 7], 'L': [2, 8],
  ';': [2, 9], "'": [2, 10],
  // Row 3: ZXCV row
  'Z': [3, 0], 'X': [3, 1], 'C': [3, 2], 'V': [3, 3], 'B': [3, 4],
  'N': [3, 5], 'M': [3, 6], ',': [3, 7], '.': [3, 8], '/': [3, 9],
};

// Special keys that can substitute for each other
const SPECIAL_KEY_GROUPS = {
  arrows: ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'],
  fkeys: ['F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7', 'F8', 'F9', 'F10', 'F11', 'F12'],
  nav: ['Home', 'End', 'PageUp', 'PageDown'],
  editing: ['Enter', 'Tab', 'Backspace', 'Delete', 'Escape', 'Space', 'Insert'],
};

function getKeyboardDistance(k1, k2) {
  const p1 = KEYBOARD_LAYOUT[k1.toUpperCase()];
  const p2 = KEYBOARD_LAYOUT[k2.toUpperCase()];
  if (!p1 || !p2) return Infinity;
  return Math.abs(p1[0] - p2[0]) + Math.abs(p1[1] - p2[1]);
}

function generateWrongChoices(correctKeys, count) {
  const parts = correctKeys.split('+').map(k => k.trim());
  const modifiers = parts.filter(k => ['Ctrl', 'Shift', 'Alt', 'Win'].includes(k));
  const mainKeys = parts.filter(k => !['Ctrl', 'Shift', 'Alt', 'Win'].includes(k));
  const mainKey = mainKeys.length > 0 ? mainKeys[mainKeys.length - 1] : null;

  const wrongChoices = new Set();
  const normalizedCorrect = normalizeInput(correctKeys);

  if (mainKey) {
    const upperMain = mainKey.toUpperCase();

    // Check if it's a special key group
    let specialGroup = null;
    for (const [group, keys] of Object.entries(SPECIAL_KEY_GROUPS)) {
      if (keys.some(k => k.toLowerCase() === mainKey.toLowerCase())) {
        specialGroup = keys.filter(k => k.toLowerCase() !== mainKey.toLowerCase());
        break;
      }
    }

    if (specialGroup && specialGroup.length > 0) {
      // For special keys (arrows, F-keys, etc.), pick from same group
      const shuffled = [...specialGroup].sort(() => Math.random() - 0.5);
      for (const altKey of shuffled) {
        if (wrongChoices.size >= count) break;
        const candidate = [...modifiers, altKey].join('+');
        if (normalizeInput(candidate) !== normalizedCorrect) {
          wrongChoices.add(candidate);
        }
      }
    }

    // For regular letter/number keys, find nearby keys (distance 2-4)
    if (KEYBOARD_LAYOUT[upperMain]) {
      const candidates = Object.keys(KEYBOARD_LAYOUT)
        .filter(k => {
          const dist = getKeyboardDistance(upperMain, k);
          return dist >= 2 && dist <= 4 && k !== upperMain;
        })
        .sort(() => Math.random() - 0.5);

      for (const altKey of candidates) {
        if (wrongChoices.size >= count) break;
        const candidate = [...modifiers, altKey].join('+');
        if (normalizeInput(candidate) !== normalizedCorrect) {
          wrongChoices.add(candidate);
        }
      }
    }

    // Fallback: vary modifiers slightly
    if (wrongChoices.size < count) {
      const modVariants = [
        [...modifiers.filter(m => m !== 'Shift'), 'Shift'],
        [...modifiers.filter(m => m !== 'Ctrl'), 'Ctrl'],
        [...modifiers.filter(m => m !== 'Alt'), 'Alt'],
        modifiers.filter(m => m !== 'Shift'),
      ];
      for (const mods of modVariants) {
        if (wrongChoices.size >= count) break;
        const uniqueMods = [...new Set(mods)].filter(Boolean);
        if (uniqueMods.length === 0 && mainKeys.length > 0) continue;
        const candidate = [...uniqueMods, mainKey].join('+');
        if (normalizeInput(candidate) !== normalizedCorrect && candidate !== mainKey) {
          wrongChoices.add(candidate);
        }
      }
    }
  }

  // Ultimate fallback: pick from other questions in the current set
  if (wrongChoices.size < count && state.questions) {
    const otherKeys = state.questions
      .map(q => q.keys)
      .filter(k => normalizeInput(k) !== normalizedCorrect)
      .sort(() => Math.random() - 0.5);
    for (const k of otherKeys) {
      if (wrongChoices.size >= count) break;
      wrongChoices.add(k);
    }
  }

  return [...wrongChoices].slice(0, count);
}

function renderChoices(correctKeys) {
  const grid = document.getElementById('choices-grid');
  grid.innerHTML = '';

  const wrongChoices = generateWrongChoices(correctKeys, 2);
  const allChoices = [correctKeys, ...wrongChoices];

  // Shuffle choices
  for (let i = allChoices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [allChoices[i], allChoices[j]] = [allChoices[j], allChoices[i]];
  }

  allChoices.forEach(keys => {
    const btn = document.createElement('button');
    btn.className = 'choice-btn';
    // Render key badges inside the button
    const parts = keys.split('+').map(k => k.trim());
    btn.innerHTML = parts.map((p, i) => {
      const badge = `<span class="choice-key-badge">${friendlyKeys(p)}</span>`;
      return i < parts.length - 1 ? badge + '<span class="choice-plus">+</span>' : badge;
    }).join('');
    btn.dataset.keys = keys;
    btn.addEventListener('click', () => handleChoiceClick(btn, keys, correctKeys));
    grid.appendChild(btn);
  });
}

function handleChoiceClick(btn, selectedKeys, correctKeys) {
  if (state.choiceAnswered || !state.gameActive) return;
  state.choiceAnswered = true;

  const isCorrect = normalizeInput(selectedKeys) === normalizeInput(correctKeys);

  // Disable all choice buttons
  document.querySelectorAll('.choice-btn').forEach(b => b.classList.add('choice-disabled'));

  // Show the selected key in the key-display area
  const parts = selectedKeys.split('+').map(k => friendlyKeys(k.trim()));
  renderKeyBadges(parts);

  if (isCorrect) {
    btn.classList.add('choice-correct');
    // Also highlight correct in key-display
    dom.keyDisplay.classList.add('correct');
    handleCorrect();
  } else {
    btn.classList.add('choice-wrong');
    dom.keyDisplay.classList.add('wrong');
    // Highlight the correct answer
    document.querySelectorAll('.choice-btn').forEach(b => {
      if (normalizeInput(b.dataset.keys) === normalizeInput(correctKeys)) {
        b.classList.add('choice-correct');
      }
    });
    handleWrong(selectedKeys, correctKeys);
  }
}

function handleKeyDown(e) {
  if (!state.gameActive) return;
  // Don't intercept keys when typing in ranking name input
  if (document.activeElement && document.activeElement.id === 'ranking-name-input') return;

  e.preventDefault();
  e.stopPropagation();

  const key = e.key;

  // Ignore standalone modifier keys
  if (['Control', 'Shift', 'Alt', 'Meta'].includes(key)) {
    // Show partial modifiers being held
    const parts = buildInputKeys(e);
    if (parts.length > 0) {
      renderKeyBadges(parts);
      dom.keyDisplay.classList.add('active');
    }
    return;
  }

  dom.keyDisplay.classList.remove('active');

  const inputParts = buildInputKeys(e);
  renderKeyBadges(inputParts);
  const inputStr = inputParts.join('+');

  // Check answer
  const q = state.questions[state.currentIndex];
  const isCorrect = normalizeInput(inputStr) === normalizeInput(q.keys);

  if (isCorrect) {
    handleCorrect();
  } else {
    handleWrong(inputStr, q.keys);
  }
}

function handleKeyUp(e) {
  if (!state.gameActive) return;
  e.preventDefault();
  // Reset display if all keys released
  if (!e.ctrlKey && !e.shiftKey && !e.altKey) {
    dom.keyDisplay.classList.remove('active');
  }
}

function handleCorrect() {
  state.correctCount++;
  dom.correctCount.textContent = state.correctCount;

  const answerTime = Date.now() - state.questionStartTime;
  state.totalAnswerTime += answerTime;

  dom.keyDisplay.classList.add('correct');
  dom.feedback.textContent = '✅ 正解！';
  dom.feedback.className = 'feedback correct-feedback';
  SFX.correct();

  // Disable choices and highlight correct one
  state.choiceAnswered = true;
  const q = state.questions[state.currentIndex];
  document.querySelectorAll('.choice-btn').forEach(b => {
    b.classList.add('choice-disabled');
    if (normalizeInput(b.dataset.keys) === normalizeInput(q.keys)) {
      b.classList.add('choice-correct');
    }
  });

  setTimeout(() => nextQuestion(), 800);
}

function handleWrong(inputStr, correctKeys) {
  state.missCount++;
  dom.missCount.textContent = state.missCount;

  // Track missed question (only first miss per question)
  const q = state.questions[state.currentIndex];
  if (!state.missedQuestions.find(m => m.index === state.currentIndex)) {
    state.missedQuestions.push({
      index: state.currentIndex,
      operation: q.operation,
      correctKeys: q.keys,
      yourInput: inputStr,
    });
  }

  dom.keyDisplay.classList.add('wrong');
  dom.feedback.textContent = `❌ ミス — もう一度！`;
  dom.feedback.className = 'feedback wrong-feedback';
  SFX.wrong();

  setTimeout(() => {
    dom.keyDisplay.classList.remove('wrong');
    dom.keyDisplay.innerHTML = '<span class="key-placeholder">キーを押してください...</span>';
    // Reset choice buttons so user can try again
    state.choiceAnswered = false;
    document.querySelectorAll('.choice-btn').forEach(b => {
      b.classList.remove('choice-disabled', 'choice-wrong', 'choice-correct');
    });
    dom.feedback.classList.add('hidden');
  }, 600);
}

// ===== NEXT QUESTION / END =====
function nextQuestion() {
  state.currentIndex++;
  if (state.currentIndex >= state.questions.length) {
    endGame();
  } else {
    showQuestion();
  }
}

function skipQuestion() {
  const q = state.questions[state.currentIndex];
  state.missCount++;
  dom.missCount.textContent = state.missCount;
  if (!state.missedQuestions.find(m => m.index === state.currentIndex)) {
    state.missedQuestions.push({
      index: state.currentIndex,
      operation: q.operation,
      correctKeys: q.keys,
      yourInput: '(スキップ)',
    });
  }
  const answerTime = Date.now() - state.questionStartTime;
  state.totalAnswerTime += answerTime;
  nextQuestion();
}

// ===== END GAME =====
function endGame() {
  state.gameActive = false;
  stopTimer();

  const totalTime = Date.now() - state.startTime;
  const totalQ = state.questions.length;
  const accuracy = totalQ > 0 ? Math.round((state.correctCount / totalQ) * 100) : 0;
  const avgTime = totalQ > 0 ? (state.totalAnswerTime / totalQ / 1000).toFixed(1) : 0;

  // Determine rank
  let rank = 'D';
  if (accuracy >= 95 && avgTime <= 3) rank = 'S';
  else if (accuracy >= 90 && avgTime <= 5) rank = 'A';
  else if (accuracy >= 75) rank = 'B';
  else if (accuracy >= 50) rank = 'C';

  // Update result screen
  dom.resultRank.textContent = rank;
  dom.resultAccuracy.textContent = `${accuracy}%`;
  dom.resultTime.textContent = formatTime(totalTime);
  dom.resultAvg.textContent = `${avgTime}s`;
  dom.resultMisses.textContent = state.missCount;

  // Show rank color
  const rankColors = {
    'S': 'linear-gradient(135deg, #fbbf24, #f59e0b, #ef4444, #ec4899)',
    'A': 'linear-gradient(135deg, #34d399, #10b981)',
    'B': 'linear-gradient(135deg, #60a5fa, #3b82f6)',
    'C': 'linear-gradient(135deg, #f59e0b, #d97706)',
    'D': 'linear-gradient(135deg, #94a3b8, #64748b)',
  };
  dom.resultRank.style.background = rankColors[rank];
  dom.resultRank.style.webkitBackgroundClip = 'text';
  dom.resultRank.style.webkitTextFillColor = 'transparent';
  dom.resultRank.style.backgroundClip = 'text';

  // Missed questions list
  if (state.missedQuestions.length > 0) {
    dom.resultDetails.style.display = '';
    dom.missedList.innerHTML = state.missedQuestions.map(m =>
      `<div class="missed-item">
        <span class="missed-operation">${m.operation}</span>
        <span class="missed-answer">正解: ${friendlyKeys(m.correctKeys)}</span>
      </div>`
    ).join('');
  } else {
    dom.resultDetails.style.display = '';
    dom.missedList.innerHTML = '<div class="all-correct-msg">🎉 全問正解！パーフェクト！</div>';
  }

  showScreen('result-screen');
  SFX.fanfare();

  // Reset ranking register section
  const registerSection = document.getElementById('ranking-register-section');
  const registerMsg = document.getElementById('ranking-register-msg');
  const registerBtn = document.getElementById('ranking-register-btn');
  const nameInput = document.getElementById('ranking-name-input');
  registerSection.style.display = '';
  registerBtn.disabled = false;
  registerMsg.classList.add('hidden');
  nameInput.value = localStorage.getItem('keydrill_last_name') || '';

  // Save to localStorage
  saveScore({
    software: state.selectedSoftware.name,
    date: new Date().toISOString(),
    rank, accuracy, totalTime, avgTime: parseFloat(avgTime),
    missCount: state.missCount,
    totalQuestions: totalQ,
  });
}

// ===== SCORE SAVING =====
function saveScore(score) {
  try {
    const scores = JSON.parse(localStorage.getItem('keydrill_scores') || '[]');
    scores.push(score);
    // Keep last 100 scores
    if (scores.length > 100) scores.splice(0, scores.length - 100);
    localStorage.setItem('keydrill_scores', JSON.stringify(scores));
  } catch (e) {
    // ignore
  }
}

// ===== RANKING SYSTEM =====
function registerRanking() {
  const nameInput = document.getElementById('ranking-name-input');
  const msg = document.getElementById('ranking-register-msg');
  const registerBtn = document.getElementById('ranking-register-btn');
  const name = nameInput.value.trim();

  if (!name) {
    msg.textContent = '❌ 名前を入力してください';
    msg.className = 'ranking-register-msg error';
    return;
  }

  // Save last used name
  localStorage.setItem('keydrill_last_name', name);

  const totalQ = state.questions.length;
  const accuracy = totalQ > 0 ? Math.round((state.correctCount / totalQ) * 100) : 0;
  const totalTime = Date.now() - state.startTime;
  const avgTime = totalQ > 0 ? (state.totalAnswerTime / totalQ / 1000).toFixed(1) : '0.0';

  let rank = 'D';
  if (accuracy >= 95 && parseFloat(avgTime) <= 3) rank = 'S';
  else if (accuracy >= 90 && parseFloat(avgTime) <= 5) rank = 'A';
  else if (accuracy >= 75) rank = 'B';
  else if (accuracy >= 50) rank = 'C';

  const entry = {
    name,
    software: state.selectedSoftware.name,
    rank,
    accuracy,
    avgTime: parseFloat(avgTime),
    totalTime,
    missCount: state.missCount,
    totalQuestions: totalQ,
    date: new Date().toISOString(),
  };

  try {
    const rankings = JSON.parse(localStorage.getItem('keydrill_rankings') || '[]');
    rankings.push(entry);
    // Keep top 200 entries overall
    if (rankings.length > 200) {
      rankings.sort((a, b) => b.accuracy - a.accuracy || a.avgTime - b.avgTime);
      rankings.splice(200);
    }
    localStorage.setItem('keydrill_rankings', JSON.stringify(rankings));
  } catch (e) {
    // ignore
  }

  msg.textContent = '✅ ランキングに登録しました！';
  msg.className = 'ranking-register-msg';
  registerBtn.disabled = true;
}

function getRankings(softwareName) {
  try {
    const rankings = JSON.parse(localStorage.getItem('keydrill_rankings') || '[]');
    return rankings
      .filter(r => r.software === softwareName)
      .sort((a, b) => {
        // Sort by accuracy (desc), then avgTime (asc)
        if (b.accuracy !== a.accuracy) return b.accuracy - a.accuracy;
        return a.avgTime - b.avgTime;
      })
      .slice(0, 10); // Top 10
  } catch (e) {
    return [];
  }
}

function showRankingScreen() {
  showScreen('ranking-screen');

  const tabsContainer = document.getElementById('ranking-software-tabs');
  tabsContainer.innerHTML = '';

  // Create tabs for each software
  const softwareNames = state.availableSoftware.map(s => s.name);
  const defaultSoftware = (state.selectedSoftware && state.selectedSoftware.name) || softwareNames[0] || '';

  softwareNames.forEach(name => {
    const tab = document.createElement('button');
    tab.className = 'ranking-tab' + (name === defaultSoftware ? ' active' : '');
    tab.textContent = name;
    tab.addEventListener('click', () => {
      tabsContainer.querySelectorAll('.ranking-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      renderRankingTable(name);
    });
    tabsContainer.appendChild(tab);
  });

  renderRankingTable(defaultSoftware);
}

function renderRankingTable(softwareName) {
  const tbody = document.getElementById('ranking-table-body');
  const emptyMsg = document.getElementById('ranking-empty-msg');
  const table = document.getElementById('ranking-table');
  const rankings = getRankings(softwareName);

  if (rankings.length === 0) {
    table.style.display = 'none';
    emptyMsg.classList.remove('hidden');
    return;
  }

  table.style.display = '';
  emptyMsg.classList.add('hidden');

  const rankColors = {
    'S': '#fbbf24', 'A': '#34d399', 'B': '#60a5fa', 'C': '#f59e0b', 'D': '#94a3b8'
  };
  const medals = ['🥇', '🥈', '🥉'];

  tbody.innerHTML = rankings.map((r, i) => {
    const dateStr = new Date(r.date).toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' });
    const medal = i < 3 ? medals[i] : `${i + 1}`;
    const rankColor = rankColors[r.rank] || '#94a3b8';
    return `<tr>
      <td>${medal}</td>
      <td>${escapeHtml(r.name)}</td>
      <td><span class="rank-badge" style="color: ${rankColor}">${r.rank}</span></td>
      <td>${r.accuracy}%</td>
      <td>${r.avgTime}s</td>
      <td>${dateStr}</td>
    </tr>`;
  }).join('');
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// ===== FRIENDLY KEY DISPLAY =====
// Convert CSV key notation to user-friendly display
function friendlyKeys(keysStr) {
  const map = {
    'ArrowUp': '↑',
    'ArrowDown': '↓',
    'ArrowLeft': '←',
    'ArrowRight': '→',
    'PageUp': 'PageUp',
    'PageDown': 'PageDown',
    'Escape': 'Esc',
    'Delete': 'Delete',
    'Backspace': 'Backspace',
    'Enter': 'Enter',
    'Tab': 'Tab',
    'Home': 'Home',
    'End': 'End',
    'Insert': 'Insert',
    'PrintScreen': 'PrtSc',
    'Space': 'Space',
    'Comma': ',',
  };
  return keysStr.split('+').map(k => {
    const trimmed = k.trim();
    return map[trimmed] || trimmed;
  }).join(' + ');
}

// ===== HINT =====
function showHint() {
  const q = state.questions[state.currentIndex];
  dom.hintText.textContent = `💡 正解: ${friendlyKeys(q.keys)}`;
  dom.hintText.classList.remove('hidden');
  dom.hintBtn.style.display = 'none';
  state.hintUsed = true;
}

// ===== X (TWITTER) SHARE =====
function shareToX() {
  const rank = dom.resultRank.textContent;
  const accuracy = dom.resultAccuracy.textContent;
  const avgTime = dom.resultAvg.textContent;
  const software = state.selectedSoftware ? state.selectedSoftware.name : '';
  const totalQ = state.questions ? state.questions.length : 0;
  const misses = state.missCount;

  const rankEmoji = {
    'S': '🏆', 'A': '⭐', 'B': '🔥', 'C': '💪', 'D': '📝'
  }[rank] || '⌨️';

  const text = [
    `${rankEmoji} KeyDrillで${software}のショートカットキー訓練！`,
    ``,
    `🎯 ランク: ${rank}`,
    `✅ 正答率: ${accuracy}`,
    `⏱️ 平均回答: ${avgTime}`,
    `❌ ミス: ${misses}回 / ${totalQ}問`,
    ``,
    `ショートカットキーをゲーム感覚で練習しよう！`,
    `#KeyDrill #ショートカットキー訓練`,
  ].join('\n');

  const url = 'https://darling-valkyrie-f16e3d.netlify.app/';
  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
  window.open(twitterUrl, '_blank', 'width=550,height=420');
}

// ===== PARTICLES BACKGROUND =====
function initParticles() {
  const canvas = document.getElementById('particles-canvas');
  const ctx = canvas.getContext('2d');
  let particles = [];
  const PARTICLE_COUNT = 50;

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  function createParticle() {
    return {
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      size: Math.random() * 2 + 0.5,
      alpha: Math.random() * 0.3 + 0.1,
    };
  }

  function init() {
    resize();
    particles = Array.from({ length: PARTICLE_COUNT }, createParticle);
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    particles.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;

      if (p.x < 0) p.x = canvas.width;
      if (p.x > canvas.width) p.x = 0;
      if (p.y < 0) p.y = canvas.height;
      if (p.y > canvas.height) p.y = 0;

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(99, 102, 241, ${p.alpha})`;
      ctx.fill();
    });

    // Draw connections
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 150) {
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.strokeStyle = `rgba(99, 102, 241, ${0.06 * (1 - dist / 150)})`;
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
      }
    }

    requestAnimationFrame(draw);
  }

  window.addEventListener('resize', resize);
  init();
  draw();
}

// ===== EVENT LISTENERS =====
function setupEvents() {
  dom.startBtn.addEventListener('click', startGame);
  dom.hintBtn.addEventListener('click', showHint);
  dom.skipBtn.addEventListener('click', skipQuestion);

  dom.retryBtn.addEventListener('click', () => {
    startGame();
  });

  dom.backBtn.addEventListener('click', () => {
    showScreen('title-screen');
  });

  document.getElementById('share-x-btn').addEventListener('click', shareToX);

  // Ranking buttons
  document.getElementById('ranking-btn').addEventListener('click', showRankingScreen);
  document.getElementById('ranking-register-btn').addEventListener('click', registerRanking);
  document.getElementById('ranking-back-btn').addEventListener('click', () => {
    showScreen('title-screen');
  });

  document.addEventListener('keydown', handleKeyDown);
  document.addEventListener('keyup', handleKeyUp);

  // Prevent browser defaults globally during game
  window.addEventListener('beforeunload', (e) => {
    if (state.gameActive) {
      e.preventDefault();
      e.returnValue = '';
    }
  });
}

// ===== INIT =====
async function init() {
  initParticles();
  setupEvents();
  await loadSoftwareList();
}

document.addEventListener('DOMContentLoaded', init);
