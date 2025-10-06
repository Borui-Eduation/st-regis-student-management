/**
 * i18n Helper Functions
 * 国际化辅助函数
 */

import { useTranslations } from 'next-intl';

/**
 * Hook to translate status values
 * 用于翻译状态值的 Hook
 */
export function useStatusTranslation() {
  const t = useTranslations('status');
  
  return (status: string) => {
    return t(status as any) || status;
  };
}

/**
 * Hook to translate role values
 * 用于翻译角色值的 Hook
 */
export function useRoleTranslation() {
  const t = useTranslations('roles');
  
  return (role: string) => {
    return t(role as any) || role;
  };
}

/**
 * Hook to translate payment status
 * 用于翻译支付状态的 Hook
 */
export function usePaymentStatusTranslation() {
  const t = useTranslations('payment.status');
  
  return (status: string) => {
    return t(status as any) || status;
  };
}

/**
 * Hook to translate payment method
 * 用于翻译支付方式的 Hook
 */
export function usePaymentMethodTranslation() {
  const t = useTranslations('payment.methods');
  
  return (method: string) => {
    return t(method as any) || method;
  };
}
