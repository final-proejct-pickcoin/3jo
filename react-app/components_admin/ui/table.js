import { forwardRef } from "react";
import { cn } from "@/lib/utils";

// 스타일 상수
const tableStyles = {
  container: "relative w-full overflow-auto",
  table: "w-full caption-bottom text-sm",
  header: "[&_tr]:border-b",
  body: "[&_tr:last-child]:border-0",
  footer: "border-t bg-muted/50 font-medium [&>tr]:last:border-b-0",
  row: "border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted",
  head: "h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0",
  cell: "p-4 align-middle [&:has([role=checkbox])]:pr-0",
  caption: "mt-4 text-sm text-muted-foreground"
};

export const Table = forwardRef(({ className, ...props }, ref) => (
  <div className={tableStyles.container}>
    <table ref={ref} className={cn(tableStyles.table, className)} {...props} />
  </div>
));
Table.displayName = "Table";

export const TableHeader = forwardRef(({ className, ...props }, ref) => (
  <thead ref={ref} className={cn(tableStyles.header, className)} {...props} />
));
TableHeader.displayName = "TableHeader";

export const TableBody = forwardRef(({ className, ...props }, ref) => (
  <tbody ref={ref} className={cn(tableStyles.body, className)} {...props} />
));
TableBody.displayName = "TableBody";

export const TableFooter = forwardRef(({ className, ...props }, ref) => (
  <tfoot ref={ref} className={cn(tableStyles.footer, className)} {...props} />
));
TableFooter.displayName = "TableFooter";

export const TableRow = forwardRef(({ className, ...props }, ref) => (
  <tr ref={ref} className={cn(tableStyles.row, className)} {...props} />
));
TableRow.displayName = "TableRow";

export const TableHead = forwardRef(({ className, ...props }, ref) => (
  <th ref={ref} className={cn(tableStyles.head, className)} {...props} />
));
TableHead.displayName = "TableHead";

export const TableCell = forwardRef(({ className, ...props }, ref) => (
  <td ref={ref} className={cn(tableStyles.cell, className)} {...props} />
));
TableCell.displayName = "TableCell";

export const TableCaption = forwardRef(({ className, ...props }, ref) => (
  <caption ref={ref} className={cn(tableStyles.caption, className)} {...props} />
));
TableCaption.displayName = "TableCaption";