interface PaginationProps {
  page: number
  totalPages: number
  totalElements: number
  pageSize: number
  onChange: (page: number) => void
}

export function Pagination({
  page,
  totalPages,
  totalElements,
  pageSize,
  onChange,
}: PaginationProps) {
  const start = totalElements === 0 ? 0 : page * pageSize + 1
  const end = Math.min(totalElements, (page + 1) * pageSize)

  return (
    <div className="pagination">
      <div className="pagination__info">
        Showing <strong>{start}</strong>–<strong>{end}</strong> of{' '}
        <strong>{totalElements}</strong>
      </div>
      <div className="pagination__controls">
        <button
          type="button"
          className="btn btn--secondary btn--sm"
          disabled={page === 0}
          onClick={() => onChange(page - 1)}
        >
          ← Prev
        </button>
        <button
          type="button"
          className="btn btn--secondary btn--sm"
          disabled={totalPages === 0 || page >= totalPages - 1}
          onClick={() => onChange(page + 1)}
        >
          Next →
        </button>
      </div>
    </div>
  )
}
