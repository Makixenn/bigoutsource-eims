import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function applySpecialShortcodes(value: string): string {
  if (typeof value !== 'string') return value;
  return value
    .replace(/\[`a\]/g, 'á')
    .replace(/\[`A\]/g, 'Á')
    .replace(/\[`e\]/g, 'é')
    .replace(/\[`E\]/g, 'É')
    .replace(/\[`i\]/g, 'í')
    .replace(/\[`I\]/g, 'Í')
    .replace(/\[`o\]/g, 'ó')
    .replace(/\[`O\]/g, 'Ó')
    .replace(/\[`u\]/g, 'ú')
    .replace(/\[`U\]/g, 'Ú')
    .replace(/\[`n\]/g, 'ñ')
    .replace(/\[`N\]/g, 'Ñ');
}
