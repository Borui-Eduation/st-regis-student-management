/**
 * Pagination Component
 * 分页导航组件
 */

import { Button } from '@/components/ui/button';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  totalItems: number;
  onPageChange: (page: number) => void;
}

export function Pagination({
  currentPage,
  totalPages,
  pageSize,
  totalItems,
  onPageChange,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  return (
    <div className="mt-6 flex items-center justify-between border-t border-gray-200 pt-4">
      <div className="text-sm text-gray-500">
        显示第 {startItem} 到 {endItem} 条，共 {totalItems} 条
      </div>
      <div className="flex gap-2">
        <Button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          variant="outline"
          size="sm"
        >
          上一页
        </Button>
        <div className="flex items-center gap-2">
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            let page;
            if (totalPages <= 5) {
              page = i + 1;
            } else if (currentPage <= 3) {
              page = i + 1;
            } else if (currentPage >= totalPages - 2) {
              page = totalPages - 4 + i;
            } else {
              page = currentPage - 2 + i;
            }
            return (
              <Button
                key={page}
                onClick={() => onPageChange(page)}
                variant={currentPage === page ? 'default' : 'outline'}
                size="sm"
                className="w-10"
              >
                {page}
              </Button>
            );
          })}
        </div>
        <Button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          variant="outline"
          size="sm"
        >
          下一页
        </Button>
      </div>
    </div>
  );
}



