import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { History, Loader2, FileSpreadsheet, ChevronDown, ChevronUp } from "lucide-react";

interface ImportRecord {
  id: string;
  file_name: string;
  total_rows: number;
  products_created: number;
  products_updated: number;
  errors: number;
  error_details: { row: number; bcn: string; error: string }[];
  created_at: string;
}

interface ImportHistoryProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ImportHistory = ({ open, onOpenChange }: ImportHistoryProps) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { data: imports, isLoading } = useQuery({
    queryKey: ["product-imports"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("product_imports")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      return (data || []).map((record) => ({
        ...record,
        error_details: (record.error_details as { row: number; bcn: string; error: string }[]) || [],
      })) as ImportRecord[];
    },
    enabled: open,
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Import History
          </DialogTitle>
          <DialogDescription>
            View past product import operations and their results.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : imports && imports.length > 0 ? (
          <ScrollArea className="flex-1">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-8"></TableHead>
                  <TableHead>File</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">Created</TableHead>
                  <TableHead className="text-right">Updated</TableHead>
                  <TableHead className="text-right">Errors</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {imports.map((record) => (
                  <>
                    <TableRow
                      key={record.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() =>
                        setExpandedId(expandedId === record.id ? null : record.id)
                      }
                    >
                      <TableCell>
                        {record.errors > 0 ? (
                          expandedId === record.id ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )
                        ) : (
                          <FileSpreadsheet className="h-4 w-4 text-muted-foreground" />
                        )}
                      </TableCell>
                      <TableCell className="font-medium max-w-[200px] truncate">
                        {record.file_name}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {format(new Date(record.created_at), "MMM dd, yyyy HH:mm")}
                      </TableCell>
                      <TableCell className="text-right">{record.total_rows}</TableCell>
                      <TableCell className="text-right">
                        <Badge variant="secondary" className="bg-green-100 text-green-800">
                          {record.products_created}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                          {record.products_updated}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {record.errors > 0 ? (
                          <Badge variant="destructive">{record.errors}</Badge>
                        ) : (
                          <Badge variant="secondary">0</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                    {expandedId === record.id && record.error_details.length > 0 && (
                      <TableRow>
                        <TableCell colSpan={7} className="bg-muted/30 p-4">
                          <p className="font-medium mb-2 text-sm">Error Details:</p>
                          <div className="max-h-40 overflow-auto">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead className="text-xs">Row</TableHead>
                                  <TableHead className="text-xs">BCN</TableHead>
                                  <TableHead className="text-xs">Error</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {record.error_details.map((err, idx) => (
                                  <TableRow key={idx}>
                                    <TableCell className="text-xs">{err.row}</TableCell>
                                    <TableCell className="text-xs font-mono">
                                      {err.bcn}
                                    </TableCell>
                                    <TableCell className="text-xs text-destructive">
                                      {err.error}
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <History className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No import history found</p>
            <p className="text-sm text-muted-foreground">
              Import products to see history here
            </p>
          </div>
        )}

        <div className="flex justify-end mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ImportHistory;
