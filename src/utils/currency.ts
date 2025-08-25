/**
 * Centralized currency formatting utilities for consistent display across the app
 */

export const formatCurrency = (amount: number, currency: 'SAR' | 'EGP' = 'EGP'): string => {
  const numericAmount = Number(amount || 0);
  
  switch (currency) {
    case 'SAR':
      return new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 0,
      }).format(numericAmount) + ' ر.س';
      
    case 'EGP':
      return `${numericAmount.toLocaleString('en-US')} LE`;
      
    default:
      return numericAmount.toLocaleString('en-US');
  }
};

export const formatNumber = (value: number): string => {
  return Number(value || 0).toLocaleString('en-US');
};

export const formatPercentage = (value: number, decimals: number = 1): string => {
  return `${Number(value || 0).toFixed(decimals)}%`;
};