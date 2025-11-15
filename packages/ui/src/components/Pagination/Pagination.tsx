import * as React from "react"
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react"
// 假设这是您已有的按钮组件的基础样式
const buttonBaseStyles = "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background"

const buttonVariants = {
    default: "bg-primary text-primary-foreground hover:bg-primary/90",
    destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
    outline: "border border-input hover:bg-accent hover:text-accent-foreground",
    secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
    ghost: "hover:bg-accent hover:text-accent-foreground",
    link: "underline-offset-4 hover:underline text-primary",
}

const buttonSizes = {
    default: "h-10 py-2 px-4",
    sm: "h-9 px-3 rounded-md",
    lg: "h-11 px-8 rounded-md",
    icon: "h-10 w-10",
}

// 分页容器
const Pagination = ({ className, ...props }: React.ComponentProps<"nav">) => (
    <nav
        role="navigation"
        aria-label="分页"
        className={ cn("mx-auto flex w-full justify-center", className) }
        { ...props }
    />
)

// 分页内容容器
const PaginationContent = React.forwardRef<
    HTMLUListElement,
    React.ComponentProps<"ul">
>(({ className, ...props }, ref) => (
    <ul
        ref={ ref }
        className={ cn("flex flex-row items-center gap-1", className) }
        { ...props }
    />
))
PaginationContent.displayName = "PaginationContent"

// 分页项
const PaginationItem = React.forwardRef<
    HTMLLIElement,
    React.ComponentProps<"li">
>(({ className, ...props }, ref) => (
    <li ref={ ref } className={ cn("", className) } { ...props } />
))
PaginationItem.displayName = "PaginationItem"

// 分页链接类型
interface PaginationLinkProps extends React.ComponentProps<"button"> {
    isActive?: boolean
    size?: keyof typeof buttonSizes
}

// 分页链接
const PaginationLink = ({
    className,
    isActive,
    size = "icon",
    ...props
}: PaginationLinkProps) => (
    <button
        className={ cn(
            buttonBaseStyles,
            buttonVariants[isActive ? "outline" : "ghost"],
            buttonSizes[size],
            className
        ) }
        { ...props }
    />
)
PaginationLink.displayName = "PaginationLink"

// 上一页按钮
const PaginationPrevious = ({
    className,
    ...props
}: React.ComponentProps<typeof PaginationLink>) => (
    <PaginationLink
        aria-label="前往上一页"
        size="default"
        className={ cn("gap-1 pl-2.5", className) }
        { ...props }
    >
        <ChevronLeft className="h-4 w-4" />
        <span>上一页</span>
    </PaginationLink>
)
PaginationPrevious.displayName = "PaginationPrevious"

// 下一页按钮
const PaginationNext = ({
    className,
    ...props
}: React.ComponentProps<typeof PaginationLink>) => (
    <PaginationLink
        aria-label="前往下一页"
        size="default"
        className={ cn("gap-1 pr-2.5", className) }
        { ...props }
    >
        <span>下一页</span>
        <ChevronRight className="h-4 w-4" />
    </PaginationLink>
)
PaginationNext.displayName = "PaginationNext"

// 省略号
const PaginationEllipsis = ({
    className,
    ...props
}: React.ComponentProps<"span">) => (
    <span
        aria-hidden
        className={ cn("flex h-9 w-9 items-center justify-center", className) }
        { ...props }
    >
        <MoreHorizontal className="h-4 w-4" />
        <span className="sr-only">更多页面</span>
    </span>
)
PaginationEllipsis.displayName = "PaginationEllipsis"

// 完整的分页组件使用示例
interface CustomPaginationProps {
    currentPage: number
    totalPages: number
    onPageChange: (page: number) => void
    className?: string
}

const CustomPagination: React.FC<CustomPaginationProps> = ({
    currentPage,
    totalPages,
    onPageChange,
    className,
}) => {
    const getVisiblePages = () => {
        const delta = 2 // 当前页前后显示的页数
        const range = []
        const rangeWithDots = []

        for (
            let i = Math.max(2, currentPage - delta);
            i <= Math.min(totalPages - 1, currentPage + delta);
            i++
        ) {
            range.push(i)
        }

        if (currentPage - delta > 2) {
            rangeWithDots.push(1, '...')
        } else {
            rangeWithDots.push(1)
        }

        rangeWithDots.push(...range)

        if (currentPage + delta < totalPages - 1) {
            rangeWithDots.push('...', totalPages)
        } else {
            rangeWithDots.push(totalPages)
        }

        return rangeWithDots
    }

    const visiblePages = getVisiblePages()

    return (
        <Pagination className={ className }>
            <PaginationContent>
                <PaginationItem>
                    <PaginationPrevious
                        onClick={ () => onPageChange(Math.max(1, currentPage - 1)) }
                        disabled={ currentPage === 1 }
                    />
                </PaginationItem>

                { visiblePages.map((page, index) => (
                    <PaginationItem key={ index }>
                        { page === '...' ? (
                            <PaginationEllipsis />
                        ) : (
                            <PaginationLink
                                isActive={ currentPage === page }
                                onClick={ () => onPageChange(page as number) }
                            >
                                { page }
                            </PaginationLink>
                        ) }
                    </PaginationItem>
                )) }

                <PaginationItem>
                    <PaginationNext
                        onClick={ () => onPageChange(Math.min(totalPages, currentPage + 1)) }
                        disabled={ currentPage === totalPages }
                    />
                </PaginationItem>
            </PaginationContent>
        </Pagination>
    )
}

// 工具函数（如果还没有的话）
function cn(...classes: (string | undefined | null | false)[]) {
    return classes.filter(Boolean).join(' ')
}

export {
    Pagination,
    PaginationContent,
    PaginationLink,
    PaginationItem,
    PaginationPrevious,
    PaginationNext,
    PaginationEllipsis,
    CustomPagination,
}