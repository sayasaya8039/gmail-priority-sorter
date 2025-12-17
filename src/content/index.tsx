/**
 * コンテンツスクリプト
 * GmailのDOMを監視・解析し、優先度表示を追加
 */

import { getSettings } from '../utils/storage';
import { classifyAndSortEmails } from '../utils/classifier';
import type { RawEmailData, ClassifiedEmail, ExtensionSettings } from '../types';

/**
 * CSSスタイルを注入
 */
function injectStyles(): void {
  if (document.getElementById('gps-styles')) return;

  const style = document.createElement('style');
  style.id = 'gps-styles';
  style.textContent = `
    .gps-badge {
      display: inline-flex !important;
      align-items: center !important;
      gap: 4px !important;
      margin-right: 8px !important;
      font-size: 11px !important;
      vertical-align: middle !important;
      white-space: nowrap !important;
    }
    .gps-category { font-size: 12px !important; }
    .gps-priority {
      padding: 2px 6px !important;
      border-radius: 10px !important;
      font-size: 10px !important;
      font-weight: 600 !important;
    }
    .gps-score {
      display: inline-block !important;
      min-width: 24px !important;
      height: 18px !important;
      line-height: 18px !important;
      text-align: center !important;
      font-size: 10px !important;
      font-weight: bold !important;
      color: white !important;
      border-radius: 9px !important;
      margin-left: 8px !important;
    }
    .gps-critical { background-color: rgba(220, 38, 38, 0.05) !important; }
    .gps-high { background-color: rgba(234, 88, 12, 0.05) !important; }
    .gps-low { opacity: 0.85 !important; }
    @keyframes gps-pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.7; }
    }
    .gps-critical .gps-priority { animation: gps-pulse 2s ease-in-out infinite; }
  `;
  document.head.appendChild(style);
}

// 型定義をインポートできないので、ここで再定義
const PRIORITY_CONFIG_LOCAL = {
  critical: { label: '緊急', color: '#DC2626', bgColor: '#FEE2E2' },
  high: { label: '高', color: '#EA580C', bgColor: '#FFEDD5' },
  medium: { label: '中', color: '#2563EB', bgColor: '#DBEAFE' },
  low: { label: '低', color: '#6B7280', bgColor: '#F3F4F6' },
};

const CATEGORY_CONFIG_LOCAL = {
  urgent: { label: '緊急', icon: '🚨', color: '#DC2626' },
  important: { label: '重要', icon: '⭐', color: '#F59E0B' },
  meeting: { label: '会議', icon: '📅', color: '#8B5CF6' },
  action: { label: '要対応', icon: '📋', color: '#3B82F6' },
  fyi: { label: '参考', icon: '📝', color: '#10B981' },
  newsletter: { label: 'ニュース', icon: '📰', color: '#6366F1' },
  promotion: { label: 'プロモ', icon: '🏷️', color: '#EC4899' },
  social: { label: 'SNS', icon: '💬', color: '#14B8A6' },
  other: { label: 'その他', icon: '📧', color: '#6B7280' },
};

let settings: ExtensionSettings | null = null;
let isProcessing = false;
let observer: MutationObserver | null = null;

/**
 * 初期化
 */
async function init(): Promise<void> {
  console.log('Gmail Priority Sorter: 初期化開始');

  try {
    // CSSを注入
    injectStyles();

    settings = await getSettings();

    if (!settings.enabled) {
      console.log('Gmail Priority Sorter: 無効化されています');
      return;
    }

    // DOMの準備を待つ
    await waitForGmailLoad();

    // 初回処理
    await processEmails();

    // DOM変更の監視を開始
    startObserver();

    // メッセージリスナー
    chrome.runtime.onMessage.addListener(handleMessage);

    console.log('Gmail Priority Sorter: 初期化完了');
  } catch (error) {
    console.error('Gmail Priority Sorter: 初期化エラー', error);
  }
}

/**
 * Gmailの読み込み完了を待つ
 */
function waitForGmailLoad(): Promise<void> {
  return new Promise((resolve) => {
    const checkReady = () => {
      // Gmailのメールリストが存在するか確認
      const emailList = document.querySelector('[role="main"]');
      if (emailList) {
        resolve();
      } else {
        setTimeout(checkReady, 500);
      }
    };
    checkReady();
  });
}

/**
 * メッセージハンドラ
 */
function handleMessage(message: { type: string; settings?: ExtensionSettings }): void {
  switch (message.type) {
    case 'SORT_EMAILS':
      processEmails();
      break;
    case 'REFRESH':
      processEmails();
      break;
    case 'SETTINGS_UPDATED':
      if (message.settings) {
        settings = message.settings;
        processEmails();
      }
      break;
  }
}

