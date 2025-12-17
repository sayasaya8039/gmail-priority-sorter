/**
 * Chrome Storage ユーティリティ
 */

import type { ExtensionSettings } from '../types';

/**
 * デフォルト設定
 */
export const DEFAULT_SETTINGS: ExtensionSettings = {
  enabled: true,
  autoSort: true,
  showScores: true,
  showBadges: true,
  vipList: [],
  ignoreList: [],
  customRules: [],
  theme: 'auto',
};

/**
 * 設定を取得
 */
export async function getSettings(): Promise<ExtensionSettings> {
  return new Promise((resolve) => {
    chrome.storage.sync.get(['settings'], (result) => {
      if (result.settings) {
        // デフォルト設定とマージ（新しいフィールドへの対応）
        resolve({ ...DEFAULT_SETTINGS, ...result.settings });
      } else {
        resolve(DEFAULT_SETTINGS);
      }
    });
  });
}

/**
 * 設定を保存
 */
export async function saveSettings(settings: ExtensionSettings): Promise<void> {
  return new Promise((resolve, reject) => {
    chrome.storage.sync.set({ settings }, () => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
      } else {
        resolve();
      }
    });
  });
}

/**
 * 設定を部分更新
 */
export async function updateSettings(updates: Partial<ExtensionSettings>): Promise<ExtensionSettings> {
  const currentSettings = await getSettings();
  const newSettings = { ...currentSettings, ...updates };
  await saveSettings(newSettings);
  return newSettings;
}

/**
 * 設定をリセット
 */
export async function resetSettings(): Promise<ExtensionSettings> {
  await saveSettings(DEFAULT_SETTINGS);
  return DEFAULT_SETTINGS;
}

/**
 * VIPリストに追加
 */
export async function addToVipList(email: string): Promise<ExtensionSettings> {
  const settings = await getSettings();
  if (!settings.vipList.includes(email)) {
    settings.vipList.push(email);
    await saveSettings(settings);
  }
  return settings;
}

/**
 * VIPリストから削除
 */
export async function removeFromVipList(email: string): Promise<ExtensionSettings> {
  const settings = await getSettings();
  settings.vipList = settings.vipList.filter(e => e !== email);
  await saveSettings(settings);
  return settings;
}

/**
 * 無視リストに追加
 */
export async function addToIgnoreList(email: string): Promise<ExtensionSettings> {
  const settings = await getSettings();
  if (!settings.ignoreList.includes(email)) {
    settings.ignoreList.push(email);
    await saveSettings(settings);
  }
  return settings;
}

/**
 * 無視リストから削除
 */
export async function removeFromIgnoreList(email: string): Promise<ExtensionSettings> {
  const settings = await getSettings();
  settings.ignoreList = settings.ignoreList.filter(e => e !== email);
  await saveSettings(settings);
  return settings;
}
