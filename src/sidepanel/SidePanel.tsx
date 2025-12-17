import React, { useState, useEffect, useCallback } from 'react';
import { createRoot } from 'react-dom/client';
import type { ExtensionSettings, ClassificationRule, EmailCategory, PriorityLevel } from '../types';
import { getSettings, updateSettings } from '../utils/storage';
import './sidepanel.css';

interface EmailSummary {
  sender: string;
  subject: string;
  priority: string;
  urgencyScore: number;
  category: string;
}

const PRIORITY_CONFIG = {
  critical: { label: '緊急', color: '#DC2626', bgColor: '#FEE2E2' },
  high: { label: '高', color: '#EA580C', bgColor: '#FFEDD5' },
  medium: { label: '中', color: '#2563EB', bgColor: '#DBEAFE' },
  low: { label: '低', color: '#6B7280', bgColor: '#F3F4F6' },
};

const CATEGORY_CONFIG: Record<string, { label: string; icon: string }> = {
  urgent: { label: '緊急', icon: '🚨' },
  important: { label: '重要', icon: '⭐' },
  meeting: { label: '会議', icon: '📅' },
  action: { label: '要対応', icon: '📋' },
  fyi: { label: '参考', icon: '📝' },
  newsletter: { label: 'ニュース', icon: '📰' },
  promotion: { label: 'プロモ', icon: '🏷️' },
  social: { label: 'SNS', icon: '💬' },
  other: { label: 'その他', icon: '📧' },
};

type TabType = 'stats' | 'vip' | 'rules';

