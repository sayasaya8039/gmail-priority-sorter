import React, { useState, useEffect, useCallback } from 'react';
import { createRoot } from 'react-dom/client';
import type { ExtensionSettings, ClassifiedEmail } from '../types';
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

const SidePanel: React.FC = () => {
  const [settings, setSettings] = useState<ExtensionSettings | null>(null);
  const [emails, setEmails] = useState<EmailSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ critical: 0, high: 0, medium: 0, low: 0 });

  useEffect(() => {
    loadData();

    // コンテンツスクリプトからのメッセージを受信
    chrome.runtime.onMessage.addListener(handleMessage);

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

      {/* アクションボタン */}
      <section className="actions-section">
        <button className="btn btn-primary" onClick={handleRefresh}>
          🔄 再分類
        </button>
        <button className="btn btn-secondary" onClick={openOptions}>
          ⚙️ 詳細設定
        </button>
      </section>

      {/* メール一覧 */}
      {emails.length > 0 && (
        <section className="emails-section">
          <h2>📬 分類済みメール</h2>
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
