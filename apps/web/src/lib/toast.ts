export const toast = {
  success(message: string): void {
    console.log('[toast.success]', message);
  },
  error(message: string): void {
    console.error('[toast.error]', message);
  },
  warning(message: string): void {
    console.warn('[toast.warning]', message);
  }
};
