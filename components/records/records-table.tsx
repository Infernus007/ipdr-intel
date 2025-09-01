'use client';

import { useMemo, useState, useCallback, useEffect } from "react";
import {
  ColumnDef,
  ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFacetedMinMaxValues,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
} from "@tanstack/react-table";
import {
  ChevronDownIcon,
  ChevronUpIcon,
  SearchIcon,
  ExternalLinkIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  SkipBackIcon,
  SkipForwardIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { IPDRRecord, TelecomOperator } from "@/lib/types";
import { formatTimestamp, formatBytes, getOperatorColor } from "@/utils/formatters";
import { useWalkthroughTarget } from '@/components/walkthrough/walkthrough-provider';
import { useAppStore } from '@/lib/store';
import { Button } from '@/components/ui/button';

interface RecordsTableProps {
  records: IPDRRecord[];
  onSelectionChange?: (selectedRecords: IPDRRecord[]) => void;
}

const columns: ColumnDef<IPDRRecord>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
  },
  {
    header: "Source IP",
    accessorKey: "aParty",
    cell: ({ row }) => (
      <div className="font-mono text-sm">{row.getValue("aParty")}</div>
    ),
    meta: {
      filterVariant: "text",
    },
  },
  {
    header: "Destination IP",
    accessorKey: "bParty",
    cell: ({ row }) => (
      <div className="font-mono text-sm">{row.getValue("bParty")}</div>
    ),
    meta: {
      filterVariant: "text",
    },
  },
  {
    header: "Protocol",
    accessorKey: "protocol",
    cell: ({ row }) => {
      const protocol = row.getValue("protocol") as string;
      const colorMap: Record<string, string> = {
        TCP: "bg-blue-100 text-blue-800",
        UDP: "bg-green-100 text-green-800",
        HTTP: "bg-purple-100 text-purple-800",
        HTTPS: "bg-indigo-100 text-indigo-800",
      };
      return (
        <span className={cn("px-2 py-1 rounded-full text-xs font-medium", colorMap[protocol] || "bg-gray-100 text-gray-800")}>
          {protocol}
        </span>
      );
    },
    meta: {
      filterVariant: "select",
    },
  },
  {
    header: "Start Time",
    accessorKey: "startTimestamp",
    cell: ({ row }) => (
      <div className="text-sm">{formatTimestamp(row.getValue("startTimestamp"))}</div>
    ),
  },
  {
    header: "Duration",
    accessorKey: "duration",
    cell: ({ row }) => {
      const duration = row.getValue("duration") as number;
      return <div className="text-sm">{duration}s</div>;
    },
    meta: {
      filterVariant: "range",
    },
  },
  {
    header: "Bytes",
    accessorKey: "bytesTransferred",
    cell: ({ row }) => {
      const bytes = row.getValue("bytesTransferred") as number;
      return <div className="text-sm">{formatBytes(bytes)}</div>;
    },
    meta: {
      filterVariant: "range",
    },
  },
  {
    header: "Operator",
    accessorKey: "operator",
    cell: ({ row }) => {
      const operator = row.getValue("operator") as TelecomOperator;
      const color = getOperatorColor(operator);
      return (
        <div 
          className="px-2 py-1 rounded-full text-xs font-medium text-white"
          style={{ backgroundColor: color }}
        >
          {operator.toUpperCase()}
        </div>
      );
    },
    meta: {
      filterVariant: "select",
    },
  },
  {
    header: "Ports",
    accessorKey: "ports",
    cell: ({ row }) => {
      const aPort = row.original.aPort;
      const bPort = row.original.bPort;
      return (
        <div className="text-sm font-mono">
          {aPort && bPort ? `${aPort} → ${bPort}` : aPort || bPort || '-'}
        </div>
      );
    },
    enableSorting: false,
  },
  {
    header: "Location A",
    accessorKey: "aPartyLocation",
    cell: ({ row }) => {
      const record = row.original;
      const location = record.aPartyLocation;
      
      if (!location) {
        return (
          <div className="text-sm text-gray-400">
            <div>No location data</div>
            <div className="text-xs">IP: {record.aParty}</div>
          </div>
        );
      }
      
      return (
        <div className="text-sm">
          <div className="font-medium text-blue-600">{location.city}</div>
          <div className="text-gray-500 text-xs">{location.region}, {location.country}</div>
        </div>
      );
    },
    enableSorting: false,
  },
  {
    header: "Location B",
    accessorKey: "bPartyLocation",
    cell: ({ row }) => {
      const record = row.original;
      const location = record.bPartyLocation;
      
      if (!location) {
        return (
          <div className="text-sm text-gray-400">
            <div>No location data</div>
            <div className="text-xs">IP: {record.bParty}</div>
          </div>
        );
      }
      
      return (
        <div className="text-sm">
          <div className="font-medium text-green-600">{location.city}</div>
          <div className="text-gray-500 text-xs">{location.region}, {location.country}</div>
        </div>
      );
    },
    enableSorting: false,
  },
  {
    header: "Connection Map",
    accessorKey: "connectionMap",
    cell: ({ row }) => {
      const record = row.original;
      
      // Calculate connection strength based on actual duration and bytes
      const durationMinutes = Math.round(record.duration / 60);
      const bytesMB = Math.round(record.bytesTransferred / 1024 / 1024);
      
      // Simple connection strength indicator based on duration
      let strengthLabel = 'Low';
      let strengthColor = 'bg-blue-100 text-blue-800';
      
      if (record.duration > 300) { // > 5 minutes
        strengthLabel = 'High';
        strengthColor = 'bg-red-100 text-red-800';
      } else if (record.duration > 60) { // > 1 minute
        strengthLabel = 'Medium';
        strengthColor = 'bg-orange-100 text-orange-800';
      }
      
      return (
        <div className="text-sm">
          <div className="flex items-center space-x-2">
            <div className={`px-2 py-1 rounded-full text-xs font-medium ${strengthColor}`}>
              {strengthLabel}
            </div>
            <div className="text-gray-500 text-xs">
              {durationMinutes}m
            </div>
          </div>
          <div className="text-xs text-gray-400 mt-1">
            {bytesMB} MB
          </div>
        </div>
      );
    },
    enableSorting: false,
  },
];

export function RecordsTable({ records, onSelectionChange }: RecordsTableProps) {
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [sorting, setSorting] = useState<SortingState>([
    { id: "startTimestamp", desc: true }
  ]);
  const [rowSelection, setRowSelection] = useState({});
  const walkthroughTarget = useWalkthroughTarget('records-table');
  
  // Enhanced store integration for large datasets
  const { 
    pagination, 
    setPage, 
    setPageSize, 
    getRecordsForPage, 
    getFilteredRecords,
    optimizeMemory 
  } = useAppStore();
  
  // Virtualization state
  const [virtualizedRecords, setVirtualizedRecords] = useState<IPDRRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Enhanced table with virtualization for large datasets
  const table = useReactTable({
    data: virtualizedRecords.length > 0 ? virtualizedRecords : records,
    columns,
    state: {
      sorting,
      columnFilters,
      rowSelection,
    },
    onColumnFiltersChange: setColumnFilters,
    onSortingChange: setSorting,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    getFacetedMinMaxValues: getFacetedMinMaxValues(),
    enableSortingRemoval: false,
    // Let the store handle pagination instead of manual pagination
  });

  // Enhanced virtualization and pagination logic
  const loadPageData = useCallback(async (page: number, pageSize: number) => {
    if (records.length > 10000) { // Only virtualize for very large datasets
      setIsLoading(true);
      try {
        // Simulate async loading for large datasets
        await new Promise(resolve => setTimeout(resolve, 50));
        const pageRecords = getRecordsForPage(page, pageSize);
        setVirtualizedRecords(pageRecords);
        
        // Optimize memory periodically
        if (page % 5 === 0) {
          optimizeMemory();
        }
      } finally {
        setIsLoading(false);
      }
    } else {
      // For smaller datasets, show all records but respect pagination
      const startIndex = (page - 1) * pageSize;
      const endIndex = startIndex + pageSize;
      setVirtualizedRecords(records.slice(startIndex, endIndex));
    }
  }, [records, getRecordsForPage, optimizeMemory]);

  // Load data when page or page size changes
  useEffect(() => {
    loadPageData(pagination.currentPage, pagination.pageSize);
  }, [pagination.currentPage, pagination.pageSize, loadPageData]);

  // Load data when records change
  useEffect(() => {
    if (records.length > 0) {
      loadPageData(1, pagination.pageSize);
    }
  }, [records, pagination.pageSize, loadPageData]);

  // Notify parent of selection changes
  useEffect(() => {
    const selectedRows = table.getFilteredSelectedRowModel().rows;
    const selectedRecords = selectedRows.map(row => row.original);
    onSelectionChange?.(selectedRecords);
  }, [rowSelection, table, onSelectionChange]);

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="w-48">
          <Filter column={table.getColumn("aParty")!} placeholder="Source IP" />
        </div>
        <div className="w-48">
          <Filter column={table.getColumn("bParty")!} placeholder="Destination IP" />
        </div>
        <div className="w-32">
          <Filter column={table.getColumn("protocol")!} />
        </div>
        <div className="w-32">
          <Filter column={table.getColumn("operator")!} />
        </div>
        <div className="w-36">
          <Filter column={table.getColumn("duration")!} />
        </div>
        <div className="w-36">
          <Filter column={table.getColumn("bytesTransferred")!} />
        </div>
      </div>

      {/* Mapping Statistics */}
      {records.length > 0 && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border">
          <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Connection Mapping Overview
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {new Set(records.map(r => r.aParty)).size}
              </div>
              <div className="text-gray-600">Unique Source IPs</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {new Set(records.map(r => r.bParty)).size}
              </div>
              <div className="text-gray-600">Unique Destination IPs</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {new Set(records.map(r => `${r.aParty}-${r.bParty}`)).size}
              </div>
              <div className="text-gray-600">Unique Connections</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {new Set(records.map(r => r.operator)).size}
              </div>
              <div className="text-gray-600">Telecom Operators</div>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-gray-200">
            <div className="text-xs text-gray-600">
              <strong>Data Coverage:</strong> {records.length.toLocaleString()} records from {new Set(records.map(r => r.operator)).size} telecom operators
              {records.some(r => r.aPartyLocation || r.bPartyLocation) && (
                <span> • Location data available for some records</span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Stats and Performance Indicators */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <div className="flex items-center gap-4">
          <div>
            {table.getFilteredRowModel().rows.length} of {records.length.toLocaleString()} records
            {table.getFilteredSelectedRowModel().rows.length > 0 && 
              ` (${table.getFilteredSelectedRowModel().rows.length} selected)`
            }
          </div>
          {records.length > 10000 && (
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
              <span>Virtualized for performance</span>
            </div>
          )}
          {isLoading && (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              <span>Loading...</span>
            </div>
          )}
        </div>
        
        {/* Page Size Selector */}
        <div className="flex items-center gap-2">
          <span className="text-xs">Page size:</span>
          <Select
            value={pagination.pageSize.toString()}
            onValueChange={(value) => {
              const newSize = parseInt(value);
              setPageSize(newSize);
              // Reset to first page when changing page size
              setPage(1);
            }}
          >
            <SelectTrigger className="h-8 w-20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
              <SelectItem value="250">250</SelectItem>
              <SelectItem value="500">500</SelectItem>
              <SelectItem value="1000">1000</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-md border bg-white">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="bg-muted/50">
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className="relative h-12 select-none"
                    aria-sort={
                      header.column.getIsSorted() === "asc"
                        ? "ascending"
                        : header.column.getIsSorted() === "desc"
                          ? "descending"
                          : "none"
                    }
                  >
                    {header.isPlaceholder ? null : header.column.getCanSort() ? (
                      <div
                        className="flex h-full cursor-pointer items-center justify-between gap-2"
                        onClick={header.column.getToggleSortingHandler()}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            header.column.getToggleSortingHandler()?.(e);
                          }
                        }}
                        tabIndex={0}
                      >
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {{
                          asc: <ChevronUpIcon className="shrink-0 opacity-60" size={16} />,
                          desc: <ChevronDownIcon className="shrink-0 opacity-60" size={16} />,
                        }[header.column.getIsSorted() as string] ?? (
                          <span className="size-4" />
                        )}
                      </div>
                    ) : (
                      flexRender(header.column.columnDef.header, header.getContext())
                    )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className="hover:bg-muted/50"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="py-3">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  No records found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      
      {/* Enhanced Pagination Controls */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between px-2 py-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>
              Page {pagination.currentPage} of {pagination.totalPages}
            </span>
            <span>•</span>
            <span>
              {((pagination.currentPage - 1) * pagination.pageSize + 1).toLocaleString()} - {Math.min(pagination.currentPage * pagination.pageSize, pagination.totalRecords).toLocaleString()} of {pagination.totalRecords.toLocaleString()}
            </span>
          </div>
          
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(1)}
              disabled={pagination.currentPage === 1}
            >
              <SkipBackIcon className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(pagination.currentPage - 1)}
              disabled={pagination.currentPage === 1}
            >
              <ChevronLeftIcon className="h-4 w-4" />
            </Button>
            
            {/* Page Numbers */}
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                let pageNum;
                if (pagination.totalPages <= 5) {
                  pageNum = i + 1;
                } else if (pagination.currentPage <= 3) {
                  pageNum = i + 1;
                } else if (pagination.currentPage >= pagination.totalPages - 2) {
                  pageNum = pagination.totalPages - 4 + i;
                } else {
                  pageNum = pagination.currentPage - 2 + i;
                }
                
                return (
                  <Button
                    key={pageNum}
                    variant={pagination.currentPage === pageNum ? "default" : "outline"}
                    size="sm"
                    className="w-8 h-8"
                    onClick={() => setPage(pageNum)}
                  >
                    {pageNum}
                  </Button>
                );
              })}
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(pagination.currentPage + 1)}
              disabled={pagination.currentPage === pagination.totalPages}
            >
              <ChevronRightIcon className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(pagination.totalPages)}
              disabled={pagination.currentPage === pagination.totalPages}
            >
              <SkipForwardIcon className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function Filter({ column, placeholder }: { column: any; placeholder?: string }) {
  const columnFilterValue = column.getFilterValue();
  const { filterVariant } = column.columnDef.meta ?? {};
  const columnHeader = typeof column.columnDef.header === "string" ? column.columnDef.header : "";

  const sortedUniqueValues = useMemo(() => {
    if (filterVariant === "range") return [];
    return Array.from(column.getFacetedUniqueValues().keys()).sort();
  }, [column.getFacetedUniqueValues(), filterVariant]);

  if (filterVariant === "range") {
    return (
      <div className="space-y-2">
        <Label className="text-xs font-medium">{columnHeader}</Label>
        <div className="flex">
          <Input
            className="flex-1 rounded-e-none h-8 text-xs"
            value={(columnFilterValue as [number, number])?.[0] ?? ""}
            onChange={(e) =>
              column.setFilterValue((old: [number, number]) => [
                e.target.value ? Number(e.target.value) : undefined,
                old?.[1],
              ])
            }
            placeholder="Min"
            type="number"
          />
          <Input
            className="-ms-px flex-1 rounded-s-none h-8 text-xs"
            value={(columnFilterValue as [number, number])?.[1] ?? ""}
            onChange={(e) =>
              column.setFilterValue((old: [number, number]) => [
                old?.[0],
                e.target.value ? Number(e.target.value) : undefined,
              ])
            }
            placeholder="Max"
            type="number"
          />
        </div>
      </div>
    );
  }

  if (filterVariant === "select") {
    return (
      <div className="space-y-2">
        <Label className="text-xs font-medium">{columnHeader}</Label>
        <Select
          value={columnFilterValue?.toString() ?? "all"}
          onValueChange={(value) => {
            column.setFilterValue(value === "all" ? undefined : value);
          }}
        >
          <SelectTrigger className="h-8">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            {sortedUniqueValues.map((value) => (
              <SelectItem key={String(value)} value={String(value)}>
                {String(value)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Label className="text-xs font-medium">{columnHeader}</Label>
      <div className="relative">
        <Input
          className="pl-8 h-8 text-xs"
          value={(columnFilterValue ?? "") as string}
          onChange={(e) => column.setFilterValue(e.target.value)}
          placeholder={placeholder || `Search ${columnHeader.toLowerCase()}`}
          type="text"
        />
        <SearchIcon className="absolute left-2.5 top-2 h-3 w-3 text-muted-foreground" />
      </div>
    </div>
  );
}
