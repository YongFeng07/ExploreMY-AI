export function isValidEmail(email: string): boolean { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email); }
export function isValidPassword(pw: string): boolean { return pw.length >= 8; }
export function isValidUrl(url: string): boolean { try { new URL(url); return true; } catch { return false; } }
export function isWithinRange(val: number, min: number, max: number): boolean { return val >= min && val <= max; }
