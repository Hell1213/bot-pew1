import type { OnPostCreateRequest } from '@devvit/web/shared';
import type { ActivityEvent } from '../../shared/dto/modsignal';
import type { WindowManager } from '../services/windowManager';

export const handlePostCreate = async (
  input: OnPostCreateRequest,
  wm: WindowManager,
): Promise<void> => {
  try {
    const post = input.post;
    const author = input.author;
    if (!post || !author) return;

    const event: ActivityEvent = {
      type: 'post',
      userId: author.id,
      username: author.name,
      subreddit: input.subreddit?.name ?? '',
      postId: post.id,
      timestamp: post.createdAt,
      accountCreatedAt: 0,
      postKarma: author.karma,
      commentKarma: 0,
      isNewAccount: author.karma < 10,
    };

    await wm.recordEvent(event);
  } catch (error) {
    console.error('[OnPostCreate]', error);
  }
};