/**
 * DOM変更を監視
 */
function startObserver(): void {
  if (observer) {
    observer.disconnect();
  }

  observer = new MutationObserver((mutations) => {
    // 大量の変更を一度に処理するためにデバウンス
    if (!isProcessing) {
      const hasRelevantChanges = mutations.some(mutation => {
        return mutation.addedNodes.length > 0 || mutation.removedNodes.length > 0;
      });

      if (hasRelevantChanges) {
        debounceProcessEmails();
      }
    }
  });

  const mainContent = document.querySelector('[role="main"]');
  if (mainContent) {
    observer.observe(mainContent, {
      childList: true,
      subtree: true,
    });
  }
}

/**
 * デバウンス処理
 */
let debounceTimer: number | null = null;
function debounceProcessEmails(): void {
  if (debounceTimer) {
    clearTimeout(debounceTimer);
  }
  debounceTimer = window.setTimeout(() => {
    processEmails();
  }, 300);
}

/**
 * メールリストを処理
 */
async function processEmails(): Promise<void> {
  if (isProcessing || !settings?.enabled) return;

  isProcessing = true;

  try {
    // メール行を取得
    const emailRows = getEmailRows();

    if (emailRows.length === 0) {
      return;
    }

    // メールデータを抽出
    const rawEmails = extractEmailData(emailRows);

    // 分類実行
    const classifiedEmails = classifyAndSortEmails(rawEmails, settings);

    // UIを更新
    updateUI(classifiedEmails, emailRows);

    // 自動ソートが有効な場合、並び替え
    if (settings.autoSort) {
      sortEmailRows(classifiedEmails, emailRows);
    }
  } catch (error) {
    console.error('Gmail Priority Sorter: 処理エラー', error);
  } finally {
    isProcessing = false;
  }
}

/**
 * メール行要素を取得
 */
function getEmailRows(): HTMLElement[] {
  // Gmailのメール行を選択（複数のセレクタを試行）
  const selectors = [
    'tr.zA',           // 従来のGmail UI
    '[data-legacy-thread-id]', // 新しいGmail UI
    '.zE',             // 未読メール行
    '.yO',             // 読み取り済みメール行
  ];

  for (const selector of selectors) {
    const rows = document.querySelectorAll<HTMLElement>(selector);
    if (rows.length > 0) {
      return Array.from(rows);
    }
  }

  // フォールバック：tableのtr要素
  const tableRows = document.querySelectorAll<HTMLElement>('[role="main"] table tbody tr');
  return Array.from(tableRows).filter(row => {
    // メール行の特徴を持つものだけフィルタ
    return row.querySelector('[data-thread-id]') ||
           row.querySelector('[email]') ||
           row.classList.contains('zA');
  });
}

/**
 * メールデータを抽出
 */
function extractEmailData(rows: HTMLElement[]): RawEmailData[] {
  return rows.map((row, index) => {
    const elementId = `email-row-${index}`;
    row.setAttribute('data-gps-id', elementId);

    // 送信者を取得
    const senderEl = row.querySelector('[email]') ||
                     row.querySelector('.yX.xY span[name]') ||
                     row.querySelector('.yW span');
    const sender = senderEl?.getAttribute('email') ||
                   senderEl?.getAttribute('name') ||
                   senderEl?.textContent?.trim() ||
                   '不明';

    // 件名を取得
    const subjectEl = row.querySelector('.bog') ||
                      row.querySelector('.y6') ||
                      row.querySelector('[data-thread-subject]');
    const subject = subjectEl?.textContent?.trim() || '';

    // スニペットを取得
    const snippetEl = row.querySelector('.y2') ||
                      row.querySelector('.Zt');
    const snippet = snippetEl?.textContent?.trim() || '';

    // 日付を取得
    const dateEl = row.querySelector('.xW.xY span') ||
                   row.querySelector('[title]');
    const date = dateEl?.getAttribute('title') ||
                 dateEl?.textContent?.trim() ||
                 '';

    // 状態を確認
    const isUnread = row.classList.contains('zE') ||
                     row.querySelector('.zE') !== null ||
                     row.style.fontWeight === 'bold';

    const hasAttachment = row.querySelector('.aZo') !== null ||
                          row.querySelector('[data-tooltip="添付ファイルあり"]') !== null;

    const isStarred = row.querySelector('.T-KT.T-KT-Jp') !== null ||
                      row.querySelector('[data-tooltip*="スター"]')?.getAttribute('aria-label')?.includes('スター付き') === true;

    return {
      elementId,
      sender,
      subject,
      snippet,
      date,
      isUnread,
      hasAttachment,
      isStarred,
    };
  });
}

