import './index.css';

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ModSignalPost } from './ui/ModSignalPost';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ModSignalPost />
  </StrictMode>
);
