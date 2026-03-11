import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatNaira(amount: number | string): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num);
}

export function formatNairaDetailed(amount: number | string): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
}

export function getMonthKey(date: Date = new Date()): number {
  return date.getFullYear() * 100 + (date.getMonth() + 1);
}

export function parseMonthKey(monthKey: number): { year: number; month: number } {
  const year = Math.floor(monthKey / 100);
  const month = monthKey % 100;
  return { year, month };
}

export function formatMonthKey(monthKey: number): string {
  const { year, month } = parseMonthKey(monthKey);
  const date = new Date(year, month - 1);
  return date.toLocaleDateString('en-NG', { year: 'numeric', month: 'long' });
}

export function getLastNMonthKeys(n: number, fromDate: Date = new Date()): number[] {
  const keys: number[] = [];
  for (let i = 0; i < n; i++) {
    const d = new Date(fromDate.getFullYear(), fromDate.getMonth() - i, 1);
    keys.push(getMonthKey(d));
  }
  return keys;
}

export function generateInviteToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  for (let i = 0; i < 48; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

export function calculatePercentage(part: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((part / total) * 10000) / 100;
}
