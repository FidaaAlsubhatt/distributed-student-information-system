import React, { ReactNode } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Column {
  key: string;
  header: string;
  cell?: (item: any) => ReactNode;
}

interface TableListProps {
  columns: Column[];
  data: any[];
  showSearch?: boolean;
  searchPlaceholder?: string;
  showFilter?: boolean;
  filterOptions?: {
    value: string;
    label: string;
  }[];
  filterPlaceholder?: string;
  onFilterChange?: (value: string) => void;
  onSearchChange?: (value: string) => void;
  pagination?: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
    onPageChange: (page: number) => void;
  };
}

const TableList: React.FC<TableListProps> = ({
  columns,
  data,
  showSearch = false,
  searchPlaceholder = 'Search...',
  showFilter = false,
  filterOptions = [],
  filterPlaceholder = 'Filter',
  onFilterChange,
  onSearchChange,
  pagination,
}) => {
  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      {(showSearch || showFilter) && (
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
          <div className="flex space-x-2">
            {showSearch && (
              <div className="relative">
                <Input
                  type="text"
                  placeholder={searchPlaceholder}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm"
                  onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
                />
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </span>
              </div>
            )}
            {showFilter && (
              <Select onValueChange={(value) => onFilterChange && onFilterChange(value)}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder={filterPlaceholder} />
                </SelectTrigger>
                <SelectContent>
                  {filterOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </div>
      )}
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((column) => (
                <TableHead key={column.key} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {column.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length > 0 ? (
              data.map((item, index) => (
                <TableRow key={index} className="bg-white divide-y divide-gray-200">
                  {columns.map((column) => (
                    <TableCell key={`${index}-${column.key}`} className="px-6 py-4 whitespace-nowrap text-sm">
                      {column.cell ? column.cell(item) : item[column.key]}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="text-center py-4 text-gray-500">
                  No data to display
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      {pagination && (
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-700">
              Showing <span className="font-medium">{Math.min(pagination.currentPage * pagination.itemsPerPage, pagination.totalItems)}</span> of{' '}
              <span className="font-medium">{pagination.totalItems}</span> items
            </p>
            <div className="flex space-x-1">
              <button
                disabled={pagination.currentPage === 1}
                onClick={() => pagination.onPageChange(pagination.currentPage - 1)}
                className={`px-3 py-1 rounded-md text-sm ${
                  pagination.currentPage === 1
                    ? 'bg-gray-200 text-gray-400'
                    : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                Previous
              </button>
              {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => pagination.onPageChange(page)}
                  className={`px-3 py-1 rounded-md text-sm ${
                    pagination.currentPage === page
                      ? 'bg-primary text-white'
                      : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {page}
                </button>
              ))}
              <button
                disabled={pagination.currentPage === pagination.totalPages}
                onClick={() => pagination.onPageChange(pagination.currentPage + 1)}
                className={`px-3 py-1 rounded-md text-sm ${
                  pagination.currentPage === pagination.totalPages
                    ? 'bg-gray-200 text-gray-400'
                    : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TableList;
