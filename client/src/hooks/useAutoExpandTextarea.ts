import { useEffect, useRef } from 'react';

export function useAutoExpandTextarea() {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const adjustHeight = () => {
      textarea.style.height = 'auto';
      textarea.style.height = `${textarea.scrollHeight}px`;
    };

    adjustHeight();

    textarea.addEventListener('input', adjustHeight);
    window.addEventListener('resize', adjustHeight);

    return () => {
      textarea.removeEventListener('input', adjustHeight);
      window.removeEventListener('resize', adjustHeight);
    };
  }, []);

  return textareaRef;
}
