import type { OnCommentCreateRequest } from '@devvit/web/shared';
import type { ActivityEvent } from '../../shared/dto/modsignal';
import type { WindowManager } from '../services/windowManager';

export const handleCommentCreate = async (
  input: OnCommentCreateRequest,
  wm: WindowManager,
): Promise<void> => {
  try {
    const comment = input.comment;
    const author = input.author;
    if (!comment || !author) return;

    const event: ActivityEvent = {
      type: 'comment',
      userId: author.id,
      username: author.name,
      subreddit: input.subreddit?.name ?? '',
      postId: comment.postId,
      commentId: comment.id,
      timestamp: comment.createdAt,
      accountCreatedAt: 0,
      postKarma: 0,
      commentKarma: author.karma,
      isNewAccount: author.karma < 10,
    };

    await wm.recordEvent(event);
  } catch (error) {
    console.error('[OnCommentCreate]', error);
  }
};
