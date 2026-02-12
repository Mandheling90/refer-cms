'use client';

import { useState } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  type ColumnDef,
  type RowSelectionState,
} from '@tanstack/react-table';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Pagination } from '@/components/molecules/Pagination';
import { LoadingSpinner } from '@/components/atoms/LoadingSpinner';
import { DEFAULT_PAGE_SIZE } from '@/lib/constants';

interface DataTableProps<TData> {
  columns: ColumnDef<TData, unknown>[];
  data: TData[];
  totalItems?: number;
  currentPage?: number;
  pageSize?: number;
  totalPages?: number;
  loading?: boolean;
  enableSelection?: boolean;
  enableMultiSelection?: boolean;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  onRowClick?: (row: TData) => void;
  onSelectionChange?: (rows: TData[]) => void;
  getRowId?: (row: TData) => string;
}

export function DataTable<TData>({
  columns,
  data,
  totalItems = 0,
  currentPage = 1,
  pageSize = DEFAULT_PAGE_SIZE,
  totalPages = 1,
  loading = false,
  enableSelection = false,
  enableMultiSelection = true,
  onPageChange,
  onPageSizeChange,
  onRowClick,
  onSelectionChange,
  getRowId,
}: DataTableProps<TData>) {
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

  const selectionColumn: ColumnDef<TData, unknown> = {
    id: 'select',
    header: ({ table }) =>
      enableMultiSelection ? (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && 'indeterminate')
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="전체 선택"
        />
      ) : null,
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="행 선택"
        onClick={(e) => e.stopPropagation()}
      />
    ),
    size: 40,
  };

  const allColumns = enableSelection ? [selectionColumn, ...columns] : columns;

  const table = useReactTable({
    data,
    columns: allColumns,
    state: { rowSelection },
    enableRowSelection: enableSelection,
    enableMultiRowSelection: enableMultiSelection,
    onRowSelectionChange: (updater) => {
      const newSelection = typeof updater === 'function' ? updater(rowSelection) : updater;
      setRowSelection(newSelection);
      if (onSelectionChange) {
        const selectedRows = Object.keys(newSelection)
          .filter((key) => newSelection[key])
          .map((key) => data[parseInt(key)]);
        onSelectionChange(selectedRows);
      }
    },
    getCoreRowModel: getCoreRowModel(),
    getRowId: getRowId ? (row) => getRowId(row) : undefined,
    manualPagination: true,
    pageCount: totalPages,
  });

  return (
    <div className="space-y-2">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    style={{ width: header.getSize() !== 150 ? header.getSize() : undefined }}
                    className="bg-muted/50 text-center text-xs font-semibold"
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={allColumns.length} className="h-32">
                  <LoadingSpinner />
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={allColumns.length}
                  className="h-32 text-center text-muted-foreground"
                >
                  데이터가 없습니다.
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && 'selected'}
                  className={onRowClick ? 'cursor-pointer hover:bg-muted/50' : ''}
                  onClick={() => onRowClick?.(row.original)}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="text-sm py-2">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {onPageChange && onPageSizeChange && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          pageSize={pageSize}
          totalItems={totalItems}
          onPageChange={onPageChange}
          onPageSizeChange={onPageSizeChange}
        />
      )}
    </div>
  );
}
