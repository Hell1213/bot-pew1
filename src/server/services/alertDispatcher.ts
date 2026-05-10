import type { AlertPayload } from '../../shared/dto/modsignal';
import { reddit } from '@devvit/web/server';

const SEVERITY_ICONS: Record<string, string> = {
  critical: '🔴 CRITICAL',
  high: '🟠 HIGH',
  medium: '🟡 MEDIUM',
  low: '🔵 LOW',
};

export interface AlertDispatcher {
  dispatchAlert(alert: AlertPayload): Promise<void>;
}

export const createAlertDispatcher = (): AlertDispatcher => ({
  async dispatchAlert(alert: AlertPayload): Promise<void> {
    try {
      if (alert.relatedPosts.length === 0) return;

      const lines: string[] = [
        `⚠️ **ModSignal Alert: ${alert.type.toUpperCase()}**`,
        '',
        `**Severity:** ${SEVERITY_ICONS[alert.severity] ?? alert.severity}`,
        `**Score:** ${alert.score}/100`,
        `**Affected Users:** ${alert.affectedUsers.length}`,
        `**Time:** ${new Date(alert.timestamp).toISOString()}`,
        '',
        '**Reason Codes:**',
        ...alert.reasonCodes.map((c) => `- \`${c}\``),
        '',
        '---',
        '🤖 ModSignal v1.0 — Use the dashboard to dismiss this alert.',
      ];

      const body = lines.join('\n');
      const postId = alert.relatedPosts[0] as unknown as `t3_${string}`;

      await reddit.submitComment({
        id: postId,
        text: body,
      });
    } catch (error) {
      console.error('[AlertDispatcher]', error);
    }
  },
});
