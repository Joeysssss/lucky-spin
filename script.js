'use strict';
const ITEMS_KEY = 'luckySpin.items';
const HISTORY_KEY = 'luckySpin.history';
const DEFAULT_ITEMS = ['唱一首歌', '跳一段舞', '回答問題', '請喝飲料', '再抽一次', '安全過關'];
const COLORS = ['#8B5CF6', '#3B82F6', '#EC4899', '#F59E0B', '#10B981', '#EF4444', '#06B6D4', '#A3E635', '#F97316', '#6366F1', '#14B8A6', '#E879F9'];
const MIN_ITEMS = 2, MAX_ITEMS = 12, MAX_LEN = 20, MAX_HISTORY = 10;
const TAU = Math.PI * 2;
const POINTER_ANGLE = 1.5 * Math.PI; // 指針在正上方

const $ = (id) => document.getElementById(id);
const canvas = $('wheel'), ctx = canvas.getContext('2d');
let items = loadItems();
let history = loadHistory();
let rot = 0;            // 轉盤目前的順時針旋轉角度（弧度）
let spinning = false;
let editingIndex = -1;
let lastFocus = null;

/* ---------- 儲存 ---------- */
function readStorage(key) {
  try { return JSON.parse(localStorage.getItem(key)); } catch { return null; }
}
function writeStorage(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* 儲存失敗時仍可在本頁使用 */ }
}
function isValidList(list) {
  return Array.isArray(list) && list.length >= MIN_ITEMS && list.length <= MAX_ITEMS &&
    list.every((s) => typeof s === 'string' && s.trim() && [...s].length <= MAX_LEN) &&
    new Set(list).size === list.length;
}
function loadItems() {
  const saved = readStorage(ITEMS_KEY);
  return isValidList(saved) ? saved : [...DEFAULT_ITEMS];
}
function loadHistory() {
  const saved = readStorage(HISTORY_KEY);
  if (!Array.isArray(saved)) return [];
  return saved.filter((r) => r && typeof r.name === 'string' && Number.isFinite(r.time)).slice(0, MAX_HISTORY);
}
const saveItems = () => writeStorage(ITEMS_KEY, items);
const saveHistory = () => writeStorage(HISTORY_KEY, history);

/* ---------- 選項管理 ---------- */
function showError(msg) { $('error').textContent = msg || ''; }

function validate(raw, ignoreIndex = -1) {
  const name = raw.trim();
  if (!name) return '選項不可為空白，請輸入內容。';
  if ([...name].length > MAX_LEN) return `選項名稱最多 ${MAX_LEN} 個字元。`;
  if (items.some((s, i) => i !== ignoreIndex && s === name)) return '已有相同名稱的選項，請改用其他名稱。';
  return '';
}
function addItem() {
  if (spinning) return;
  const input = $('item-input');
  if (items.length >= MAX_ITEMS) return showError(`最多只能有 ${MAX_ITEMS} 個選項。`);
  const err = validate(input.value);
  if (err) return showError(err);
  items.push(input.value.trim());
  input.value = '';
  showError('');
  commitItems();
  input.focus();
}
function saveEdit(index, value) {
  if (spinning) return;
  const err = validate(value, index);
  if (err) return showError(err);
  items[index] = value.trim();
  editingIndex = -1;
  showError('');
  commitItems();
}
function removeItem(index) {
  if (spinning) return;
  if (items.length <= MIN_ITEMS) return showError(`至少要保留 ${MIN_ITEMS} 個選項。`);
  items.splice(index, 1);
  editingIndex = -1;
  showError('');
  commitItems();
}
function resetItems() {
  if (spinning || !confirm('確定要恢復預設選項嗎？目前的選項會被取代。')) return;
  items = [...DEFAULT_ITEMS];
  editingIndex = -1;
  showError('');
  commitItems();
}
function commitItems() { saveItems(); renderList(); draw(); }

function makeButton(text, cls, onClick, label) {
  const b = document.createElement('button');
  b.type = 'button';
  b.className = 'btn btn-small ' + cls;
  b.textContent = text;
  b.disabled = spinning;
  if (label) b.setAttribute('aria-label', label);
  b.addEventListener('click', onClick);
  return b;
}
function renderList() {
  const ul = $('item-list');
  ul.replaceChildren();
  items.forEach((name, i) => {
    const li = document.createElement('li');
    if (i === editingIndex) {
      const input = document.createElement('input');
      input.type = 'text';
      input.value = name;
      input.setAttribute('aria-label', '編輯選項');
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') saveEdit(i, input.value);
        if (e.key === 'Escape') { editingIndex = -1; showError(''); renderList(); }
      });
      li.append(input,
        makeButton('儲存', '', () => saveEdit(i, input.value)),
        makeButton('取消', '', () => { editingIndex = -1; showError(''); renderList(); }));
      ul.append(li);
      input.focus();
      return;
    }
    const dot = document.createElement('span');
    dot.className = 'dot';
    dot.style.background = COLORS[i % COLORS.length];
    const label = document.createElement('span');
    label.className = 'name';
    label.textContent = name;
    li.append(dot, label,
      makeButton('編輯', '', () => { editingIndex = i; showError(''); renderList(); }, `編輯 ${name}`),
      makeButton('刪除', 'btn-danger', () => removeItem(i), `刪除 ${name}`));
    ul.append(li);
  });
  $('count').textContent = `${items.length}/${MAX_ITEMS}`;
}

