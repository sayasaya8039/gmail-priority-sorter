import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import type { ExtensionSettings } from '../types';
import { getSettings, updateSettings } from '../utils/storage';
import './popup.css';

/**
 * ポップアップメインコンポーネント
 */
const Popup: React.FC = () => {
  const [settings, setSettings] = useState<ExtensionSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const data = await getSettings();
      setSettings(data);
    } catch (error) {
      console.error('設定の読み込みに失敗:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (key: keyof ExtensionSettings) => {
    if (!settings) return;

    const newValue = !settings[key];
    const newSettings = { ...settings, [key]: newValue };
    setSettings(newSettings);

    try {
      await updateSettings({ [key]: newValue });
      showSaved();
    } catch (error) {
      console.error('設定の保存に失敗:', error);
    }
  };

  const showSaved = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  const handleRefresh = () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id) {
        chrome.tabs.sendMessage(tabs[0].id, { type: 'REFRESH' });
      }
    });
  };

  const openOptions = () => {
    chrome.runtime.openOptionsPage();
  };

  if (loading) {
    return (
      <div className="popup-container">
        <div className="loading">読み込み中...</div>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="popup-container">
        <div className="error">設定の読み込みに失敗しました</div>
      </div>
    );
  }

  const version = chrome.runtime.getManifest().version;

  return (
    <div className="popup-container">
      <header className="popup-header">
        <div className="logo">
          <span className="logo-icon">📧</span>
          <span className="logo-text">Gmail Priority Sorter</span>
        </div>
        <span className="version">v{version}</span>
      </header>

      <main className="popup-content">
        <div className="toggle-group">
          <div className="toggle-item">
            <label>
              <span className="toggle-label">拡張機能を有効化</span>
              <input
                type="checkbox"
                checked={settings.enabled}
                onChange={() => handleToggle('enabled')}
              />
              <span className="toggle-switch"></span>
            </label>
          </div>

          <div className="toggle-item">
            <label>
              <span className="toggle-label">自動ソート</span>
              <input
                type="checkbox"
                checked={settings.autoSort}
                onChange={() => handleToggle('autoSort')}
                disabled={!settings.enabled}
              />
              <span className="toggle-switch"></span>
            </label>
          </div>

          <div className="toggle-item">
            <label>
              <span className="toggle-label">スコア表示</span>
              <input
                type="checkbox"
                checked={settings.showScores}
                onChange={() => handleToggle('showScores')}
                disabled={!settings.enabled}
              />
              <span className="toggle-switch"></span>
            </label>
          </div>

          <div className="toggle-item">
            <label>
              <span className="toggle-label">カテゴリバッジ</span>
              <input
                type="checkbox"
                checked={settings.showBadges}
                onChange={() => handleToggle('showBadges')}
                disabled={!settings.enabled}
              />
              <span className="toggle-switch"></span>
            </label>
          </div>
        </div>

        <div className="stats">
          <div className="stat-item">
            <span className="stat-icon">⭐</span>
            <span className="stat-label">VIP</span>
            <span className="stat-value">{settings.vipList.length}人</span>
          </div>
          <div className="stat-item">
            <span className="stat-icon">🚫</span>
            <span className="stat-label">無視</span>
            <span className="stat-value">{settings.ignoreList.length}件</span>
          </div>
          <div className="stat-item">
            <span className="stat-icon">📋</span>
            <span className="stat-label">ルール</span>
            <span className="stat-value">{settings.customRules.length}件</span>
          </div>
        </div>

        <div className="actions">
          <button className="btn btn-primary" onClick={handleRefresh}>
            🔄 再分類
          </button>
          <button className="btn btn-secondary" onClick={openOptions}>
            ⚙️ 詳細設定
          </button>
        </div>
      </main>

      {saved && (
        <div className="toast">
          ✓ 保存しました
        </div>
      )}
    </div>
  );
};

// アプリケーションのマウント
const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(<Popup />);
}
