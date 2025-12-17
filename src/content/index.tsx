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
  `;
  document.head.appendChild(style);
}

// 型定義
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
let hasInitialized = false;
let refreshInterval: number | null = null;

/**
 * 初期化
 */
async function init(): Promise<void> {
  // 二重初期化を防止
  if (hasInitialized) return;
  hasInitialized = true;

  console.log('Gmail Priority Sorter: 初期化開始');

  try {
    injectStyles();
    settings = await getSettings();

    if (!settings.enabled) {
      console.log('Gmail Priority Sorter: 無効化されています');
      return;
    }

    // DOMの準備を待つ
    await waitForGmailLoad();

    // 初回処理
    await processEmailsOnce();

    // 定期的にバッジをチェック・再適用（5秒ごと）
    startRefreshInterval();

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
    let attempts = 0;
    const maxAttempts = 20;

    const checkReady = () => {
      attempts++;
      const emailList = document.querySelector('[role="main"]');
      if (emailList || attempts >= maxAttempts) {
        resolve();
      } else {
        setTimeout(checkReady, 500);
      }
    };
    checkReady();
  });
}

/**
 * 定期的なバッジチェック開始
 */
function startRefreshInterval(): void {
  if (refreshInterval) {
    clearInterval(refreshInterval);
  }

  refreshInterval = window.setInterval(() => {
    // バッジが消えていないかチェック
    const rows = getEmailRows();
    const hasMissingBadges = rows.some(row => {
      const hasGpsId = row.getAttribute('data-gps-id');
      const hasBadge = row.querySelector('.gps-badge');
      return hasGpsId && !hasBadge;
    });

    if (hasMissingBadges) {
      console.log('Gmail Priority Sorter: バッジ消失を検出、再適用中...');
      refreshBadges();
    }
  }, 3000); // 3秒ごとにチェック
}

/**
 * バッジを再適用
 */
function refreshBadges(): void {
  const rows = getEmailRows();
  rows.forEach(row => {
    // 処理済みフラグをリセット
    row.removeAttribute('data-gps-processed');
  });
  processEmailsOnce();
}

/**
 * メッセージハンドラ
 */
function handleMessage(message: { type: string; settings?: ExtensionSettings }): void {
  switch (message.type) {
    case 'SORT_EMAILS':
    case 'REFRESH':
      processEmailsOnce();
      break;
    case 'SETTINGS_UPDATED':
      if (message.settings) {
        settings = message.settings;
        processEmailsOnce();
      }
      break;
  }
}

/**
 * メールリストを一度だけ処理（ループ防止）
 */
async function processEmailsOnce(): Promise<void> {
  if (isProcessing || !settings?.enabled) return;

  isProcessing = true;

  try {
    const emailRows = getEmailRows();

    if (emailRows.length === 0) {
      return;
    }

    const rawEmails = extractEmailData(emailRows);
    const classifiedEmails = classifyAndSortEmails(rawEmails, settings);

    // UIを更新（バッジとスコアの追加のみ、ソートは無効）
    updateUI(classifiedEmails, emailRows);

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
  const selectors = [
    'tr.zA',
    'tr.zE',
    'tr.yO',
  ];

  for (const selector of selectors) {
    const rows = document.querySelectorAll<HTMLElement>(selector);
    if (rows.length > 0) {
      return Array.from(rows);
    }
  }

  return [];
}

/**
 * メールデータを抽出
 */
function extractEmailData(rows: HTMLElement[]): RawEmailData[] {
  return rows.map((row, index) => {
    const elementId = `email-row-${index}`;
    row.setAttribute('data-gps-id', elementId);

    const senderEl = row.querySelector('[email]') ||
                     row.querySelector('.yX.xY span[name]') ||
                     row.querySelector('.yW span');
    const sender = senderEl?.getAttribute('email') ||
                   senderEl?.getAttribute('name') ||
                   senderEl?.textContent?.trim() ||
                   '不明';

    const subjectEl = row.querySelector('.bog') ||
                      row.querySelector('.y6');
    const subject = subjectEl?.textContent?.trim() || '';

    const snippetEl = row.querySelector('.y2');
    const snippet = snippetEl?.textContent?.trim() || '';

    const dateEl = row.querySelector('.xW.xY span');
    const date = dateEl?.getAttribute('title') ||
                 dateEl?.textContent?.trim() || '';

    const isUnread = row.classList.contains('zE');
    const hasAttachment = row.querySelector('.aZo') !== null;
    const isStarred = row.querySelector('.T-KT.T-KT-Jp') !== null;

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

    // 既に処理済みの行はスキップ
    if (row.getAttribute('data-gps-processed') === 'true') return;
    row.setAttribute('data-gps-processed', 'true');

    // バッジを追加
    if (settings!.showBadges) {
      const existingBadge = row.querySelector('.gps-badge');
      if (!existingBadge) {
        const badge = createBadge(email);
        const firstCell = row.querySelector('td.xY') || row.querySelector('td:nth-child(4)');
        if (firstCell) {
          firstCell.insertBefore(badge, firstCell.firstChild);
        }
      }
    }

    // スコアを追加
    if (settings!.showScores) {
      const existingScore = row.querySelector('.gps-score');
      if (!existingScore) {
        const score = createScoreElement(email);
        const dateCell = row.querySelector('.xW.xY');
        if (dateCell) {
          dateCell.appendChild(score);
        }
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
  row.classList.remove('gps-critical', 'gps-high', 'gps-medium', 'gps-low');
  row.classList.add(`gps-${email.priority}`);

  const priorityConfig = PRIORITY_CONFIG_LOCAL[email.priority];
  if (email.priority === 'critical' || email.priority === 'high') {
    row.style.borderLeft = `3px solid ${priorityConfig.color}`;
  } else {
    row.style.borderLeft = '';
  }
}

// 初期化実行
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
