# Gmail Priority Sorter - メール優先度自動分類

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![Chrome](https://img.shields.io/badge/Chrome-Extension-orange.svg)

AIがGmailの受信トレイを分析し、重要なメールを上位に並べ替え、緊急度スコアを自動付与するChrome拡張機能です。

## 機能

- **自動優先度分類**: メールの件名、送信者、本文スニペットを分析して優先度を判定
- **緊急度スコア**: 各メールに0-100の緊急度スコアを付与
- **カテゴリ分類**: 緊急、会議、要対応、ニュースレターなど9種類のカテゴリに自動分類
- **自動ソート**: メール一覧を優先度順に並び替え
- **VIPリスト**: 重要な送信者を登録して常に高優先度に設定
- **無視リスト**: ニュースレターなどを登録して低優先度に設定
- **ダークモード対応**: Gmailのダークテーマにも対応

## スクリーンショット

### ポップアップUI
簡単に機能のオン/オフを切り替えられます。

### メール一覧
各メールにカテゴリバッジと緊急度スコアが表示されます。

## インストール方法

### 開発版のインストール

1. このリポジトリをクローン
```bash
git clone https://github.com/yourusername/gmail-priority-sorter.git
cd gmail-priority-sorter
```

2. 依存関係をインストール
```bash
npm install
```

3. ビルド
```bash
npm run build
```

4. Chromeで拡張機能を読み込み
   - `chrome://extensions/` を開く
   - 「デベロッパーモード」をオン
   - 「パッケージ化されていない拡張機能を読み込む」をクリック
   - `Gmail_Priority_Sorter` フォルダを選択

## 使い方

1. **有効化**: ポップアップから拡張機能を有効にします
2. **Gmailを開く**: https://mail.google.com にアクセス
3. **自動分類**: 受信トレイのメールが自動的に分析・分類されます
4. **設定カスタマイズ**: オプションページでVIPリストや表示設定をカスタマイズ

## 分類ルール

### 優先度レベル

| レベル | スコア範囲 | 説明 |
|--------|-----------|------|
| 🔴 緊急 | 80-100 | 即座に対応が必要 |
| 🟠 高 | 60-79 | 早めの対応が望ましい |
| 🔵 中 | 40-59 | 通常の優先度 |
| ⚪ 低 | 0-39 | 時間のある時に確認 |

### カテゴリ

| カテゴリ | アイコン | 検出条件 |
|---------|---------|----------|
| 緊急 | 🚨 | 「緊急」「至急」「URGENT」などのキーワード |
| 会議 | 📅 | 「会議」「ミーティング」「Zoom」などのキーワード |
| 要対応 | 📋 | 「確認してください」「返信」などのキーワード |
| 参考 | 📝 | 情報共有目的のメール |
| ニュース | 📰 | ニュースレター、配信メール |
| プロモ | 🏷️ | セール、キャンペーン情報 |
| SNS | 💬 | ソーシャルメディア通知 |
| その他 | 📧 | 上記に該当しないメール |

## 開発

### 開発サーバーの起動

```bash
npm run dev
```

### 型チェック

```bash
npm run lint
```

### プロジェクト構成

```
src/
├── background/      # Service Worker
├── content/         # コンテンツスクリプト（Gmail連携）
├── popup/           # ポップアップUI
├── options/         # オプションページ
├── types/           # 型定義
├── utils/           # ユーティリティ
│   ├── classifier.ts   # 分類エンジン
│   └── storage.ts      # Chrome Storage操作
└── styles/          # スタイルシート
```

## 技術スタック

- **フレームワーク**: React 19
- **言語**: TypeScript
- **ビルドツール**: Vite + CRXJS
- **マニフェスト**: Chrome Extension Manifest V3

## プライバシーについて

この拡張機能は：
- メールの内容をサーバーに送信しません
- すべての処理はローカルで行われます
- 設定はChromeの同期ストレージに保存されます
- 必要最小限の権限のみを要求します

## ライセンス

MIT License

## 作者

Gmail Priority Sorter開発チーム

---

お問い合わせやバグ報告は[Issues](https://github.com/yourusername/gmail-priority-sorter/issues)からお願いします。
