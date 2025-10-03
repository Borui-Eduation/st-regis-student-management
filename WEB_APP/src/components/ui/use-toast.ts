import { useState } from 'react';

export interface Toast {
  title: string;
  description?: string;
  variant?: 'default' | 'success' | 'destructive';
}

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = (props: Toast) => {
    // 简单的 toast 实现 - 使用 alert 作为临时方案
    alert(`${props.title}\n${props.description || ''}`);
  };

  return { toast, toasts };
}

