/**
 * メールの優先度レベル
 */
export type PriorityLevel = 'critical' | 'high' | 'medium' | 'low';

/**
 * メールのカテゴリ
 */
export type EmailCategory =
  | 'urgent'      // 緊急
  | 'important'   // 重要
  | 'meeting'     // 会議・予定
  | 'action'      // 要対応
  | 'fyi'         // 参考情報
  | 'newsletter'  // ニュースレター
  | 'promotion'   // プロモーション
  | 'social'      // SNS通知
  | 'other';      // その他

/**
 * 分類されたメール情報
 */
export interface ClassifiedEmail {
  /** メールのDOM要素ID */
  elementId: string;
  /** 送信者 */
  sender: string;
  /** 件名 */
  subject: string;
  /** スニペット（本文プレビュー） */
  snippet: string;
  /** 受信日時 */
  date: string;
  /** 優先度レベル */
  priority: PriorityLevel;
  /** 緊急度スコア（0-100） */
  urgencyScore: number;
  /** カテゴリ */
  category: EmailCategory;
  /** 分類理由 */
  reason: string;
}

/**
 * 分類ルール
 */
export interface ClassificationRule {
  /** ルールID */
  id: string;
  /** ルール名 */
  name: string;
  /** 有効/無効 */
  enabled: boolean;
  /** マッチ条件 */
  conditions: RuleCondition[];
  /** 付与する優先度 */
  priority: PriorityLevel;
  /** 付与するカテゴリ */
  category: EmailCategory;
  /** スコア加点 */
  scoreBoost: number;
}

/**
 * ルール条件
 */
export interface RuleCondition {
  /** 対象フィールド */
  field: 'sender' | 'subject' | 'snippet';
  /** マッチタイプ */
  matchType: 'contains' | 'startsWith' | 'endsWith' | 'regex' | 'exact';
  /** マッチ値 */
  value: string;
  /** 大文字小文字を区別するか */
  caseSensitive: boolean;
}

/**
 * 拡張機能の設定
 */
export interface ExtensionSettings {
  /** 拡張機能の有効/無効 */
  enabled: boolean;
  /** 自動ソートの有効/無効 */
  autoSort: boolean;
  /** スコア表示の有効/無効 */
  showScores: boolean;
  /** カテゴリバッジ表示の有効/無効 */
  showBadges: boolean;
  /** VIPリスト（常に高優先度にする送信者） */
  vipList: string[];
  /** 無視リスト（常に低優先度にする送信者） */
  ignoreList: string[];
  /** カスタムルール */
  customRules: ClassificationRule[];
  /** テーマ */
  theme: 'light' | 'dark' | 'auto';
}

/**
 * メッセージタイプ（background <-> content通信用）
 */
export type MessageType =
  | { type: 'CLASSIFY_EMAILS'; emails: RawEmailData[] }
  | { type: 'CLASSIFICATION_RESULT'; results: ClassifiedEmail[] }
  | { type: 'GET_SETTINGS' }
  | { type: 'SETTINGS_RESPONSE'; settings: ExtensionSettings }
  | { type: 'UPDATE_SETTINGS'; settings: Partial<ExtensionSettings> }
  | { type: 'SORT_EMAILS' }
  | { type: 'REFRESH' };

/**
 * 生のメールデータ（DOM解析結果）
 */
export interface RawEmailData {
  elementId: string;
  sender: string;
  subject: string;
  snippet: string;
  date: string;
  isUnread: boolean;
  hasAttachment: boolean;
  isStarred: boolean;
}

/**
 * 優先度レベルの設定
 */
export const PRIORITY_CONFIG: Record<PriorityLevel, { label: string; color: string; bgColor: string }> = {
  critical: { label: '緊急', color: '#DC2626', bgColor: '#FEE2E2' },
  high: { label: '高', color: '#EA580C', bgColor: '#FFEDD5' },
  medium: { label: '中', color: '#2563EB', bgColor: '#DBEAFE' },
  low: { label: '低', color: '#6B7280', bgColor: '#F3F4F6' },
};

/**
 * カテゴリの設定
 */
export const CATEGORY_CONFIG: Record<EmailCategory, { label: string; icon: string; color: string }> = {
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
