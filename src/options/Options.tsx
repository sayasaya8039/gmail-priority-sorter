import React, { useState, useEffect, useCallback } from 'react';
import { createRoot } from 'react-dom/client';
import type { ExtensionSettings, ClassificationRule, RuleCondition } from '../types';
import {
  getSettings,
  saveSettings,
  resetSettings,
  addToVipList,
  removeFromVipList,
  addToIgnoreList,
  removeFromIgnoreList,
} from '../utils/storage';
import './options.css';

/**
 * オプションページメインコンポーネント
 */
const Options: React.FC = () => {
  const [settings, setSettings] = useState<ExtensionSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'general' | 'vip' | 'rules'>('general');
  const [newVip, setNewVip] = useState('');
  const [newIgnore, setNewIgnore] = useState('');

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

  const handleSave = async () => {
    if (!settings) return;
    setSaving(true);
    try {
      await saveSettings(settings);
      showNotification('設定を保存しました');
    } catch (error) {
      console.error('保存エラー:', error);
      showNotification('保存に失敗しました', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    if (!confirm('すべての設定をリセットしますか？')) return;
    try {
      const defaultSettings = await resetSettings();
      setSettings(defaultSettings);
      showNotification('設定をリセットしました');
    } catch (error) {
      console.error('リセットエラー:', error);
    }
  };

  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    // 簡易通知（実際にはトーストUIを実装）
    alert(message);
  };

  const handleToggle = (key: keyof ExtensionSettings) => {
    if (!settings) return;
    setSettings({ ...settings, [key]: !settings[key] });
  };

  const handleAddVip = async () => {
    if (!newVip.trim() || !settings) return;
    const updated = await addToVipList(newVip.trim());
    setSettings(updated);
    setNewVip('');
  };

  const handleRemoveVip = async (email: string) => {
    const updated = await removeFromVipList(email);
    setSettings(updated);
  };

  const handleAddIgnore = async () => {
    if (!newIgnore.trim() || !settings) return;
    const updated = await addToIgnoreList(newIgnore.trim());
    setSettings(updated);
    setNewIgnore('');
  };

  const handleRemoveIgnore = async (email: string) => {
    const updated = await removeFromIgnoreList(email);
    setSettings(updated);
  };

  if (loading) {
    return (
      <div className="options-container">
        <div className="loading">読み込み中...</div>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="options-container">
        <div className="error">設定の読み込みに失敗しました</div>
      </div>
    );
  }

  const version = chrome.runtime.getManifest().version;

  return (
    <div className="options-container">
      <header className="options-header">
        <div className="header-content">
          <div className="logo">
            <span className="logo-icon">📧</span>
            <h1>Gmail Priority Sorter</h1>
          </div>
          <span className="version">v{version}</span>
        </div>
        <p className="description">
          AIがGmailの受信トレイを分析し、重要なメールを優先表示します
        </p>
      </header>

      <nav className="tabs">
        <button
          className={`tab ${activeTab === 'general' ? 'active' : ''}`}
          onClick={() => setActiveTab('general')}
        >
          ⚙️ 基本設定
        </button>
        <button
          className={`tab ${activeTab === 'vip' ? 'active' : ''}`}
          onClick={() => setActiveTab('vip')}
        >
          ⭐ VIP / 無視リスト
        </button>
        <button
          className={`tab ${activeTab === 'rules' ? 'active' : ''}`}
          onClick={() => setActiveTab('rules')}
        >
          📋 カスタムルール
        </button>
      </nav>

      <main className="options-content">
        {activeTab === 'general' && (
          <section className="settings-section">
            <h2>基本設定</h2>

            <div className="setting-group">
              <div className="setting-item">
                <div className="setting-info">
                  <label>拡張機能を有効化</label>
                  <p>Gmail Priority Sorterの全機能をオン/オフ</p>
                </div>
                <label className="switch">
                  <input
                    type="checkbox"
                    checked={settings.enabled}
                    onChange={() => handleToggle('enabled')}
                  />
                  <span className="slider"></span>
                </label>
              </div>

              <div className="setting-item">
                <div className="setting-info">
                  <label>自動ソート</label>
                  <p>メール一覧を優先度順に自動で並べ替え</p>
                </div>
                <label className="switch">
                  <input
                    type="checkbox"
                    checked={settings.autoSort}
                    onChange={() => handleToggle('autoSort')}
                    disabled={!settings.enabled}
                  />
                  <span className="slider"></span>
                </label>
              </div>

              <div className="setting-item">
                <div className="setting-info">
                  <label>スコア表示</label>
                  <p>各メールに緊急度スコア（0-100）を表示</p>
                </div>
                <label className="switch">
                  <input
                    type="checkbox"
                    checked={settings.showScores}
                    onChange={() => handleToggle('showScores')}
                    disabled={!settings.enabled}
                  />
                  <span className="slider"></span>
                </label>
              </div>

              <div className="setting-item">
                <div className="setting-info">
                  <label>カテゴリバッジ</label>
                  <p>メールにカテゴリアイコンと優先度ラベルを表示</p>
                </div>
                <label className="switch">
                  <input
                    type="checkbox"
                    checked={settings.showBadges}
                    onChange={() => handleToggle('showBadges')}
                    disabled={!settings.enabled}
                  />
                  <span className="slider"></span>
                </label>
              </div>

              <div className="setting-item">
                <div className="setting-info">
                  <label>テーマ</label>
                  <p>表示テーマを選択</p>
                </div>
                <select
                  value={settings.theme}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      theme: e.target.value as 'light' | 'dark' | 'auto',
                    })
                  }
                >
                  <option value="auto">自動（システム設定に従う）</option>
                  <option value="light">ライト</option>
                  <option value="dark">ダーク</option>
                </select>
              </div>
            </div>
          </section>
        )}

        {activeTab === 'vip' && (
          <section className="settings-section">
            <h2>VIPリスト</h2>
            <p className="section-description">
              VIPリストに登録された送信者からのメールは常に高優先度になります
            </p>

            <div className="list-input">
              <input
                type="text"
                value={newVip}
                onChange={(e) => setNewVip(e.target.value)}
                placeholder="メールアドレスまたは名前の一部"
                onKeyDown={(e) => e.key === 'Enter' && handleAddVip()}
              />
              <button onClick={handleAddVip}>追加</button>
            </div>

            <ul className="email-list">
              {settings.vipList.length === 0 ? (
                <li className="empty">VIPリストは空です</li>
              ) : (
                settings.vipList.map((email) => (
                  <li key={email}>
                    <span className="email-icon">⭐</span>
                    <span className="email-text">{email}</span>
                    <button
                      className="remove-btn"
                      onClick={() => handleRemoveVip(email)}
                    >
                      ✕
                    </button>
                  </li>
                ))
              )}
            </ul>

            <h2 className="mt-8">無視リスト</h2>
            <p className="section-description">
              無視リストに登録された送信者からのメールは常に低優先度になります
            </p>

            <div className="list-input">
              <input
                type="text"
                value={newIgnore}
                onChange={(e) => setNewIgnore(e.target.value)}
                placeholder="メールアドレスまたはドメイン"
                onKeyDown={(e) => e.key === 'Enter' && handleAddIgnore()}
              />
              <button onClick={handleAddIgnore}>追加</button>
            </div>

            <ul className="email-list">
              {settings.ignoreList.length === 0 ? (
                <li className="empty">無視リストは空です</li>
              ) : (
                settings.ignoreList.map((email) => (
                  <li key={email}>
                    <span className="email-icon">🚫</span>
                    <span className="email-text">{email}</span>
                    <button
                      className="remove-btn"
                      onClick={() => handleRemoveIgnore(email)}
                    >
                      ✕
                    </button>
                  </li>
                ))
              )}
            </ul>
          </section>
        )}

        {activeTab === 'rules' && (
          <section className="settings-section">
            <h2>カスタムルール</h2>
            <p className="section-description">
              独自のルールを作成してメールの分類をカスタマイズできます
            </p>

            <div className="rules-placeholder">
              <div className="placeholder-icon">📋</div>
              <p>カスタムルール機能は今後のアップデートで追加予定です</p>
              <p className="placeholder-hint">
                現在は以下の自動ルールが適用されています：
              </p>
              <ul className="auto-rules">
                <li>🚨 緊急キーワード検出（「緊急」「至急」「URGENT」等）</li>
                <li>📅 会議・予定関連（「会議」「ミーティング」「Zoom」等）</li>
                <li>📋 アクション要求（「確認してください」「返信」等）</li>
                <li>📰 ニュースレター・プロモーション検出</li>
                <li>💬 SNS通知検出</li>
                <li>⭐ スター付き・未読メールの優先</li>
              </ul>
            </div>
          </section>
        )}
      </main>

      <footer className="options-footer">
        <button className="btn btn-danger" onClick={handleReset}>
          🔄 設定をリセット
        </button>
        <button
          className="btn btn-primary"
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? '保存中...' : '💾 設定を保存'}
        </button>
      </footer>
    </div>
  );
};

// アプリケーションのマウント
const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(<Options />);
}
