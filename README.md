# 🎡 Lucky Spin — 命運大轉盤

> 讓命運替你做決定！一個輕量、流暢、現代深色系風格且支援無障礙設計的原生 HTML5 / CSS3 / JavaScript 命運大轉盤應用。

[![Live Demo](https://img.shields.io/badge/Live-Demo-brightgreen?logo=githubpages&logoColor=white)](https://joeysssss.github.io/lucky-spin/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Vanilla JS](https://img.shields.io/badge/Vanilla-JS-F7DF1E?logo=javascript&logoColor=black)](script.js)
[![HTML5 Canvas](https://img.shields.io/badge/HTML5-Canvas-E34F26?logo=html5&logoColor=white)](index.html)

🔗 **線上體驗 Demo**：[https://joeysssss.github.io/lucky-spin/](https://joeysssss.github.io/lucky-spin/)

---

## ✨ 核心特色 (Features)

- 🎯 **精準幾何停靠**：基於 HTML5 Canvas 扇形幾何與弧度推導，保證選中項目中心線精準停在正上方金色指針（$1.5\pi$），搭配 `easeOutCubic` 緩動減速，手感流暢自然。
- 📝 **即時選項自訂**：支援 2 ~ 12 個選項，提供動態新增、行內直接編輯、刪除防呆（最少保留 2 項）與一鍵恢復預設選項。
- 💾 **本地資料持久化**：使用 `localStorage` 自動保存選項列表與最近 10 筆抽籤歷史紀錄，重新整理或關閉分頁不遺失。
- ♿ **完善無障礙（A11y）設計**：
  - 中獎彈窗具備焦點管理（Focus Trap）、支援鍵盤 `Escape` 快速關閉並自動歸還前次焦點。
  - 支援系統偏好減速動畫（`prefers-reduced-motion`），自動縮短旋轉時長以避免眩暈。
- 📱 **響應式佈局（RWD）**：桌面端採雙欄對齊排版；行動裝置自動單欄堆疊並將「命運轉盤」優先置頂，無須滾動即可直接點擊開轉。
- 🎊 **結果揭曉特效**：中獎時伴隨碎紙花（Confetti）動畫與優雅的漸層亮色彈窗。
- ⚡ **純原生零依賴**：無任何外部框架或依賴庫，載入飛快，完全支援離線使用。

---

## 📐 轉盤幾何與角度計算原理

轉盤採用標準笛卡爾坐標系映射至 Canvas 坐標（以右側 3 點鐘為 $0$ 弧度，順時針遞增）：

1. **指針位置**：固定於圓盤正上方（12 點鐘方向），角度為：
   $$\text{POINTER\_ANGLE} = 1.5\pi \text{ rad} \quad (270^\circ)$$
2. **扇形角度**：設選項總數為 $N$，每個扇形跨度為 $\text{step} = \frac{2\pi}{N}$，第 $i$ 個選項未旋轉時的中心角為：
   $$\theta_i = (i + 0.5) \times \text{step}$$
3. **對齊目標旋轉角**：旋轉角度為 $\text{rot}$ 時，該項目中心在畫布上的螢幕角度為 $\text{rot} + \theta_i$。為了使其精確對齊指針：
   $$\text{target} = (\text{POINTER\_ANGLE} - \theta_i) \pmod{2\pi}$$
4. **旋轉總弧度**：計算自當前角度順時針旋轉所需之差值，並額外旋轉 5 圈以上以營造懸疑感：
   $$\text{total} = 2\pi \times 5 + ((\text{target} - \text{rot}) \pmod{2\pi})$$
5. **緩動插值與正規化**：透過三次緩出函數 $\text{easeOutCubic}(p) = 1 - (1 - p)^3$ 進行平滑插值，旋轉結束後呼叫 $\text{rot} \pmod{2\pi}$ 保持數值在 $[0, 2\pi)$ 區間。

---

## 🚀 快速開始 (Quick Start)

本專案無需任何構建步驟或套件安裝，直接用瀏覽器開啟即可：

### 方法一：直接於本機執行
1. 下載或複製本儲存庫：
   ```bash
   git clone https://github.com/Joeysssss/lucky-spin.git
   cd lucky-spin
   ```
2. 直接點擊 `index.html`，或使用 VS Code 的 **Live Server** 外掛開啟。

### 方法二：一鍵啟用 GitHub Pages
若要分享給朋友使用，可在 GitHub 倉庫頁面進入 **Settings** > **Pages**，將分支設為 `main` / `root` 儲存，即可獲得專屬線上網址。

---

## 📁 檔案結構 (Project Structure)

```text
lucky-spin/
├── index.html        # 應用程式骨架與語意化 HTML 結構
├── style.css         # 現代暗黑系調色盤、流體排版、響應式規則與碎紙花動畫
├── script.js         # 轉盤 Canvas 渲染、動畫循環、狀態機與資料持久化
├── README.md         # 專案詳細說明與架構文件
├── LICENSE           # MIT 授權條款
└── .gitignore        # Git 忽略清單
```

---

## 🎮 操作指引

1. **自訂選項**：在左側（或行動裝置下方）的輸入框鍵入名稱後點擊「新增」，亦可點擊項目右側的「編輯」或「刪除」。
2. **開始抽籤**：點擊紫粉色漸層的「開始旋轉」按鈕，轉盤將開始高速旋轉並逐漸減速。
3. **查看結果**：彈窗公佈中獎項目，可按下 `Enter`、`Escape` 或點擊「確定」關閉。
4. **歷史紀錄**：下方卡片自動記錄每一次抽取的項目與時間戳記，支援一鍵清除紀錄。

---

## 📄 授權條款 (License)

本專案依據 [MIT 授權條款](LICENSE) 開放原始碼，可自由使用、修改與發布。
