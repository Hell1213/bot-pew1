import { reddit } from '@devvit/web/server';

export const createModSignalPost = async () => {
  return await reddit.submitCustomPost({
    title: 'ModSignal Dashboard',
  });
};
