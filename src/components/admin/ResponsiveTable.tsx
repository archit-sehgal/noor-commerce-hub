import { ReactNode } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";

interface Column<T> {
  key: string;
  label: string;
  hideOnMobile?: boolean;
  hideOnTablet?: boolean;
  className?: string;
  render?: (item: T) => ReactNode;
}

interface ResponsiveTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (item: T) => string;
  onRowClick?: (item: T) => void;
  emptyMessage?: string;
  emptyIcon?: ReactNode;
  mobileCard?: (item: T) => ReactNode;
}

export function ResponsiveTable<T extends Record<string, any>>({
  columns,
  data,
  keyExtractor,
  onRowClick,
  emptyMessage = "No data found",
  emptyIcon,
  mobileCard,
}: ResponsiveTableProps<T>) {
  if (data.length === 0) {
    return (
      <div className="text-center py-12 space-y-4">
        {emptyIcon && (
          <div className="w-16 h-16 mx-auto bg-muted rounded-full flex items-center justify-center">
            {emptyIcon}
          </div>
        )}
        <p className="text-muted-foreground">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <>
      {/* Mobile Card View */}
      {mobileCard && (
        <div className="md:hidden space-y-3">
          {data.map((item) => (
            <div
              key={keyExtractor(item)}
              className={cn(
                "bg-card border border-border rounded-lg p-4 shadow-sm",
                onRowClick && "cursor-pointer hover:shadow-md transition-shadow"
              )}
              onClick={() => onRowClick?.(item)}
            >
              {mobileCard(item)}
            </div>
          ))}
        </div>
      )}

      {/* Desktop Table View */}
      <div className={cn("border rounded-lg overflow-hidden", mobileCard ? "hidden md:block" : "block")}>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                {columns.map((col) => (
                  <TableHead
                    key={col.key}
                    className={cn(
                      col.className,
                      col.hideOnMobile && "hidden sm:table-cell",
                      col.hideOnTablet && "hidden lg:table-cell"
                    )}
                  >
                    {col.label}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((item) => (
                <TableRow
                  key={keyExtractor(item)}
                  className={cn(onRowClick && "cursor-pointer hover:bg-muted/50")}
                  onClick={() => onRowClick?.(item)}
                >
                  {columns.map((col) => (
                    <TableCell
                      key={col.key}
                      className={cn(
                        col.className,
                        col.hideOnMobile && "hidden sm:table-cell",
                        col.hideOnTablet && "hidden lg:table-cell"
                      )}
                    >
                      {col.render ? col.render(item) : item[col.key]}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </>
  );
}

export default ResponsiveTable;
