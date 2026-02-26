# ⌨️ KeyDrill — ショートカットキー訓練アプリ

**ショートカットキーをタイピングゲーム感覚で練習できる無料Webアプリです。**

🎮 **[今すぐプレイ →](https://darling-valkyrie-f16e3d.netlify.app/)**

![KeyDrill](https://img.shields.io/badge/KeyDrill-v1.0-6366f1?style=for-the-badge)
![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)

---

## 🎯 特徴

- **8ソフト対応** — Excel / Explorer / Chrome / Word / PowerPoint / VS Code / Windows共通 / VBE
- **タイピングゲーム方式** — 操作名が表示 → 正しいショートカットキーを入力
- **ランク判定** — 正答率・タイム・ミスに基づく S〜D ランク
- **効果音付き** — 正解/ミス/ゲーム開始/終了のサウンドフィードバック（Web Audio API生成・著作権フリー）
- **ブラウザ競合キー自動除外** — Alt+F4, Ctrl+W 等ブラウザと干渉するキーは自動的に出題から除外
- **カテゴリ・出題数・順序設定** — 自分に合った学習が可能
- **ヒント&スキップ機能** — 分からない問題も安心
- **スコア保存** — localStorage によるハイスコア記録

## 📸 スクリーンショット

| タイトル画面 | ゲーム画面 | 結果画面 |
|:---:|:---:|:---:|
| ソフト選択・設定 | ショートカット入力 | ランク・成績表示 |

## 🚀 使い方

### オンラインでプレイ
👉 [https://darling-valkyrie-f16e3d.netlify.app/](https://darling-valkyrie-f16e3d.netlify.app/)

### ローカルで実行
```
git clone https://github.com/YOUR_USERNAME/KeyDrill.git
cd KeyDrill
```
`index.html` をブラウザで開くだけで動作します（ローカルサーバー不要）。

## 📂 ファイル構成

```
KeyDrill/
├── index.html          # メインHTML
├── style.css           # スタイル
├── app.js              # アプリケーションロジック
├── softex-celware.avif # ロゴ
├── data/
│   ├── manifest.json   # ソフト一覧
│   ├── Excel.csv       # Excelショートカット
│   ├── Explorer.csv    # Explorerショートカット
│   ├── Chrome.csv      # Chromeショートカット
│   ├── Word.csv        # Wordショートカット
│   ├── PowerPoint.csv  # PowerPointショートカット
│   ├── VSCode.csv      # VS Codeショートカット
│   ├── VBE.csv         # VBE (VBA Editor) ショートカット
│   └── Windows共通.csv  # Windows共通ショートカット
└── README.md
```

## ➕ ソフトの追加方法

新しいソフトのショートカットキーを追加するのは簡単です：

1. `data/` フォルダに CSV ファイルを追加
2. `data/manifest.json` にファイル名を追加

### CSV形式

```csv
category,operation,keys,difficulty
基本操作,コピー,Ctrl+C,1
ナビゲーション,データの端に移動（下）,Ctrl+ArrowDown,2
```

| カラム | 説明 |
|---|---|
| `category` | カテゴリ名（フィルタリングに利用） |
| `operation` | 操作名（画面に表示される問題文） |
| `keys` | ショートカットキー（`+` 区切り） |
| `difficulty` | 難易度 1〜3 |

### キー表記

| 表記 | キー |
|---|---|
| `Ctrl`, `Shift`, `Alt` | 修飾キー |
| `ArrowUp`, `ArrowDown`, `ArrowLeft`, `ArrowRight` | 矢印キー（画面では ↑↓←→ と表示） |
| `PageUp`, `PageDown`, `Home`, `End` | ナビゲーションキー |
| `F1` 〜 `F12` | ファンクションキー |
| `Escape`, `Enter`, `Tab`, `Delete`, `Space` | その他の特殊キー |

## 🛠️ 技術スタック

- **HTML / CSS / JavaScript**（バニラ、フレームワーク不使用）
- **Web Audio API** — 効果音のプログラム生成
- **Google Fonts** — Inter / Noto Sans JP
- **localStorage** — スコア保存

## 🤝 開発・提供

**[Softex Celware](https://www.softex-celware.com/)** — Excel VBAによる業務自動化ツール開発

---

© 2026 Softex Celware. All rights reserved.
