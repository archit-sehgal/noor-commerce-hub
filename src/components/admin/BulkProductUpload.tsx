import { useState, useCallback } from "react";
import * as XLSX from "xlsx";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import {
  Upload,
  FileSpreadsheet,
  AlertCircle,
  CheckCircle2,
  Loader2,
  X,
} from "lucide-react";

interface ParsedProduct {
  itemDetails: string;
  bcn: string;
  designNumber: string;
  mrp: number;
  salePrice: number;
  unit: string;
  closingQty: number;
  isValid: boolean;
  errors: string[];
  detectedCategory: string | null;
}

interface ImportResult {
  created: number;
  updated: number;
  errors: { row: number; bcn: string; error: string }[];
}

interface BulkProductUploadProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const BulkProductUpload = ({ open, onOpenChange }: BulkProductUploadProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ParsedProduct[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [step, setStep] = useState<"upload" | "preview" | "importing" | "complete">("upload");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const resetState = useCallback(() => {
    setFile(null);
    setParsedData([]);
    setIsLoading(false);
    setIsImporting(false);
    setImportProgress(0);
    setImportResult(null);
    setStep("upload");
  }, []);

  const handleClose = useCallback(() => {
    resetState();
    onOpenChange(false);
  }, [resetState, onOpenChange]);

  const generateSlug = (name: string, bcn: string): string => {
    const baseSlug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
    return `${baseSlug}-${bcn.toLowerCase()}`;
  };

  // Category detection from item name prefix (before "-")
  // Categories are matched case-insensitively and with flexible matching
  const CATEGORY_MAP: Record<string, string> = {
    "LEHENGA": "LEHENGA",
    "RM DRESS": "RM DRESS", 
    "SAREE": "SAREE",
    "SUIT": "SUIT",
  };

  const detectCategory = (itemDetails: string): string | null => {
    if (!itemDetails) return null;
    
    // Get prefix before first hyphen, handle case where no hyphen exists
    const parts = itemDetails.split("-");
    const prefix = parts[0]?.trim().toUpperCase();
    if (!prefix) return null;
    
    // Check for exact match first
    if (CATEGORY_MAP[prefix]) return CATEGORY_MAP[prefix];
    
    // Check if prefix starts with any known category (handles variations like "LEHENGA SET")
    for (const category of Object.keys(CATEGORY_MAP)) {
      if (prefix.startsWith(category) || prefix.includes(category)) {
        return CATEGORY_MAP[category];
      }
    }
    
    // Also check if any category keyword exists anywhere in the item details
    const upperDetails = itemDetails.toUpperCase();
    for (const category of Object.keys(CATEGORY_MAP)) {
      if (upperDetails.startsWith(category + " ") || upperDetails.startsWith(category + "-")) {
        return CATEGORY_MAP[category];
      }
    }
    
    return null; // No category match
  };

  const parseExcelFile = useCallback(async (selectedFile: File) => {
    setIsLoading(true);
    try {
      const data = await selectedFile.arrayBuffer();
      const workbook = XLSX.read(data, { type: "array" });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as unknown[][];

      // Find header row
      const headerRow = jsonData[0] as string[];
      const columnMap: Record<string, number> = {};
      
      headerRow.forEach((col, index) => {
        const colLower = (col || "").toString().toLowerCase().trim();
        if (colLower.includes("item details")) columnMap.itemDetails = index;
        else if (colLower === "bcn") columnMap.bcn = index;
        else if (colLower.includes("p1") || colLower.includes("dsn")) columnMap.designNumber = index;
        else if (colLower === "mrp") columnMap.mrp = index;
        else if (colLower.includes("sale") && colLower.includes("price")) columnMap.salePrice = index;
        else if (colLower === "unit") columnMap.unit = index;
        else if (colLower.includes("cl.") && colLower.includes("qty")) columnMap.closingQty = index;
      });

      // Validate required columns
      const requiredColumns = ["itemDetails", "bcn", "mrp", "salePrice", "closingQty"];
      const missingColumns = requiredColumns.filter((col) => columnMap[col] === undefined);
      
      if (missingColumns.length > 0) {
        toast({
          title: "Column Mapping Error",
          description: `Missing required columns: ${missingColumns.join(", ")}`,
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      // Parse data rows (limit to 2000 rows max to prevent performance issues)
      const MAX_ROWS = 2000;
      const MAX_TEXT_LENGTH = 300;
      const MAX_BCN_LENGTH = 50;
      const MAX_PRICE = 10000000; // 1 crore
      const MAX_STOCK = 1000000;

      const products: ParsedProduct[] = [];
      const dataRows = Math.min(jsonData.length, MAX_ROWS + 1); // +1 for header
      
      if (jsonData.length > MAX_ROWS + 1) {
        toast({
          title: "Row Limit Exceeded",
          description: `Only the first ${MAX_ROWS} rows will be processed. File has ${jsonData.length - 1} data rows.`,
          variant: "destructive",
        });
      }

      for (let i = 1; i < dataRows; i++) {
        const row = jsonData[i] as (string | number)[];
        if (!row || row.length === 0) continue;

        const bcnRaw = (row[columnMap.bcn] || "").toString().trim();
        if (!bcnRaw) continue; // Skip empty rows

        const errors: string[] = [];
        
        // Sanitize and validate text fields with length limits
        const bcn = bcnRaw.slice(0, MAX_BCN_LENGTH);
        if (bcnRaw.length > MAX_BCN_LENGTH) errors.push(`BCN truncated to ${MAX_BCN_LENGTH} chars`);
        
        const itemDetails = (row[columnMap.itemDetails] || "").toString().trim().slice(0, MAX_TEXT_LENGTH);
        const designNumber = (row[columnMap.designNumber] || "").toString().trim().slice(0, MAX_TEXT_LENGTH);
        const unit = (row[columnMap.unit] || "Pcs").toString().trim().slice(0, 20);

        const mrpRaw = row[columnMap.mrp];
        const salePriceRaw = row[columnMap.salePrice];
        const closingQtyRaw = row[columnMap.closingQty];

        // Validate required text fields
        if (!itemDetails) errors.push("Missing product name");
        
        // CRITICAL: Preserve exact values from file without transformation
        let mrp: number;
        let salePrice: number;
        let closingQty: number;

        // Handle MRP - preserve exact value
        if (typeof mrpRaw === "number") {
          mrp = mrpRaw;
        } else {
          const mrpStr = (mrpRaw?.toString() || "0").trim().replace(/,/g, "");
          mrp = Number(mrpStr);
        }

        // Handle Sale Price - preserve exact value
        if (typeof salePriceRaw === "number") {
          salePrice = salePriceRaw;
        } else {
          const salePriceStr = (salePriceRaw?.toString() || "0").trim().replace(/,/g, "");
          salePrice = Number(salePriceStr);
        }

        // Handle Closing Qty - preserve exact value (no rounding until database insert)
        if (typeof closingQtyRaw === "number") {
          closingQty = closingQtyRaw;
        } else {
          const qtyStr = (closingQtyRaw?.toString() || "0").trim().replace(/,/g, "");
          closingQty = Number(qtyStr);
        }

        // Numeric validation with bounds checking
        if (isNaN(mrp) || mrp < 0) errors.push("Invalid MRP");
        else if (mrp > MAX_PRICE) errors.push(`MRP exceeds maximum (${MAX_PRICE})`);
        
        if (isNaN(salePrice) || salePrice < 0) errors.push("Invalid Sale Price");
        else if (salePrice > MAX_PRICE) errors.push(`Sale Price exceeds maximum (${MAX_PRICE})`);
        
        if (isNaN(closingQty) || closingQty < 0) errors.push("Invalid Quantity");
        else if (closingQty > MAX_STOCK) errors.push(`Quantity exceeds maximum (${MAX_STOCK})`);

        products.push({
          itemDetails,
          bcn,
          designNumber,
          mrp,
          salePrice,
          unit,
          closingQty: Math.round(closingQty), // Round to nearest integer for stock (integers only in DB)
          isValid: errors.length === 0,
          errors,
          detectedCategory: detectCategory(itemDetails),
        });
      }

      setParsedData(products);
      setStep("preview");
      toast({
        title: "File Parsed Successfully",
        description: `Found ${products.length} products. ${products.filter((p) => !p.isValid).length} have validation errors.`,
      });
    } catch (error) {
      console.error("Parse error:", error);
      toast({
        title: "Parse Error",
        description: "Failed to parse the Excel file. Please check the format.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFile = e.target.files?.[0];
      if (selectedFile) {
        setFile(selectedFile);
        parseExcelFile(selectedFile);
      }
    },
    [parseExcelFile]
  );

  const handleImport = async () => {
    const validProducts = parsedData.filter((p) => p.isValid);
    if (validProducts.length === 0) {
      toast({
        title: "No Valid Products",
        description: "There are no valid products to import.",
        variant: "destructive",
      });
      return;
    }

    setStep("importing");
    setIsImporting(true);
    setImportProgress(0);

    const result: ImportResult = { created: 0, updated: 0, errors: [] };
    const batchSize = 10;
    const totalBatches = Math.ceil(validProducts.length / batchSize);

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();

      for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
        const batch = validProducts.slice(
          batchIndex * batchSize,
          (batchIndex + 1) * batchSize
        );

        // Fetch categories once per batch to reduce queries
        const { data: categories } = await supabase
          .from("categories")
          .select("id, name");
        
        const categoryMap = new Map<string, string>();
        categories?.forEach(cat => {
          categoryMap.set(cat.name.toUpperCase(), cat.id);
        });

        await Promise.all(
          batch.map(async (product, idx) => {
            const rowNumber = batchIndex * batchSize + idx + 2; // +2 for 1-indexed + header
            try {
              // Get category_id if detected
              const categoryId = product.detectedCategory 
                ? categoryMap.get(product.detectedCategory) || null
                : null;

              // Check if product exists by SKU
              const { data: existing } = await supabase
                .from("products")
                .select("id, stock_quantity")
                .eq("sku", product.bcn)
                .maybeSingle();

              if (existing) {
                // Update existing product
                const previousQty = existing.stock_quantity;
                const newQty = product.closingQty;

                const { error: updateError } = await supabase
                  .from("products")
                  .update({
                    name: product.itemDetails,
                    design_number: product.designNumber,
                    price: product.mrp,
                    discount_price: product.salePrice !== product.mrp ? product.salePrice : null,
                    stock_quantity: newQty,
                    category_id: categoryId,
                    updated_at: new Date().toISOString(),
                  })
                  .eq("id", existing.id);

                if (updateError) throw updateError;

                // Log stock change if different
                if (previousQty !== newQty) {
                  await supabase.from("stock_history").insert({
                    product_id: existing.id,
                    previous_quantity: previousQty,
                    new_quantity: newQty,
                    change_amount: newQty - previousQty,
                    change_type: "file_upload",
                    notes: `Synced from file: ${file?.name}`,
                    created_by: user?.id,
                  });
                }

                result.updated++;
              } else {
                // Create new product
                const slug = generateSlug(product.itemDetails, product.bcn);
                
                const { data: newProduct, error: insertError } = await supabase
                  .from("products")
                  .insert({
                    name: product.itemDetails,
                    slug,
                    sku: product.bcn,
                    design_number: product.designNumber,
                    price: product.mrp,
                    discount_price: product.salePrice !== product.mrp ? product.salePrice : null,
                    stock_quantity: product.closingQty,
                    category_id: categoryId,
                    is_active: true,
                    is_featured: false,
                  })
                  .select("id")
                  .single();

                if (insertError) throw insertError;

                // Log initial stock
                if (newProduct) {
                  await supabase.from("stock_history").insert({
                    product_id: newProduct.id,
                    previous_quantity: 0,
                    new_quantity: product.closingQty,
                    change_amount: product.closingQty,
                    change_type: "file_upload",
                    notes: `Initial stock from file: ${file?.name}`,
                    created_by: user?.id,
                  });
                }

                result.created++;
              }
            } catch (error: unknown) {
              const errorMessage = error instanceof Error ? error.message : "Unknown error";
              result.errors.push({
                row: rowNumber,
                bcn: product.bcn,
                error: errorMessage,
              });
            }
          })
        );

        setImportProgress(Math.round(((batchIndex + 1) / totalBatches) * 100));
      }

      // Log import history
      await supabase.from("product_imports").insert({
        file_name: file?.name || "unknown",
        total_rows: validProducts.length,
        products_created: result.created,
        products_updated: result.updated,
        errors: result.errors.length,
        error_details: result.errors,
        imported_by: user?.id,
      });

      setImportResult(result);
      setStep("complete");
      queryClient.invalidateQueries({ queryKey: ["products"] });

      toast({
        title: "Import Complete",
        description: `Created: ${result.created}, Updated: ${result.updated}, Errors: ${result.errors.length}`,
      });
    } catch (error) {
      console.error("Import error:", error);
      toast({
        title: "Import Failed",
        description: "An error occurred during import.",
        variant: "destructive",
      });
      setStep("preview");
    } finally {
      setIsImporting(false);
    }
  };

  const validCount = parsedData.filter((p) => p.isValid).length;
  const invalidCount = parsedData.filter((p) => !p.isValid).length;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Bulk Product Import
          </DialogTitle>
          <DialogDescription>
            Upload an Excel/CSV file to sync products from your inventory software.
          </DialogDescription>
        </DialogHeader>

        {step === "upload" && (
          <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed rounded-lg">
            <Upload className="h-12 w-12 text-muted-foreground mb-4" />
            <Label htmlFor="file-upload" className="cursor-pointer">
              <span className="text-primary font-medium">Click to upload</span> or drag and drop
            </Label>
            <p className="text-sm text-muted-foreground mt-1">
              Excel (.xlsx, .xls) or CSV files
            </p>
            <Input
              id="file-upload"
              type="file"
              accept=".xlsx,.xls,.csv"
              className="hidden"
              onChange={handleFileChange}
              disabled={isLoading}
            />
            {isLoading && (
              <div className="flex items-center gap-2 mt-4">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">Parsing file...</span>
              </div>
            )}
          </div>
        )}

        {step === "preview" && (
          <>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                <Badge variant="secondary" className="gap-1">
                  <FileSpreadsheet className="h-3 w-3" />
                  {file?.name}
                </Badge>
                <Badge variant="default" className="gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  {validCount} Valid
                </Badge>
                {invalidCount > 0 && (
                  <Badge variant="destructive" className="gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {invalidCount} Errors
                  </Badge>
                )}
              </div>
              <Button variant="outline" size="sm" onClick={resetState}>
                <X className="h-4 w-4 mr-1" />
                Clear
              </Button>
            </div>

            <ScrollArea className="flex-1 border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">Status</TableHead>
                    <TableHead>Product Name</TableHead>
                    <TableHead>BCN (SKU)</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Design No.</TableHead>
                    <TableHead className="text-right">MRP</TableHead>
                    <TableHead className="text-right">Sale Price</TableHead>
                    <TableHead className="text-right">Stock</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {parsedData.slice(0, 100).map((product, idx) => (
                    <TableRow
                      key={idx}
                      className={product.isValid ? "" : "bg-destructive/10"}
                    >
                      <TableCell>
                        {product.isValid ? (
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                        ) : (
                          <AlertCircle className="h-4 w-4 text-destructive" />
                        )}
                      </TableCell>
                      <TableCell className="font-medium max-w-[200px] truncate">
                        {product.itemDetails}
                        {!product.isValid && (
                          <p className="text-xs text-destructive">
                            {product.errors.join(", ")}
                          </p>
                        )}
                      </TableCell>
                      <TableCell className="font-mono text-sm">{product.bcn}</TableCell>
                      <TableCell>
                        {product.detectedCategory ? (
                          <span className="px-2 py-1 text-xs rounded-full bg-primary/10 text-primary">
                            {product.detectedCategory}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>{product.designNumber || "-"}</TableCell>
                      <TableCell className="text-right">₹{product.mrp.toLocaleString()}</TableCell>
                      <TableCell className="text-right">₹{product.salePrice.toLocaleString()}</TableCell>
                      <TableCell className="text-right">{product.closingQty}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {parsedData.length > 100 && (
                <p className="text-center py-2 text-sm text-muted-foreground">
                  Showing first 100 of {parsedData.length} products
                </p>
              )}
            </ScrollArea>

            <DialogFooter className="mt-4">
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button onClick={handleImport} disabled={validCount === 0}>
                Import {validCount} Products
              </Button>
            </DialogFooter>
          </>
        )}

        {step === "importing" && (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
            <p className="text-lg font-medium mb-2">Importing Products...</p>
            <p className="text-sm text-muted-foreground mb-4">
              Please do not close this dialog
            </p>
            <Progress value={importProgress} className="w-64" />
            <p className="text-sm text-muted-foreground mt-2">{importProgress}%</p>
          </div>
        )}

        {step === "complete" && importResult && (
          <div className="flex flex-col items-center justify-center py-8">
            <CheckCircle2 className="h-16 w-16 text-green-600 mb-4" />
            <p className="text-xl font-medium mb-4">Import Complete!</p>
            
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <p className="text-2xl font-bold text-green-600">{importResult.created}</p>
                <p className="text-sm text-muted-foreground">Products Created</p>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <p className="text-2xl font-bold text-blue-600">{importResult.updated}</p>
                <p className="text-sm text-muted-foreground">Products Updated</p>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <p className="text-2xl font-bold text-red-600">{importResult.errors.length}</p>
                <p className="text-sm text-muted-foreground">Errors</p>
              </div>
            </div>

            {importResult.errors.length > 0 && (
              <ScrollArea className="w-full max-h-40 border rounded-lg mb-4">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Row</TableHead>
                      <TableHead>BCN</TableHead>
                      <TableHead>Error</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {importResult.errors.map((err, idx) => (
                      <TableRow key={idx}>
                        <TableCell>{err.row}</TableCell>
                        <TableCell className="font-mono">{err.bcn}</TableCell>
                        <TableCell className="text-destructive">{err.error}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            )}

            <Button onClick={handleClose}>Close</Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default BulkProductUpload;
