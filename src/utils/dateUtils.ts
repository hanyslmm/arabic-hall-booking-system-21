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
 * Format time to 12-hour format with AM/PM
 * @param time - Time string (HH:mm:ss or HH:mm format)
 * @returns Formatted time string with AM/PM
 */
export const formatTimeAmPm = (time: string): string => {
  // Remove seconds if present
  const cleanTime = time.split(':').slice(0, 2).join(':');
  const [hours, minutes] = cleanTime.split(':');
  const hour = parseInt(hours, 10);
  const minute = parseInt(minutes, 10);
  
  const period = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  
  return `${displayHour}:${minute.toString().padStart(2, '0')} ${period}`;
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
