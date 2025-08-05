import { forwardRef, memo } from "react";
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components_admin/ui/button";

// 공통 아이콘 스타일
const iconClass = "h-4 w-4";
const Pagination = memo(({ className, ...props }) => (
  <nav
    role="navigation"
    aria-label="pagination"
    className={cn("mx-auto flex w-full justify-center", className)}
    {...props}
  />
));

const PaginationContent = memo(forwardRef(({ className, ...props }, ref) => (
  <ul
    ref={ref}
    className={cn("flex flex-row items-center gap-1", className)}
    {...props}
  />
)));

const PaginationItem = memo(forwardRef(({ className, ...props }, ref) => (
  <li ref={ref} className={className} {...props} />
)));

const PaginationLink = memo(({ className, isActive, size = "icon", ...props }) => (
  <a
    aria-current={isActive ? "page" : undefined}
    className={cn(buttonVariants({
      variant: isActive ? "outline" : "ghost",
      size
    }), className)}
    {...props}
  />
));

const PaginationPrevious = memo(({ className, ...props }) => (
  <PaginationLink
    aria-label="Go to previous page"
    size="default"
    className={cn("gap-1 pl-2.5", className)}
    {...props}
  >
    <ChevronLeft className={iconClass} />
    <span>Previous</span>
  </PaginationLink>
));

const PaginationNext = memo(({ className, ...props }) => (
  <PaginationLink
    aria-label="Go to next page"
    size="default"
    className={cn("gap-1 pr-2.5", className)}
    {...props}
  >
    <span>Next</span>
    <ChevronRight className={iconClass} />
  </PaginationLink>
));

const PaginationEllipsis = memo(({ className, ...props }) => (
  <span
    aria-hidden="true"
    className={cn("flex h-9 w-9 items-center justify-center", className)}
    {...props}
  >
    <MoreHorizontal className={iconClass} />
    <span className="sr-only">More pages</span>
  </span>
));
export { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious };