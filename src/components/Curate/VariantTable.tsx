import { useState } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
  type SortingState,
  type ColumnFiltersState,
  type VisibilityState,
  type ColumnDef,
} from '@tanstack/react-table';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Search,
  SlidersHorizontal,
  Pencil,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface VariantTableProps {
  data: any[];
  selectedVariants: Set<string>;
  onToggleVariant: (id: string) => void;
  onEdit: (variant: any) => void;
  getClinicalSigColor: (sig: string) => string;
}

export function VariantTable({
  data,
  selectedVariants,
  onToggleVariant,
  onEdit,
  getClinicalSigColor,
}: VariantTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});

  const columns: ColumnDef<any>[] = [
    {
      id: 'select',
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected()}
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={selectedVariants.has(row.original.id)}
          onCheckedChange={() => onToggleVariant(row.original.id)}
          aria-label="Select row"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: 'id',
      header: 'Variant ID',
      cell: ({ row }) => (
        <span className="font-mono text-sm text-slate-700">{row.getValue('id')}</span>
      ),
    },
    {
      accessorKey: 'position',
      header: ({ column }) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="h-8 -ml-3 font-bold text-slate-600"
        >
          Position
          {column.getIsSorted() === 'asc' ? <ArrowUp className="ml-1 h-3 w-3" /> :
           column.getIsSorted() === 'desc' ? <ArrowDown className="ml-1 h-3 w-3" /> :
           <ArrowUpDown className="ml-1 h-3 w-3" />}
        </Button>
      ),
      cell: ({ row }) => (
        <span className="text-sm text-slate-600 font-medium">
          {(row.getValue('position') as number).toLocaleString()}
        </span>
      ),
    },
    {
      accessorKey: 'change',
      header: 'Change',
      cell: ({ row }) => (
        <span className="text-sm">
          <span className="font-mono text-slate-700">{row.original.ref}</span>
          <span className="text-slate-400 mx-1">→</span>
          <span className="font-mono text-slate-700">{row.original.alt}</span>
        </span>
      ),
    },
    {
      accessorKey: 'clinical_significance',
      header: 'Clinical Significance',
      cell: ({ row }) => {
        const sig = row.getValue('clinical_significance') as string;
        if (!sig) return null;
        return (
          <Badge
            variant="outline"
            className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold shadow-sm ${getClinicalSigColor(sig)}`}
          >
            <span className="w-1.5 h-1.5 rounded-full mr-1.5 bg-current opacity-60"></span>
            {sig}
          </Badge>
        );
      },
      filterFn: (row, id, value) => {
        return value === 'all' || row.getValue(id) === value;
      },
    },
    {
      accessorKey: 'hgvs',
      header: 'HGVS',
      cell: ({ row }) => (
        <span className="text-sm text-slate-500 font-mono">{row.getValue('hgvs') || '-'}</span>
      ),
    },
    {
      accessorKey: 'consequence',
      header: 'Consequence',
      cell: ({ row }) => (
        <span className="text-sm text-slate-600">{row.getValue('consequence') || '-'}</span>
      ),
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(row.original)}
            className="h-8 w-8 p-0 text-slate-400 hover:text-teal-600 hover:bg-teal-50"
          >
            <Pencil className="h-4 w-4" />
          </Button>
        </div>
      ),
      enableSorting: false,
      enableHiding: false,
    },
  ];

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    onColumnVisibilityChange: setColumnVisibility,
    state: {
      sorting,
      columnFilters,
      globalFilter,
      columnVisibility,
    },
    initialState: {
      pagination: {
        pageSize: 25,
      },
    },
  });

  const clinicalSigs = ['Pathogenic', 'Likely Pathogenic', 'VUS', 'Likely Benign', 'Benign'];

  return (
    <div className="space-y-4 px-6">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search variants..."
              value={globalFilter}
              onChange={(e) => setGlobalFilter(e.target.value)}
              className="pl-9 h-9 bg-white"
            />
          </div>
          <Select
            value={(table.getColumn('clinical_significance')?.getFilterValue() as string) ?? 'all'}
            onValueChange={(value) =>
              table.getColumn('clinical_significance')?.setFilterValue(value === 'all' ? undefined : value)
            }
          >
            <SelectTrigger className="w-[180px] h-9 bg-white">
              <SelectValue placeholder="All Significance" />
            </SelectTrigger>
            <SelectContent className="bg-white">
              <SelectItem value="all">All Significance</SelectItem>
              {clinicalSigs.map((sig) => (
                <SelectItem key={sig} value={sig}>
                  {sig}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-9">
                <SlidersHorizontal className="mr-2 h-4 w-4" />
                Columns
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {table
                .getAllColumns()
                .filter((column) => column.getCanHide())
                .map((column) => (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    className="capitalize"
                    checked={column.getIsVisible()}
                    onCheckedChange={(value) => column.toggleVisibility(!!value)}
                  >
                    {column.id.replace(/_/g, ' ')}
                  </DropdownMenuCheckboxItem>
                ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Table */}
      <div className="border border-slate-200 rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="bg-slate-50 border-b border-slate-200">
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} className="py-3 px-4 text-left font-semibold text-xs text-slate-600 uppercase tracking-wider bg-slate-50 border-b border-slate-200">
                    <div className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                    </div>
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row, index) => (
                <TableRow
                  key={row.id}
                  className={`group transition-colors border-b border-slate-100 ${
                    index % 2 === 0 ? 'bg-white' : 'bg-slate-50'
                  } hover:bg-teal-50`}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="py-3 px-4 sm:px-6">
                      <div className="text-sm">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </div>
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center text-slate-500">
                  No variants found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <span>
            {selectedVariants.size > 0 ? (
              <span className="font-medium text-teal-700">{selectedVariants.size} selected</span>
            ) : (
              <span>{table.getFilteredRowModel().rows.length} variants</span>
            )}
          </span>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <span>Page</span>
            <span className="font-medium text-slate-900">
              {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => table.setPageIndex(0)}
              disabled={!table.getCanPreviousPage()}
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => table.setPageIndex(table.getPageCount() - 1)}
              disabled={!table.getCanNextPage()}
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
          <Select
            value={table.getState().pagination.pageSize.toString()}
            onValueChange={(value) => table.setPageSize(Number(value))}
          >
            <SelectTrigger className="h-8 w-[100px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[10, 25, 50, 100].map((size) => (
                <SelectItem key={size} value={size.toString()}>
                  {size} / page
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