/**
 * UIを更新（バッジとスコアを追加）
 */
function updateUI(classifiedEmails: ClassifiedEmail[], rows: HTMLElement[]): void {
  if (!settings) return;

  classifiedEmails.forEach((email) => {
    const row = rows.find(r => r.getAttribute('data-gps-id') === email.elementId);
    if (!row) return;

    // 既存のバッジを削除
    const existingBadge = row.querySelector('.gps-badge');
    if (existingBadge) {
      existingBadge.remove();
    }

    // 既存のスコアを削除
    const existingScore = row.querySelector('.gps-score');
    if (existingScore) {
      existingScore.remove();
    }

    // バッジを追加
    if (settings.showBadges) {
      const badge = createBadge(email);
      const firstCell = row.querySelector('td:nth-child(3)') || row.querySelector('td');
      if (firstCell) {
        firstCell.insertBefore(badge, firstCell.firstChild);
      }
    }

    // スコアを追加
    if (settings.showScores) {
      const score = createScoreElement(email);
      const dateCell = row.querySelector('.xW') || row.querySelector('td:last-child');
      if (dateCell) {
        dateCell.appendChild(score);
      }
    }

    // 優先度に応じた行のスタイル
    applyRowStyle(row, email);
  });
}

/**
 * バッジ要素を作成
 */
function createBadge(email: ClassifiedEmail): HTMLElement {
  const badge = document.createElement('span');
  badge.className = 'gps-badge';

  const categoryConfig = CATEGORY_CONFIG_LOCAL[email.category];
  const priorityConfig = PRIORITY_CONFIG_LOCAL[email.priority];

  badge.innerHTML = `
    <span class="gps-category" style="color: ${categoryConfig.color}">
      ${categoryConfig.icon}
    </span>
    <span class="gps-priority" style="background: ${priorityConfig.bgColor}; color: ${priorityConfig.color}">
      ${priorityConfig.label}
    </span>
  `;

  badge.style.cssText = `
    display: inline-flex;
    align-items: center;
    gap: 4px;
    margin-right: 8px;
    font-size: 11px;
    vertical-align: middle;
  `;

  // ツールチップ
  badge.title = `${categoryConfig.label} / ${email.reason}`;

  return badge;
}

/**
 * スコア要素を作成
 */
function createScoreElement(email: ClassifiedEmail): HTMLElement {
  const score = document.createElement('span');
  score.className = 'gps-score';

  const priorityConfig = PRIORITY_CONFIG_LOCAL[email.priority];

  score.textContent = `${email.urgencyScore}`;
  score.style.cssText = `
    display: inline-block;
    min-width: 24px;
    height: 18px;
    line-height: 18px;
    text-align: center;
    font-size: 10px;
    font-weight: bold;
    color: white;
    background: ${priorityConfig.color};
    border-radius: 9px;
    margin-left: 8px;
  `;

  score.title = `緊急度スコア: ${email.urgencyScore}/100`;

  return score;
}

/**
 * 行のスタイルを適用
 */
function applyRowStyle(row: HTMLElement, email: ClassifiedEmail): void {
  // 既存のスタイルクラスを削除
  row.classList.remove('gps-critical', 'gps-high', 'gps-medium', 'gps-low');

  // 新しいスタイルクラスを追加
  row.classList.add(`gps-${email.priority}`);

  // critical/highの場合は左ボーダーを追加
  const priorityConfig = PRIORITY_CONFIG_LOCAL[email.priority];
  if (email.priority === 'critical' || email.priority === 'high') {
    row.style.borderLeft = `3px solid ${priorityConfig.color}`;
  } else {
    row.style.borderLeft = '';
  }
}

/**
 * メール行を並び替え
 */
function sortEmailRows(classifiedEmails: ClassifiedEmail[], rows: HTMLElement[]): void {
  const parent = rows[0]?.parentElement;
  if (!parent) return;

  // 一時的に監視を停止
  observer?.disconnect();

  // スコア順に並び替え
  const sortedRows = [...rows].sort((a, b) => {
    const emailA = classifiedEmails.find(e => e.elementId === a.getAttribute('data-gps-id'));
    const emailB = classifiedEmails.find(e => e.elementId === b.getAttribute('data-gps-id'));

    const scoreA = emailA?.urgencyScore ?? 0;
    const scoreB = emailB?.urgencyScore ?? 0;

    return scoreB - scoreA;
  });

  // DOMを更新
  sortedRows.forEach(row => {
    parent.appendChild(row);
  });

  // 監視を再開
  setTimeout(() => startObserver(), 100);
}

// 初期化実行
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
