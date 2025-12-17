/**
 * メール分類エンジン
 * ルールベースでメールを分析し、優先度と緊急度スコアを算出
 */

import type {
  RawEmailData,
  ClassifiedEmail,
  PriorityLevel,
  EmailCategory,
  ExtensionSettings,
  RuleCondition,
} from '../types';

/**
 * 緊急キーワード（件名・本文に含まれると緊急度UP）
 */
const URGENT_KEYWORDS = [
  '緊急', '至急', '急ぎ', 'URGENT', 'urgent', 'ASAP', 'asap',
  '今日中', '本日中', '即日', '直ちに', 'immediately',
  '重要', '要対応', '要返信', '要確認', '期限',
  'deadline', 'Deadline', '締切', '締め切り',
];

/**
 * 会議・予定キーワード
 */
const MEETING_KEYWORDS = [
  '会議', 'ミーティング', 'meeting', 'Meeting', 'MTG', 'mtg',
  '打ち合わせ', '打合せ', '予定', 'スケジュール', 'schedule',
  'calendar', 'Calendar', '招待', 'invitation', 'Invitation',
  'Zoom', 'zoom', 'Teams', 'Google Meet', 'Webex',
];

/**
 * アクション要求キーワード
 */
const ACTION_KEYWORDS = [
  '確認してください', 'ご確認', 'お願いします', 'お願い致します',
  '返信', 'reply', 'Reply', 'response', 'Response',
  '承認', '申請', 'approval', 'Approval', 'request', 'Request',
  'レビュー', 'review', 'Review', 'feedback', 'Feedback',
];

/**
 * ニュースレター・プロモーションキーワード
 */
const NEWSLETTER_KEYWORDS = [
  'ニュースレター', 'newsletter', 'Newsletter',
  '配信', 'お知らせ', '最新情報', 'update', 'Update',
  'digest', 'Digest', 'weekly', 'Weekly', 'monthly', 'Monthly',
];

const PROMOTION_KEYWORDS = [
  'セール', 'sale', 'Sale', 'SALE', '割引', 'discount', 'Discount',
  'クーポン', 'coupon', 'Coupon', 'キャンペーン', 'campaign',
  '限定', '特別', 'special', 'Special', 'offer', 'Offer',
  '無料', 'free', 'Free', 'FREE', 'お得', 'ポイント',
];

/**
 * SNS通知キーワード
 */
const SOCIAL_KEYWORDS = [
  'Twitter', 'twitter', 'X.com', 'Facebook', 'facebook',
  'LinkedIn', 'linkedin', 'Instagram', 'instagram',
  'いいね', 'like', 'Like', 'コメント', 'comment', 'Comment',
  'フォロー', 'follow', 'Follow', 'メンション', 'mention',
  'リツイート', 'retweet', 'share', 'Share',
];

/**
 * 低優先度送信者パターン
 */
const LOW_PRIORITY_SENDER_PATTERNS = [
  /noreply@/i,
  /no-reply@/i,
  /donotreply@/i,
  /notifications?@/i,
  /newsletter@/i,
  /marketing@/i,
  /info@/i,
  /support@/i,
  /mailer@/i,
];

/**
 * 条件にマッチするかチェック
 */
function matchCondition(value: string, condition: RuleCondition): boolean {
  const targetValue = condition.caseSensitive ? value : value.toLowerCase();
  const matchValue = condition.caseSensitive ? condition.value : condition.value.toLowerCase();

  switch (condition.matchType) {
    case 'contains':
      return targetValue.includes(matchValue);
    case 'startsWith':
      return targetValue.startsWith(matchValue);
    case 'endsWith':
      return targetValue.endsWith(matchValue);
    case 'exact':
      return targetValue === matchValue;
    case 'regex':
      try {
        const flags = condition.caseSensitive ? '' : 'i';
        return new RegExp(condition.value, flags).test(value);
      } catch {
        return false;
      }
    default:
      return false;
  }
}

/**
 * テキストにキーワードが含まれるかチェック
 */
function containsKeywords(text: string, keywords: string[]): boolean {
  const lowerText = text.toLowerCase();
  return keywords.some(keyword => lowerText.includes(keyword.toLowerCase()));
}

/**
 * キーワードマッチ数をカウント
 */
function countKeywordMatches(text: string, keywords: string[]): number {
  const lowerText = text.toLowerCase();
  return keywords.filter(keyword => lowerText.includes(keyword.toLowerCase())).length;
}

/**
 * 送信者が低優先度パターンにマッチするかチェック
 */
function isLowPrioritySender(sender: string): boolean {
  return LOW_PRIORITY_SENDER_PATTERNS.some(pattern => pattern.test(sender));
}

/**
 * メールのカテゴリを判定
 */