const SidePanel: React.FC = () => {
  const [settings, setSettings] = useState<ExtensionSettings | null>(null);
  const [emails, setEmails] = useState<EmailSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ critical: 0, high: 0, medium: 0, low: 0 });
  const [activeTab, setActiveTab] = useState<TabType>('stats');
  const [newVip, setNewVip] = useState('');
  const [newIgnore, setNewIgnore] = useState('');

  useEffect(() => {
    loadData();

    // コンテンツスクリプトからのメッセージを受信
    chrome.runtime.onMessage.addListener(handleMessage);

    // 初回データリクエスト
    requestEmailData();

    return () => {
      chrome.runtime.onMessage.removeListener(handleMessage);
    };
  }, []);

  const handleMessage = useCallback((message: { type: string; emails?: EmailSummary[] }) => {
    if (message.type === 'EMAILS_CLASSIFIED' && message.emails) {
      setEmails(message.emails);
      updateStats(message.emails);
    }
  }, []);

  const requestEmailData = () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tab = tabs[0];
      // Gmail タブの場合のみメッセージを送信
      if (tab?.id && tab.url?.includes('mail.google.com')) {
        chrome.tabs.sendMessage(tab.id, { type: 'REFRESH' }).catch(() => {
          // コンテンツスクリプトがまだ読み込まれていない場合は無視
          console.log('Gmail Priority Sorter: コンテンツスクリプトに接続できません。ページをリロードしてください。');
        });
      }
    });
  };

  const loadData = async () => {
    try {
      const data = await getSettings();
      setSettings(data);
    } catch (error) {
      console.error('設定の読み込みに失敗:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateStats = (emailList: EmailSummary[]) => {
    const newStats = { critical: 0, high: 0, medium: 0, low: 0 };
    emailList.forEach(email => {
      if (email.priority in newStats) {
        newStats[email.priority as keyof typeof newStats]++;
      }
    });
    setStats(newStats);
  };

  const handleToggle = async (key: keyof ExtensionSettings) => {
    if (!settings) return;
    const newValue = !settings[key];
    const newSettings = { ...settings, [key]: newValue };
    setSettings(newSettings);
    await updateSettings({ [key]: newValue });
  };

  const handleRefresh = () => {
    requestEmailData();
  };

  const openOptions = () => {
    chrome.runtime.openOptionsPage();
  };

  // VIPリスト管理
  const addVip = async () => {
    if (!settings || !newVip.trim()) return;
    const vipList = [...settings.vipList, newVip.trim()];
    const newSettings = { ...settings, vipList };
    setSettings(newSettings);
    await updateSettings({ vipList });
    setNewVip('');
    handleRefresh();
  };

  const removeVip = async (email: string) => {
    if (!settings) return;
    const vipList = settings.vipList.filter(v => v !== email);
    const newSettings = { ...settings, vipList };
    setSettings(newSettings);
    await updateSettings({ vipList });
    handleRefresh();
  };

  // 無視リスト管理
  const addIgnore = async () => {
    if (!settings || !newIgnore.trim()) return;
    const ignoreList = [...settings.ignoreList, newIgnore.trim()];
    const newSettings = { ...settings, ignoreList };
    setSettings(newSettings);
    await updateSettings({ ignoreList });
    setNewIgnore('');
    handleRefresh();
  };

  const removeIgnore = async (email: string) => {
    if (!settings) return;
    const ignoreList = settings.ignoreList.filter(v => v !== email);
    const newSettings = { ...settings, ignoreList };
    setSettings(newSettings);
    await updateSettings({ ignoreList });
    handleRefresh();
  };

  // カスタムルール管理
  const toggleRule = async (ruleId: string) => {
    if (!settings) return;
    const customRules = settings.customRules.map(rule =>
      rule.id === ruleId ? { ...rule, enabled: !rule.enabled } : rule
    );
    const newSettings = { ...settings, customRules };
    setSettings(newSettings);
    await updateSettings({ customRules });
    handleRefresh();
  };

  const deleteRule = async (ruleId: string) => {
    if (!settings) return;
    const customRules = settings.customRules.filter(rule => rule.id !== ruleId);
    const newSettings = { ...settings, customRules };
    setSettings(newSettings);
    await updateSettings({ customRules });
    handleRefresh();
  };

  if (loading) {
    return (
      <div className="sidepanel-container">
        <div className="loading">読み込み中...</div>
      </div>
    );
  }

  const version = chrome.runtime.getManifest().version;

  return (
    <div className="sidepanel-container">
      <header className="sidepanel-header">
        <div className="logo">
          <span className="logo-icon">📧</span>
          <h1>Priority Sorter</h1>
        </div>
        <span className="version">v{version}</span>
      </header>

      {/* タブナビゲーション */}
      <nav className="tab-nav">
        <button
          className={`tab-btn ${activeTab === 'stats' ? 'active' : ''}`}
          onClick={() => setActiveTab('stats')}
        >
          📊 統計
        </button>
        <button
          className={`tab-btn ${activeTab === 'vip' ? 'active' : ''}`}
          onClick={() => setActiveTab('vip')}
        >
          ⭐ VIP/無視
        </button>
        <button
          className={`tab-btn ${activeTab === 'rules' ? 'active' : ''}`}
          onClick={() => setActiveTab('rules')}
        >
          📋 ルール
        </button>
      </nav>

      {/* 統計タブ */}
      {activeTab === 'stats' && (
        <>
          {/* 統計カード */}
          <section className="stats-section">
            <h2>📊 メール統計</h2>
            <div className="stats-grid">
              <div className="stat-card critical">
                <span className="stat-count">{stats.critical}</span>
                <span className="stat-label">緊急</span>
              </div>
              <div className="stat-card high">
                <span className="stat-count">{stats.high}</span>
                <span className="stat-label">高</span>
              </div>
              <div className="stat-card medium">
                <span className="stat-count">{stats.medium}</span>
                <span className="stat-label">中</span>
              </div>
              <div className="stat-card low">
                <span className="stat-count">{stats.low}</span>
                <span className="stat-label">低</span>
              </div>
            </div>
          </section>

          {/* 設定トグル */}
          <section className="settings-section">
            <h2>⚙️ クイック設定</h2>
            <div className="toggle-list">
              <label className="toggle-item">
                <span>拡張機能を有効化</span>
                <input
                  type="checkbox"
                  checked={settings?.enabled ?? true}
                  onChange={() => handleToggle('enabled')}
                />
                <span className="toggle-switch"></span>
              </label>
              <label className="toggle-item">
                <span>バッジ表示</span>
                <input
                  type="checkbox"
                  checked={settings?.showBadges ?? true}
                  onChange={() => handleToggle('showBadges')}
                />
                <span className="toggle-switch"></span>
              </label>
              <label className="toggle-item">
                <span>スコア表示</span>
                <input
                  type="checkbox"
                  checked={settings?.showScores ?? true}
                  onChange={() => handleToggle('showScores')}
                />
                <span className="toggle-switch"></span>
              </label>
            </div>
          </section>

          {/* メール一覧 */}
          {emails.length > 0 && (
            <section className="emails-section">
              <h2>📬 分類済みメール ({emails.length}件)</h2>
              <ul className="email-list">
                {emails.slice(0, 20).map((email, index) => {
                  const priorityConfig = PRIORITY_CONFIG[email.priority as keyof typeof PRIORITY_CONFIG] || PRIORITY_CONFIG.medium;
                  const categoryConfig = CATEGORY_CONFIG[email.category] || CATEGORY_CONFIG.other;

                  return (
                    <li key={index} className="email-item">
                      <div className="email-priority" style={{ background: priorityConfig.bgColor, color: priorityConfig.color }}>
                        {priorityConfig.label}
                      </div>
                      <div className="email-content">
                        <div className="email-sender">
                          {categoryConfig.icon} {email.sender}
                        </div>
                        <div className="email-subject">{email.subject || '(件名なし)'}</div>
                      </div>
                      <div className="email-score" style={{ background: priorityConfig.color }}>
                        {email.urgencyScore}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>
          )}
        </>
      )}

      {/* VIP/無視リストタブ */}
      {activeTab === 'vip' && (
        <>
          {/* VIPリスト */}
          <section className="list-section">
            <h2>⭐ VIPリスト</h2>
            <p className="section-desc">常に高優先度で表示する送信者</p>
            <div className="input-group">
              <input
                type="text"
                placeholder="メールアドレスまたはドメイン"
                value={newVip}
                onChange={(e) => setNewVip(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addVip()}
              />
              <button className="btn-add" onClick={addVip}>追加</button>
            </div>
            <ul className="tag-list">
              {settings?.vipList.map((email, index) => (
                <li key={index} className="tag vip-tag">
                  <span>{email}</span>
                  <button className="tag-remove" onClick={() => removeVip(email)}>×</button>
                </li>
              ))}
              {(!settings?.vipList || settings.vipList.length === 0) && (
                <li className="empty-message">VIPが登録されていません</li>
              )}
            </ul>
          </section>

          {/* 無視リスト */}
          <section className="list-section">
            <h2>🚫 無視リスト</h2>
            <p className="section-desc">常に低優先度で表示する送信者</p>
            <div className="input-group">
              <input
                type="text"
                placeholder="メールアドレスまたはドメイン"
                value={newIgnore}
                onChange={(e) => setNewIgnore(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addIgnore()}
              />
              <button className="btn-add" onClick={addIgnore}>追加</button>
            </div>
            <ul className="tag-list">
              {settings?.ignoreList.map((email, index) => (
                <li key={index} className="tag ignore-tag">
                  <span>{email}</span>
                  <button className="tag-remove" onClick={() => removeIgnore(email)}>×</button>
                </li>
              ))}
              {(!settings?.ignoreList || settings.ignoreList.length === 0) && (
                <li className="empty-message">無視リストは空です</li>
              )}
            </ul>
          </section>
        </>
      )}

      {/* カスタムルールタブ */}
      {activeTab === 'rules' && (
        <section className="rules-section">
          <h2>📋 カスタムルール</h2>
          <p className="section-desc">詳細設定でルールを追加できます</p>

          {settings?.customRules && settings.customRules.length > 0 ? (
            <ul className="rule-list">
              {settings.customRules.map((rule) => (
                <li key={rule.id} className="rule-item">
                  <div className="rule-header">
                    <label className="toggle-item compact">
                      <input
                        type="checkbox"
                        checked={rule.enabled}
                        onChange={() => toggleRule(rule.id)}
                      />
                      <span className="toggle-switch small"></span>
                    </label>
                    <span className="rule-name">{rule.name}</span>
                    <button className="btn-delete" onClick={() => deleteRule(rule.id)}>🗑️</button>
                  </div>
                  <div className="rule-details">
                    <span className="rule-priority" style={{
                      background: PRIORITY_CONFIG[rule.priority]?.bgColor,
                      color: PRIORITY_CONFIG[rule.priority]?.color
                    }}>
                      {PRIORITY_CONFIG[rule.priority]?.label}
                    </span>
                    <span className="rule-category">
                      {CATEGORY_CONFIG[rule.category]?.icon} {CATEGORY_CONFIG[rule.category]?.label}
                    </span>
                    <span className="rule-boost">+{rule.scoreBoost}pt</span>
                  </div>
                  <div className="rule-conditions">
                    {rule.conditions.map((cond, i) => (
                      <span key={i} className="condition-tag">
                        {cond.field}: {cond.value}
                      </span>
                    ))}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="empty-rules">
              <p>カスタムルールがありません</p>
              <button className="btn btn-secondary" onClick={openOptions}>
                ⚙️ 詳細設定でルールを追加
              </button>
            </div>
          )}
        </section>
      )}

      {/* アクションボタン */}
      <section className="actions-section">
        <button className="btn btn-primary" onClick={handleRefresh}>
          🔄 再分類
        </button>
        <button className="btn btn-secondary" onClick={openOptions}>
          ⚙️ 詳細設定
        </button>
      </section>

      <footer className="sidepanel-footer">
        <p>Gmailを開くと自動で分類されます</p>
      </footer>
    </div>
  );
};

const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(<SidePanel />);
}
