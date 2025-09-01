// Utility functions for formatting data in the demo
import { TelecomOperator } from '@/lib/types';

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export function formatDuration(seconds: number): string {
  if (seconds < 60) {
    return `${seconds}s`;
  } else if (seconds < 3600) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`;
  } else {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
  }
}

export function formatPhoneNumber(phone: string): string {
  // Format Indian phone numbers
  if (phone.startsWith('+91')) {
    const number = phone.slice(3);
    return `+91 ${number.slice(0, 5)} ${number.slice(5)}`;
  }
  return phone;
}

export function formatTimestamp(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
}

export function formatRelativeTime(date: Date | string): string {
  const now = new Date();
  const then = new Date(date);
  const diffMs = now.getTime() - then.getTime();
  
  const diffMinutes = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  
  if (diffMinutes < 1) return 'Just now';
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  
  return formatTimestamp(date);
}

export function formatHash(hash: string, length: number = 8): string {
  return hash.length > length ? `${hash.slice(0, length)}...` : hash;
}

export function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  } else if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
}

export function getOperatorDisplayName(operator: TelecomOperator): string {
  const names = {
    airtel: 'Bharti Airtel',
    jio: 'Reliance Jio',
    vodafone: 'Vodafone Idea',
    bsnl: 'BSNL'
  };
  return names[operator];
}

export function getOperatorColor(operator: TelecomOperator): string {
  const colors = {
    airtel: '#E31E24',
    jio: '#0066CC',
    vodafone: '#E60000',
    bsnl: '#FF6600'
  };
  return colors[operator];
}

export function getSeverityColor(severity: 'low' | 'medium' | 'high' | 'critical'): string {
  const colors = {
    low: '#22C55E',     // green
    medium: '#F97316',  // orange
    high: '#EF4444',    // red
    critical: '#DC2626' // dark red
  };
  return colors[severity];
}

export function getStatusColor(status: string): string {
  const colors = {
    active: '#22C55E',
    completed: '#3B82F6',
    archived: '#6B7280',
    uploading: '#F97316',
    parsing: '#F59E0B',
    error: '#EF4444'
  };
  return colors[status as keyof typeof colors] || '#6B7280';
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}

export function formatPercentage(value: number, total: number): string {
  if (total === 0) return '0%';
  return ((value / total) * 100).toFixed(1) + '%';
}

export function formatBytes(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let size = bytes;
  let unitIndex = 0;
  
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  
  return `${size.toFixed(size < 10 ? 1 : 0)} ${units[unitIndex]}`;
}

export function generateReportFilename(caseTitle: string, type: 'pdf' | 'csv' | 'json'): string {
  const sanitizedTitle = caseTitle.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
  const timestamp = new Date().toISOString().split('T')[0];
  return `${sanitizedTitle}_report_${timestamp}.${type}`;
}

export function validatePhoneNumber(phone: string): boolean {
  // Basic validation for Indian phone numbers
  const phoneRegex = /^\+91[6-9]\d{9}$/;
  return phoneRegex.test(phone);
}

export function validateIPAddress(ip: string): boolean {
  const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
  return ipRegex.test(ip);
}

export function calculateUptime(startTime: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - startTime.getTime();
  const diffDays = Math.floor(diffMs / 86400000);
  const diffHours = Math.floor((diffMs % 86400000) / 3600000);
  const diffMinutes = Math.floor((diffMs % 3600000) / 60000);
  
  if (diffDays > 0) return `${diffDays}d ${diffHours}h`;
  if (diffHours > 0) return `${diffHours}h ${diffMinutes}m`;
  return `${diffMinutes}m`;
}
