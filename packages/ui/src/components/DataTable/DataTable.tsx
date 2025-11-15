import * as React from "react"
import { cn } from "@/utils/utils"
import {
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/Table/Table"
import { CustomPagination } from "@/components/Pagination/Pagination"

// 列定义接口
export interface Column<T = any> {
  key: string
  title: string
  dataIndex?: string
  render?: (value: any, record: T, index: number) => React.ReactNode
  width?: string | number
  align?: "left" | "center" | "right"
  className?: string
}

// 数据表格属性接口
export interface DataTableProps<T = any> {
  // 数据相关
  dataSource: T[]
  columns: Column<T>[]

  // 分页相关
  pagination?: {
    current: number
    pageSize: number
    total: number
    onChange: (page: number, pageSize: number) => void
    showSizeChanger?: boolean
    pageSizeOptions?: number[]
    showTotal?: boolean
    simple?: boolean
  }

  // 样式相关
  className?: string
  tableClassName?: string
  paginationClassName?: string

  // 其他
  loading?: boolean
  emptyText?: React.ReactNode
  rowKey?: string | ((record: T) => string)
  onRow?: (record: T, index: number) => React.HTMLAttributes<HTMLTableRowElement>
  scroll?: { x?: number | string; y?: number | string }
}

// 获取行键值
const getRowKey = <T,>(record: T, index: number, rowKey?: string | ((record: T) => string)): string => {
  if (typeof rowKey === "function") {
    return rowKey(record)
  }
  if (typeof rowKey === "string" && record[rowKey as keyof T]) {
    return String(record[rowKey as keyof T])
  }
  return `row-${index}`
}

// 获取单元格对齐方式
const getAlignClass = (align?: "left" | "center" | "right") => {
  switch (align) {
    case "center":
      return "text-center"
    case "right":
      return "text-right"
    default:
      return "text-left"
  }
}

// 数据表格组件
export function DataTable<T extends Record<string, any>>({
  dataSource,
  columns,
  pagination,
  className,
  tableClassName,
  paginationClassName,
  loading = false,
  emptyText = "暂无数据",
  rowKey,
  onRow,
  scroll,
}: DataTableProps<T>) {
  // 计算当前页的数据
  const paginatedData = pagination
    ? dataSource.slice(
        (pagination.current - 1) * pagination.pageSize,
        pagination.current * pagination.pageSize
      )
    : dataSource

  // 渲染表格内容
  const renderTable = () => {
    if (loading) {
      return (
        <TableBody>
          <TableRow>
            <TableCell colSpan={columns.length} className="h-24 text-center">
              加载中...
            </TableCell>
          </TableRow>
        </TableBody>
      )
    }

    if (paginatedData.length === 0) {
      return (
        <TableBody>
          <TableRow>
            <TableCell colSpan={columns.length} className="h-24 text-center">
              {emptyText}
            </TableCell>
          </TableRow>
        </TableBody>
      )
    }

    return (
      <TableBody>
        {paginatedData.map((record, index) => {
          const key = getRowKey(record, index, rowKey)
          const rowProps = onRow ? onRow(record, index) : {}

          return (
            <TableRow key={key} {...rowProps}>
              {columns.map((column) => {
                const value = column.dataIndex ? record[column.dataIndex] : record
                const content = column.render
                  ? column.render(value, record, index)
                  : value

                return (
                  <TableCell
                    key={column.key}
                    className={cn(
                      getAlignClass(column.align),
                      column.className
                    )}
                    style={{ width: column.width }}
                  >
                    {content}
                  </TableCell>
                )
              })}
            </TableRow>
          )
        })}
      </TableBody>
    )
  }

  return (
    <div className={cn("w-full", className)}>
      <div 
        className={cn(
          "relative overflow-auto rounded-lg border border-gray-200",
          tableClassName
        )}
        style={scroll ? { overflowX: scroll.x ? "auto" : undefined, overflowY: scroll.y ? "auto" : undefined, maxWidth: scroll.x, maxHeight: scroll.y } : undefined}
      >
        <table className="w-full caption-bottom text-sm border-collapse">
          {columns.length > 0 && (
            <TableHeader>
              <TableRow>
                {columns.map((column) => (
                  <TableHead
                    key={column.key}
                    className={cn(
                      getAlignClass(column.align),
                      column.className
                    )}
                    style={{ width: column.width }}
                  >
                    {column.title}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
          )}
          {renderTable()}
        </table>
      </div>

      {pagination && (
        <div className={cn("mt-4 flex justify-end", paginationClassName)}>
          <CustomPagination
            currentPage={pagination.current}
            totalPages={Math.ceil(pagination.total / pagination.pageSize)}
            onPageChange={(page) => pagination.onChange(page, pagination.pageSize)}
          />
        </div>
      )}
    </div>
  )
}

// 默认导出
export default DataTable
