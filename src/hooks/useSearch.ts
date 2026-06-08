import { useState, useMemo, useCallback } from 'react'

export function useSearch<T>(items: T[], searchFields: (keyof T)[], initialQuery = '') {
  const [query, setQuery] = useState(initialQuery)

  const filtered = useMemo(() => {
    if (!query.trim()) return items
    const q = query.toLowerCase()
    return items.filter((item) =>
      searchFields.some((field) => {
        const val = item[field]
        return val != null && String(val).toLowerCase().includes(q)
      })
    )
  }, [items, query, searchFields])

  const clearSearch = useCallback(() => setQuery(''), [])

  return { query, setQuery, filtered, clearSearch }
}
