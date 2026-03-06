import React, { useEffect, useMemo, useState } from 'react';
import {
  Table,
  Header,
  HeaderRow,
  HeaderCell,
  Body,
  Row,
  Cell,
} from '@table-library/react-table-library/table';
import '../styles/AdminTable.css';

const AdminTable = ({
  columns,
  data,
  loading = false,
  emptyText = 'No data found.',
  rowKey,
  pageSizeOptions = [10, 20, 50],
  initialPageSize = 10,
  onRefresh,
}) => {
  const nodes = Array.isArray(data) ? data : [];
  const getKey = rowKey || ((item) => item.id);
  const [sortKey, setSortKey] = useState(null);
  const [sortOrder, setSortOrder] = useState('asc');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);

  useEffect(() => {
    setPage(1);
  }, [pageSize, data]);

  const sortedNodes = useMemo(() => {
    if (!sortKey) return nodes;
    const column = columns.find((col) => (col.key || col.label) === sortKey);
    if (!column?.sortValue) return nodes;
    const sorted = [...nodes].sort((a, b) => {
      const aValue = column.sortValue(a);
      const bValue = column.sortValue(b);
      if (aValue == null && bValue == null) return 0;
      if (aValue == null) return 1;
      if (bValue == null) return -1;
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return aValue - bValue;
      }
      return String(aValue).localeCompare(String(bValue));
    });
    return sortOrder === 'asc' ? sorted : sorted.reverse();
  }, [columns, nodes, sortKey, sortOrder]);

  const totalPages = Math.max(1, Math.ceil(sortedNodes.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pagedNodes = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return sortedNodes.slice(start, start + pageSize);
  }, [pageSize, safePage, sortedNodes]);

  const displayNodes = loading
    ? [{ id: '__loading' }]
    : sortedNodes.length === 0
      ? [{ id: '__empty' }]
      : pagedNodes;

  const visiblePages = useMemo(() => {
    const windowSize = 5;
    const start = Math.max(1, safePage - Math.floor(windowSize / 2));
    const end = Math.min(totalPages, start + windowSize - 1);
    const pages = [];
    for (let i = start; i <= end; i += 1) pages.push(i);
    return pages;
  }, [safePage, totalPages]);

  return (
    <div className="admin-table-container">
      <div className="admin-table-controls">
        <div className="admin-table-count">
          {sortedNodes.length} total
        </div>
        <div className="admin-table-right-controls">
          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              disabled={loading}
              className="admin-table-refresh"
              title="Refresh table data"
            >
              {loading ? 'Refreshing...' : '⟲ Refresh'}
            </button>
          )}
          <div className="admin-table-pagination">
            <button
              type="button"
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              disabled={safePage === 1 || loading}
            >
              Prev
            </button>
          {visiblePages.map((pageNumber) => (
            <button
              key={pageNumber}
              type="button"
              className={pageNumber === safePage ? 'active' : ''}
              onClick={() => setPage(pageNumber)}
              disabled={loading}
            >
              {pageNumber}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
            disabled={safePage === totalPages || loading}
          >
            Next
          </button>
          <select
            value={pageSize}
            onChange={(event) => setPageSize(Number(event.target.value))}
            disabled={loading}
          >
            {pageSizeOptions.map((size) => (
              <option key={size} value={size}>
                {size} / page
              </option>
            ))}
          </select>
          </div>
        </div>
      </div>

      <Table data={{ nodes: displayNodes }} className="admin-table">
        {(tableList) => (
          <>
            <Header>
              <HeaderRow>
                {columns.map((column) => (
                  <HeaderCell key={column.key || column.label} className={column.headerClassName}>
                    {column.sortValue ? (
                      <button
                        type="button"
                        className="admin-table-sort"
                        onClick={() => {
                          const key = column.key || column.label;
                          if (sortKey === key) {
                            setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
                          } else {
                            setSortKey(key);
                            setSortOrder('asc');
                          }
                        }}
                      >
                        {column.label}
                        <span>
                          {sortKey === (column.key || column.label)
                            ? (sortOrder === 'asc' ? '▲' : '▼')
                            : '↕'}
                        </span>
                      </button>
                    ) : (
                      column.label
                    )}
                  </HeaderCell>
                ))}
              </HeaderRow>
            </Header>
            <Body>
              {tableList.map((item) => {
                if (item.id === '__loading') {
                  return (
                    <Row key="__loading" item={item}>
                      <Cell colSpan={columns.length} className="admin-table-empty">
                        Loading...
                      </Cell>
                    </Row>
                  );
                }

                if (item.id === '__empty') {
                  return (
                    <Row key="__empty" item={item}>
                      <Cell colSpan={columns.length} className="admin-table-empty">
                        {emptyText}
                      </Cell>
                    </Row>
                  );
                }

                return (
                  <Row key={getKey(item)} item={item}>
                    {columns.map((column) => (
                      <Cell key={column.key || column.label} className={column.cellClassName}>
                        {column.render(item)}
                      </Cell>
                    ))}
                  </Row>
                );
              })}
            </Body>
          </>
        )}
      </Table>
    </div>
  );
};

export default AdminTable;
