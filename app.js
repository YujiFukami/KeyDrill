/* ==========================================
   KeyDrill — Main Application Logic
   ========================================== */

// ===== CONFIGURATION =====
const DATA_DIR = 'data';

// Shortcuts that cannot be prevented by the browser
const BLOCKED_SHORTCUTS = [
  'Alt+F4',
  'Ctrl+W',
  'Ctrl+T',
  'Ctrl+N',
  'Ctrl+Shift+W',
  'Ctrl+Shift+T',
  'Ctrl+Shift+N',
  'Ctrl+Tab',
  'Ctrl+Shift+Tab',
  'F11',
  'Ctrl+Shift+Q',
  'Ctrl+Shift+I',
  'Ctrl+Shift+J',
  'F12',
  'Ctrl+L',
  'Ctrl+Shift+Delete',
  'Alt+Home',
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
セル編集,セルの編集モード,F2,1
セル編集,セル内で改行,Alt+Enter,2
セル編集,今日の日付を入力,Ctrl+;,2
セル編集,現在の時刻を入力,Ctrl+:,2
セル編集,上のセルをコピー,Ctrl+D,2
セル編集,左のセルをコピー,Ctrl+R,2
セル編集,セルの削除,Delete,1
セル編集,行全体を選択,Shift+Space,2
セル編集,列全体を選択,Ctrl+Space,2
書式設定,セルの書式設定を表示,Ctrl+1,2
書式設定,太字,Ctrl+B,1
書式設定,斜体,Ctrl+I,1
書式設定,下線,Ctrl+U,1
書式設定,取り消し線,Ctrl+5,2
書式設定,標準の書式,Ctrl+Shift+~,3
書式設定,通貨の書式,Ctrl+Shift+$,3
書式設定,パーセントの書式,Ctrl+Shift+%,2
書式設定,桁区切りの書式,Ctrl+Shift+!,3
ナビゲーション,シートの先頭に移動,Ctrl+Home,2
ナビゲーション,シートの末尾に移動,Ctrl+End,2
ナビゲーション,次のシートに移動,Ctrl+PageDown,2
ナビゲーション,前のシートに移動,Ctrl+PageUp,2
ナビゲーション,データの端に移動（下）,Ctrl+ArrowDown,2
ナビゲーション,データの端に移動（右）,Ctrl+ArrowRight,2
ナビゲーション,データの端に移動（上）,Ctrl+ArrowUp,2
ナビゲーション,データの端に移動（左）,Ctrl+ArrowLeft,2
その他,VBEを表示,Alt+F11,3
その他,新しいシートを挿入,Shift+F11,2
その他,数式バーの展開/折りたたみ,Ctrl+Shift+U,3
その他,選択範囲にフィルターを適用,Ctrl+Shift+L,3
その他,ハイパーリンクの挿入,Ctrl+K,2
その他,名前の定義,Ctrl+F3,3
その他,グラフの挿入,Alt+F1,3`,
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
選択,選択の切替,Ctrl+Space,2`
};

// ===== DATA LOADING =====
async function loadSoftwareList() {
  const software = [];
  let usedFallback = false;

  // Try to load from server (works with http:// but not file://)
  try {
    let fileList = [];
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

    for (const name of fileList) {
      try {
        const resp = await fetch(`${DATA_DIR}/${name}.csv`);
        if (!resp.ok) throw new Error('not ok');
        const text = await resp.text();
        const data = parseCSV(text).filter(q => q.keys && !isBlocked(q.keys));
        if (data.length > 0) {
          software.push({ name, filename: `${name}.csv`, data });
        }
      } catch (e) {
        // Try fallback for this specific software
        if (FALLBACK_DATA[name]) {
          const data = parseCSV(FALLBACK_DATA[name]).filter(q => q.keys && !isBlocked(q.keys));
          if (data.length > 0) {
            software.push({ name, filename: `${name}.csv`, data });
            usedFallback = true;
          }
        }
      }
    }
  } catch (e) {
    // Full fallback: use all embedded data
    for (const [name, csv] of Object.entries(FALLBACK_DATA)) {
      const data = parseCSV(csv).filter(q => q.keys && !isBlocked(q.keys));
      if (data.length > 0) {
        software.push({ name, filename: `${name}.csv`, data });
      }
    }
    usedFallback = true;
  }

  // If still empty, use all fallback data
  if (software.length === 0) {
    for (const [name, csv] of Object.entries(FALLBACK_DATA)) {
      const data = parseCSV(csv).filter(q => q.keys && !isBlocked(q.keys));
      if (data.length > 0) {
        software.push({ name, filename: `${name}.csv`, data });
      }
    }
  }

  state.availableSoftware = software;
  renderSoftwareList();
}

// ===== RENDER SOFTWARE LIST =====
function renderSoftwareList() {
  dom.softwareList.innerHTML = '';
  state.availableSoftware.forEach(sw => {
    const btn = document.createElement('button');
    btn.className = 'software-btn';
    btn.innerHTML = `<span class="sw-name">${sw.name}</span><span class="sw-count">${sw.data.length} 問</span>`;
    btn.addEventListener('click', () => selectSoftware(sw, btn));
    dom.softwareList.appendChild(btn);
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

  // Update progress
  const progress = (state.currentIndex / state.questions.length) * 100;
  dom.progressBar.style.width = `${progress}%`;

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

function handleKeyDown(e) {
  if (!state.gameActive) return;

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

  setTimeout(() => {
    dom.keyDisplay.classList.remove('wrong');
    dom.keyDisplay.innerHTML = '<span class="key-placeholder">キーを押してください...</span>';
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
        <span class="missed-answer">正解: ${m.correctKeys}</span>
      </div>`
    ).join('');
  } else {
    dom.resultDetails.style.display = '';
    dom.missedList.innerHTML = '<div class="all-correct-msg">🎉 全問正解！パーフェクト！</div>';
  }

  showScreen('result-screen');

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

// ===== HINT =====
function showHint() {
  const q = state.questions[state.currentIndex];
  dom.hintText.textContent = `💡 正解: ${q.keys}`;
  dom.hintText.classList.remove('hidden');
  dom.hintBtn.style.display = 'none';
  state.hintUsed = true;
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
