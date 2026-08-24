import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function checkIsAdminDomain() {
  if (typeof window === 'undefined') return false;
  return (
    window.location.hostname === 'admin.byjuliaaleixo.online' ||
    window.location.hostname.startsWith('admin.') || 
    window.location.hostname.includes('admin-') ||
    window.location.href.includes('admin=true')
  );
}
