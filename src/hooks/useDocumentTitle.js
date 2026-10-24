import { useEffect } from 'react';
import { appName } from '@/config/env';

export function useDocumentTitle(title) {
  useEffect(() => {
    document.title = title ? `${title} | ${appName}` : appName;
  }, [title]);
}
