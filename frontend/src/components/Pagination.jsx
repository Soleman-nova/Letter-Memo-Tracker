import React from 'react'
import { useTranslation } from 'react-i18next'
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react'

export default function Pagination({ currentPage, totalPages, onPageChange, pageSize, onPageSizeChange, totalItems, pageSizeOptions = [10, 25, 50, 100] }) {
  const { t } = useTranslation()

  if (totalItems === 0) return null

  const startItem = (currentPage - 1) * pageSize + 1
  const endItem = Math.min(currentPage * pageSize, totalItems)

  // Generate page numbers to display
  const getPageNumbers = () => {
    const pages = []
    const maxVisible = 5
    let start = Math.max(1, currentPage - Math.floor(maxVisible / 2))
    let end = Math.min(totalPages, start + maxVisible - 1)
    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1)
    }
    for (let i = start; i <= end; i++) pages.push(i)
    return pages
  }

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50">
      <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-400">
        <span>{t('showing')} <strong>{startItem}-{endItem}</strong> {t('of')} <strong>{totalItems}</strong></span>
        <select
          className="border border-slate-200 dark:border-slate-600 rounded-md px-2 py-1 text-sm bg-white dark:bg-slate-700 dark:text-white"
          value={pageSize}
          onChange={(e) => onPageSizeChange(Number(e.target.value))}
        >
          {pageSizeOptions.map(size => (
            <option key={size} value={size}>{size} / {t('page')}</option>
          ))}
        </select>
      </div>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
          className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed text-slate-600 dark:text-slate-400"
          title={t('first_page')}
        >
          <ChevronsLeft className="w-4 h-4" />
        </button>
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed text-slate-600 dark:text-slate-400"
          title={t('previous')}
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        {getPageNumbers().map(page => (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            className={`min-w-[32px] h-8 rounded-md text-sm font-medium transition-colors ${
              page === currentPage
                ? 'bg-[#0B3C5D] dark:bg-[#F0B429] text-white dark:text-[#0B3C5D]'
                : 'hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400'
            }`}
          >
            {page}
          </button>
        ))}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed text-slate-600 dark:text-slate-400"
          title={t('next')}
        >
          <ChevronRight className="w-4 h-4" />
        </button>
        <button
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages}
          className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed text-slate-600 dark:text-slate-400"
          title={t('last_page')}
        >
          <ChevronsRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
