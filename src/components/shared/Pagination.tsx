import { ChevronLeft, ChevronRight } from 'lucide-react'
import styles from './Pagination.module.css'

interface PaginationProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
}

export function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null

  const handlePageClick = (page: number) => {
    if (page >= 1 && page <= totalPages && page !== currentPage) {
      onPageChange(page)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const getPageNumbers = () => {
    const pages: (number | string)[] = []
    const maxVisiblePages = 5

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      pages.push(1)

      let start = Math.max(2, currentPage - 1)
      let end = Math.min(totalPages - 1, currentPage + 1)

      if (currentPage <= 2) {
        end = 4
      }
      if (currentPage >= totalPages - 1) {
        start = totalPages - 3
      }

      if (start > 2) {
        pages.push('...')
      }

      for (let i = start; i <= end; i++) {
        pages.push(i)
      }

      if (end < totalPages - 1) {
        pages.push('...')
      }

      pages.push(totalPages)
    }

    return pages
  }

  const pageNumbers = getPageNumbers()

  return (
    <nav className={styles.paginationContainer} aria-label="Blog pagination">
      {/* Previous Button */}
      <button
        onClick={() => handlePageClick(currentPage - 1)}
        disabled={currentPage === 1}
        className={`${styles.pageButton} ${styles.navButton} ${currentPage === 1 ? styles.disabled : ''}`}
        aria-label="Go to previous page"
      >
        <ChevronLeft size={16} />
        <span>Prev</span>
      </button>

      {/* Page Numbers */}
      {pageNumbers.map((page, index) => {
        if (page === '...') {
          return (
            <span key={`ellipsis-${index}`} className={styles.ellipsis}>
              ...
            </span>
          )
        }

        const isCurrent = page === currentPage
        return (
          <button
            key={`page-${page}`}
            onClick={() => handlePageClick(page as number)}
            className={`${styles.pageButton} ${isCurrent ? styles.active : ''}`}
            aria-current={isCurrent ? 'page' : undefined}
            aria-label={`Go to page ${page}`}
          >
            {page}
          </button>
        )
      })}

      {/* Next Button */}
      <button
        onClick={() => handlePageClick(currentPage + 1)}
        disabled={currentPage === totalPages}
        className={`${styles.pageButton} ${styles.navButton} ${currentPage === totalPages ? styles.disabled : ''}`}
        aria-label="Go to next page"
      >
        <span>Next</span>
        <ChevronRight size={16} />
      </button>
    </nav>
  )
}
