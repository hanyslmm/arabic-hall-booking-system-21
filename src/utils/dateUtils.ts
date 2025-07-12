/**
 * Date utilities for Arabic Hall Booking System
 * Provides consistent Gregorian calendar date formatting
 */

import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

/**
 * Format date to Arabic Gregorian calendar format
 * @param date - Date to format (string or Date object)
 * @param formatString - date-fns format string (default: 'PPP' for long date)
 * @returns Formatted date string in Arabic Gregorian calendar
 */
export const formatArabicDate = (date: string | Date, formatString: string = 'PPP'): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return format(dateObj, formatString, { locale: ar });
};

/**
 * Format date for display in tables and lists (short format)
 * @param date - Date to format
 * @returns Short formatted date string
 */
export const formatShortArabicDate = (date: string | Date): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleDateString('ar-EG', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

/**
 * Format time to Arabic format
 * @param time - Time string (HH:mm format)
 * @returns Formatted time string
 */
export const formatArabicTime = (time: string): string => {
  return new Date(`2000-01-01T${time}`).toLocaleTimeString('ar-EG', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
};

/**
 * Check if a date is in Gregorian calendar format
 * @param date - Date to check
 * @returns true if date is valid Gregorian date
 */
export const isValidGregorianDate = (date: string | Date): boolean => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return !isNaN(dateObj.getTime());
};