function categorizeEmail(email: RawEmailData): EmailCategory {
  const combinedText = `${email.subject} ${email.snippet}`;

  // 優先順位順にチェック
  if (containsKeywords(combinedText, URGENT_KEYWORDS)) {
    return 'urgent';
  }
  if (containsKeywords(combinedText, MEETING_KEYWORDS)) {
    return 'meeting';
  }
  if (containsKeywords(combinedText, ACTION_KEYWORDS)) {
    return 'action';
  }
  if (containsKeywords(email.sender, SOCIAL_KEYWORDS) || containsKeywords(email.subject, SOCIAL_KEYWORDS)) {
    return 'social';
  }
  if (containsKeywords(combinedText, PROMOTION_KEYWORDS)) {
    return 'promotion';
  }
  if (containsKeywords(combinedText, NEWSLETTER_KEYWORDS) || isLowPrioritySender(email.sender)) {
    return 'newsletter';
  }

  return 'other';
}

/**
 * 緊急度スコアを計算（0-100）
 */
function calculateUrgencyScore(
  email: RawEmailData,
  category: EmailCategory,
  settings: ExtensionSettings
): number {
  let score = 50; // ベーススコア
  const combinedText = `${email.subject} ${email.snippet}`;

  // カテゴリによる基本スコア調整
  const categoryScores: Record<EmailCategory, number> = {
    urgent: 30,
    important: 20,
    meeting: 15,
    action: 15,
    fyi: 0,
    newsletter: -20,
    promotion: -25,
    social: -15,
    other: 0,
  };
  score += categoryScores[category];

  // 緊急キーワードの数でスコア加算
  score += countKeywordMatches(combinedText, URGENT_KEYWORDS) * 10;

  // アクションキーワードでスコア加算
  score += countKeywordMatches(combinedText, ACTION_KEYWORDS) * 5;

  // 未読メールはスコア加算
  if (email.isUnread) {
    score += 10;
  }

  // スター付きはスコア加算
  if (email.isStarred) {
    score += 15;
  }

  // 添付ファイル付きはスコア加算（重要な可能性）
  if (email.hasAttachment) {
    score += 5;
  }

  // VIPリストにある送信者は大幅加算
  if (settings.vipList.some(vip => email.sender.toLowerCase().includes(vip.toLowerCase()))) {
    score += 30;
  }

  // 無視リストにある送信者は大幅減算
  if (settings.ignoreList.some(ignore => email.sender.toLowerCase().includes(ignore.toLowerCase()))) {
    score -= 40;
  }

  // 低優先度送信者パターンは減算
  if (isLowPrioritySender(email.sender)) {
    score -= 20;
  }

  // カスタムルールの適用
  for (const rule of settings.customRules) {
    if (!rule.enabled) continue;

    const allConditionsMet = rule.conditions.every(condition => {
      const fieldValue = email[condition.field];
      return matchCondition(fieldValue, condition);
    });

    if (allConditionsMet) {
      score += rule.scoreBoost;
    }
  }

  // スコアを0-100の範囲に制限
  return Math.max(0, Math.min(100, score));
}

/**
 * スコアから優先度レベルを決定
 */
function scoreToPriority(score: number): PriorityLevel {
  if (score >= 80) return 'critical';
  if (score >= 60) return 'high';
  if (score >= 40) return 'medium';
  return 'low';
}

/**
 * 分類理由を生成
 */
function generateReason(
  email: RawEmailData,
  category: EmailCategory,
  urgencyScore: number,
  settings: ExtensionSettings
): string {
  const reasons: string[] = [];
  const combinedText = `${email.subject} ${email.snippet}`;

  // VIPチェック
  const matchedVip = settings.vipList.find(vip =>
    email.sender.toLowerCase().includes(vip.toLowerCase())
  );
  if (matchedVip) {
    reasons.push(`VIP送信者: ${matchedVip}`);
  }

  // カテゴリ別の理由
  if (category === 'urgent' && containsKeywords(combinedText, URGENT_KEYWORDS)) {
    reasons.push('緊急キーワードを検出');
  }
  if (category === 'meeting') {
    reasons.push('会議・予定に関連');
  }
  if (category === 'action') {
    reasons.push('対応が必要な内容');
  }

  // 状態による理由
  if (email.isUnread) {
    reasons.push('未読');
  }
  if (email.isStarred) {
    reasons.push('スター付き');
  }
  if (email.hasAttachment) {
    reasons.push('添付ファイルあり');
  }

  if (reasons.length === 0) {
    reasons.push('標準分類');
  }

  return reasons.join(' / ');
}

/**
 * メールを分類する
 */
export function classifyEmail(
  email: RawEmailData,
  settings: ExtensionSettings
): ClassifiedEmail {
  const category = categorizeEmail(email);
  const urgencyScore = calculateUrgencyScore(email, category, settings);
  const priority = scoreToPriority(urgencyScore);
  const reason = generateReason(email, category, urgencyScore, settings);

  return {
    elementId: email.elementId,
    sender: email.sender,
    subject: email.subject,
    snippet: email.snippet,
    date: email.date,
    priority,
    urgencyScore,
    category,
    reason,
  };
}

/**
 * 複数のメールを分類してソート
 */
export function classifyAndSortEmails(
  emails: RawEmailData[],
  settings: ExtensionSettings
): ClassifiedEmail[] {
  const classified = emails.map(email => classifyEmail(email, settings));

  // 緊急度スコアの降順でソート
  return classified.sort((a, b) => b.urgencyScore - a.urgencyScore);
}
