/**
 * Service Worker（バックグラウンドスクリプト）
 * メッセージの中継と設定管理を担当
 */

import { getSettings, saveSettings } from '../utils/storage';
import { classifyAndSortEmails } from '../utils/classifier';
import type { MessageType, RawEmailData, ExtensionSettings } from '../types';

/**
 * インストール時の処理
 */
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    console.log('Gmail Priority Sorter がインストールされました');
    // 初回インストール時にオプションページを開く
    chrome.runtime.openOptionsPage();
  } else if (details.reason === 'update') {
    console.log('Gmail Priority Sorter が更新されました');
  }
});

/**
 * メッセージリスナー
 */
chrome.runtime.onMessage.addListener((message: MessageType, _sender, sendResponse) => {
  handleMessage(message, sendResponse);
  return true; // 非同期レスポンスのために必要
});

/**
 * メッセージハンドラ
 */
async function handleMessage(
  message: MessageType,
  sendResponse: (response: unknown) => void
): Promise<void> {
  try {
    switch (message.type) {
      case 'GET_SETTINGS': {
        const settings = await getSettings();
        sendResponse({ type: 'SETTINGS_RESPONSE', settings });
        break;
      }

      case 'UPDATE_SETTINGS': {
        const currentSettings = await getSettings();
        const newSettings: ExtensionSettings = { ...currentSettings, ...message.settings };
        await saveSettings(newSettings);
        sendResponse({ success: true, settings: newSettings });
        // 全タブに設定変更を通知
        notifyAllTabs({ type: 'SETTINGS_UPDATED', settings: newSettings });
        break;
      }

      case 'CLASSIFY_EMAILS': {
        const settings = await getSettings();
        const results = classifyAndSortEmails(message.emails as RawEmailData[], settings);
        sendResponse({ type: 'CLASSIFICATION_RESULT', results });
        break;
      }

      default:
        sendResponse({ error: '不明なメッセージタイプ' });
    }
  } catch (error) {
    console.error('メッセージ処理エラー:', error);
    sendResponse({ error: String(error) });
  }
}

/**
 * 全てのGmailタブに通知を送信
 */
async function notifyAllTabs(message: unknown): Promise<void> {
  const tabs = await chrome.tabs.query({ url: 'https://mail.google.com/*' });
  for (const tab of tabs) {
    if (tab.id) {
      try {
        await chrome.tabs.sendMessage(tab.id, message);
      } catch {
        // タブがまだ読み込まれていない場合などは無視
      }
    }
  }
}

/**
 * 拡張機能アイコンクリック時（ポップアップがない場合）
 */
chrome.action.onClicked.addListener(async (tab) => {
  if (tab.url?.includes('mail.google.com')) {
    // Gmailタブの場合、コンテンツスクリプトにソート指示
    if (tab.id) {
      chrome.tabs.sendMessage(tab.id, { type: 'SORT_EMAILS' });
    }
  }
});

console.log('Gmail Priority Sorter Service Worker 起動完了');
