import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function applySpecialShortcodes(value: string): string {
  if (typeof value !== 'string') return value;
  return value
    .replace(/\[`a\]/g, 'Ã¡')
    .replace(/\[`A\]/g, 'Ã')
    .replace(/\[`e\]/g, 'Ã©')
    .replace(/\[`E\]/g, 'Ã‰')
    .replace(/\[`i\]/g, 'Ã­')
    .replace(/\[`I\]/g, 'Ã')
    .replace(/\[`o\]/g, 'Ã³')
    .replace(/\[`O\]/g, 'Ã“')
    .replace(/\[`u\]/g, 'Ãº')
    .replace(/\[`U\]/g, 'Ãš')
    .replace(/\[`n\]/g, 'Ã±')
    .replace(/\[`N\]/g, 'Ã‘');
}

export function isUUID(id: string): boolean {
  if (!id) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
}