/* ---------- 轉盤繪製 ---------- */
function fitText(text, maxWidth) {
  if (ctx.measureText(text).width <= maxWidth) return text;
  let s = [...text];
  while (s.length > 1 && ctx.measureText(s.join('') + '…').width > maxWidth) s.pop();
  return s.join('') + '…';
}
function draw() {
  const size = canvas.width, c = size / 2, r = c - 6;
  const step = TAU / items.length;
  ctx.clearRect(0, 0, size, size);
  ctx.save();
  ctx.translate(c, c);
  ctx.rotate(rot);
  items.forEach((name, i) => {
    const a0 = i * step;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, r, a0, a0 + step);
    ctx.closePath();
    ctx.fillStyle = COLORS[i % COLORS.length];
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,.85)';
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.save();
    ctx.rotate(a0 + step / 2);
    ctx.fillStyle = '#fff';
    ctx.font = `bold ${items.length > 8 ? 26 : 32}px "Noto Sans TC","Microsoft JhengHei",sans-serif`;
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = 'rgba(0,0,0,.55)';
    ctx.shadowBlur = 4;
    ctx.fillText(fitText(name, r * 0.62), r - 28, 0);
    ctx.restore();
  });
  ctx.restore();
  ctx.beginPath();
  ctx.arc(c, c, 38, 0, TAU);
  ctx.fillStyle = '#0F172A';
  ctx.fill();
  ctx.lineWidth = 6;
  ctx.strokeStyle = '#FBBF24';
  ctx.stroke();
}

/* ---------- 旋轉 ---------- */
const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);
const mod = (a) => ((a % TAU) + TAU) % TAU;

function setSpinning(value) {
  spinning = value;
  $('spin-btn').disabled = value;
  $('add-btn').disabled = value;
  $('reset-btn').disabled = value;
  $('item-input').disabled = value;
  $('clear-btn').disabled = value || history.length === 0;
  if (value && editingIndex !== -1) {
    editingIndex = -1;
    showError('');
  }
  renderList();
}
function spin() {
  if (spinning || items.length < MIN_ITEMS) return;
  const winner = Math.floor(Math.random() * items.length);   // 先決定結果
  const step = TAU / items.length;
  const target = mod(POINTER_ANGLE - (winner + 0.5) * step); // 讓該扇形中心對準指針
  const delta = mod(target - mod(rot));                      // 由目前角度順時針還需轉多少
  const total = TAU * 5 + delta;                             // 至少 5 整圈
  const start = rot;
  const duration = matchMedia('(prefers-reduced-motion: reduce)').matches ? 1200 : 4000;
  const winnerName = items[winner];
  let t0 = null;
  setSpinning(true);
  const frame = (ts) => {
    if (t0 === null) t0 = ts;
    const p = Math.min((ts - t0) / duration, 1);
    rot = start + total * easeOutCubic(p);
    draw();
    if (p < 1) requestAnimationFrame(frame);
    else finishSpin(winnerName);
  };
  requestAnimationFrame(frame);
}
function finishSpin(name) {
  rot = mod(rot); // 正規化，避免角度無限累積
  draw();
  history.unshift({ name, time: Date.now() });
  history = history.slice(0, MAX_HISTORY);
  saveHistory();
  renderHistory();
  setSpinning(false);
  showResult(name);
}

/* ---------- 結果視窗 ---------- */
function showResult(name) {
  lastFocus = document.activeElement;
  $('result-text').textContent = name;
  launchConfetti();
  $('modal').hidden = false;
  $('ok-btn').focus();
}
function closeResult() {
  $('modal').hidden = true;
  if (lastFocus) lastFocus.focus();
}
function launchConfetti() {
  const box = $('confetti');
  box.replaceChildren();
  for (let i = 0; i < 40; i++) {
    const s = document.createElement('span');
    s.style.left = Math.random() * 100 + '%';
    s.style.background = COLORS[i % COLORS.length];
    s.style.animationDelay = Math.random() * 0.6 + 's';
    box.append(s);
  }
}

/* ---------- 歷史紀錄 ---------- */
function renderHistory() {
  const ul = $('history-list');
  ul.replaceChildren();
  $('clear-btn').disabled = history.length === 0;
  if (!history.length) {
    const li = document.createElement('li');
    li.className = 'empty';
    li.textContent = '目前還沒有抽籤紀錄';
    ul.append(li);
    return;
  }
  history.forEach((rec) => {
    const d = new Date(rec.time);
    const li = document.createElement('li');
    const name = document.createElement('span');
    name.textContent = rec.name;
    const time = document.createElement('span');
    time.className = 'time';
    time.textContent = `${d.toLocaleDateString('zh-TW')} ${d.toLocaleTimeString('zh-TW', { hour12: false })}`;
    li.append(name, time);
    ul.append(li);
  });
}
function clearHistory() {
  if (spinning || !history.length || !confirm('確定要清除所有抽籤紀錄嗎？')) return;
  history = [];
  saveHistory();
  renderHistory();
}

/* ---------- 事件與初始化 ---------- */
$('add-btn').addEventListener('click', addItem);
$('item-input').addEventListener('keydown', (e) => { if (e.key === 'Enter') addItem(); });
$('reset-btn').addEventListener('click', resetItems);
$('spin-btn').addEventListener('click', spin);
$('clear-btn').addEventListener('click', clearHistory);
$('ok-btn').addEventListener('click', closeResult);
document.addEventListener('keydown', (e) => {
  if ($('modal').hidden) return;
  if (e.key === 'Escape') closeResult();
  if (e.key === 'Tab') { e.preventDefault(); $('ok-btn').focus(); }
});

renderList();
renderHistory();
draw();
