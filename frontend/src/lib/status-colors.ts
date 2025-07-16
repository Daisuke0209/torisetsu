import { ManualStatus } from '../types'

export const STATUS_COLORS = {
  [ManualStatus.PROCESSING]: {
    container: 'bg-gradient-to-r from-blue-100 to-blue-50 dark:from-blue-900/30 dark:to-blue-800/20',
    badge: {
      border: 'border-blue-200 dark:border-blue-800',
      text: 'text-blue-700 dark:text-blue-300',
      bg: 'bg-blue-50 dark:bg-blue-900/20',
      hover: 'hover:bg-blue-100 dark:hover:bg-blue-900/30'
    },
    variant: 'secondary' as const
  },
  [ManualStatus.COMPLETED]: {
    container: 'bg-gradient-to-r from-green-100 to-green-50 dark:from-green-900/30 dark:to-green-800/20',
    badge: {
      border: 'border-green-200 dark:border-green-800',
      text: 'text-green-700 dark:text-green-300',
      bg: 'bg-green-50 dark:bg-green-900/20',
      hover: 'hover:bg-green-100 dark:hover:bg-green-900/30'
    },
    variant: 'default' as const
  },
  [ManualStatus.FAILED]: {
    container: 'bg-gradient-to-r from-red-100 to-red-50 dark:from-red-900/30 dark:to-red-800/20',
    badge: {
      border: 'border-red-200 dark:border-red-800',
      text: 'text-red-700 dark:text-red-300',
      bg: 'bg-red-50 dark:bg-red-900/20',
      hover: 'hover:bg-red-100 dark:hover:bg-red-900/30'
    },
    variant: 'destructive' as const
  },
  [ManualStatus.DRAFT]: {
    container: 'bg-gradient-to-r from-slate-100 to-slate-50 dark:from-slate-700/30 dark:to-slate-600/20',
    badge: {
      border: 'border-slate-200 dark:border-slate-600',
      text: 'text-slate-700 dark:text-slate-300',
      bg: 'bg-slate-50 dark:bg-slate-700/20',
      hover: 'hover:bg-slate-100 dark:hover:bg-slate-700/30'
    },
    variant: 'outline' as const
  },
  [ManualStatus.REVIEW]: {
    container: 'bg-gradient-to-r from-amber-100 to-amber-50 dark:from-amber-900/30 dark:to-amber-800/20',
    badge: {
      border: 'border-amber-200 dark:border-amber-800',
      text: 'text-amber-700 dark:text-amber-300',
      bg: 'bg-amber-50 dark:bg-amber-900/20',
      hover: 'hover:bg-amber-100 dark:hover:bg-amber-900/30'
    },
    variant: 'secondary' as const
  },
  [ManualStatus.PUBLISHED]: {
    container: 'bg-gradient-to-r from-purple-100 to-purple-50 dark:from-purple-900/30 dark:to-purple-800/20',
    badge: {
      border: 'border-purple-200 dark:border-purple-800',
      text: 'text-purple-700 dark:text-purple-300',
      bg: 'bg-purple-50 dark:bg-purple-900/20',
      hover: 'hover:bg-purple-100 dark:hover:bg-purple-900/30'
    },
    variant: 'default' as const
  }
} as const

export const getStatusColor = (status: ManualStatus) => {
  return STATUS_COLORS[status] || STATUS_COLORS[ManualStatus.DRAFT]
}

export const STATUS_TEXT: Record<ManualStatus, string> = {
  [ManualStatus.PUBLISHED]: '公開済み',
  [ManualStatus.REVIEW]: 'レビュー中',
  [ManualStatus.DRAFT]: '下書き',
  [ManualStatus.PROCESSING]: '生成中',
  [ManualStatus.COMPLETED]: '完成',
  [ManualStatus.FAILED]: '失敗'
}

export const getStatusText = (status: ManualStatus): string => {
  return STATUS_TEXT[status] || '不明'
}