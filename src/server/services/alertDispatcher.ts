import type { AlertPayload } from '../../shared/dto/modsignal';
import { reddit } from '@devvit/web/server';

export class AlertDispatcher {
  async dispatch(alert: AlertPayload): Promise<string | undefined> {
    try {
      const severityEmoji = alert.severity === 'critical' ? '🚨' : alert.severity === 'high' ? '⚠️' : alert.severity === 'medium' ? '🔶' : '🔵';
      const bullet = (text: string) => `• ${text}`;

      const lines: string[] = [
        `## ${severityEmoji} ModSignal Alert: ${alert.severity.toUpperCase()} — ${alert.type.replace(/_/g, ' ')}`,
        '',
        `**Risk Score:** ${alert.score}/100 | **Confidence:** ${alert.score}%`,
        `**Users Flagged:** ${alert.affectedUsers.length}`,
        `**Related Posts:** ${alert.relatedPosts.length} | **Related Comments:** ${alert.relatedComments.length}`,
        '',
        '**Why this was detected:**',
        ...(alert.explainability
          ? [
              bullet(`Burst anomaly: ${Math.round(alert.explainability.burstAnomalyScore)}% (z-score: ${alert.explainability.burstZScore.toFixed(2)})`),
              bullet(`Coordinated clusters: ${alert.explainability.clusterCount} (confidence: ${Math.round(alert.explainability.clusterConfidence)}%)`),
              bullet(`Suspicious account ratio: ${Math.round(alert.explainability.suspiciousAccountRatio * 100)}%`),
              bullet(`Temporal anomaly: ${alert.explainability.temporalAnomaly ? 'Yes' : 'No'}`),
              '',
              `*${alert.explainability.summary}*`,
            ]
          : []),
        '',
        '**Reason codes:**',
        ...alert.reasonCodes.map((c) => bullet(`\`${c}\``)),
        '',
        ...(alert.affectedUsers.length > 0
          ? [
              '',
              '**Flagged users:**',
              ...alert.affectedUsers.slice(0, 20).map(
                (u) => bullet(`u/${u.username} (age: ${u.accountAgeDays.toFixed(0)}d, karma: ${u.karmaScore})`)
              ),
              ...(alert.affectedUsers.length > 20 ? [bullet(`… and ${alert.affectedUsers.length - 20} more`)] : []),
              '',
            ]
          : []),
        '---',
        '',
        '**Recommended action:** Moderators can acknowledge, monitor, investigate, escalate, or dismiss this alert from the ModSignal dashboard.',
        '',
        '*This is an automated alert from ModSignal. Alerts are re-evaluated every 5 minutes.*',
      ];

      const body = lines.join('\n');
      const postId = alert.relatedPosts[0];
      if (!postId) return undefined;

      const comment = await reddit.submitComment({
        id: postId as `t3_${string}`,
        text: body,
      });

      await comment.distinguish(true);

      return comment.id;
    } catch (error) {
      console.error('AlertDispatcher: Failed to dispatch alert', error);
      return undefined;
    }
  }
}
