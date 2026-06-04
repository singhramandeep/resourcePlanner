import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function obfuscate(str: string, enabled: boolean) {
  if (!enabled || !str) return str;
  return str.split('').map((char, i) => {
    if (char === ' ') return ' ';
    return i % 2 === 1 ? '*' : char;
  }).join('');
}
