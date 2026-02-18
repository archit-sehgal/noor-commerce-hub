import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import * as XLSX from "xlsx";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import AdminLayout from "@/components/admin/AdminLayout";
import BulkProductUpload from "@/components/admin/BulkProductUpload";
import ImportHistory from "@/components/admin/ImportHistory";
import { useProducts, useDeleteProduct } from "@/hooks/useProducts";
import { useCategories } from "@/hooks/useCategories";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Loader2, 
  Package, 
  Upload, 
  History, 
  AlertTriangle,
  Download,
  ChevronLeft,
  ChevronRight,
  Filter,
  X
} from "lucide-react";
import { format } from "date-fns";

const ITEMS_PER_PAGE = 25;

const AdminProducts = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState<"all" | "today" | "week" | "month">("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [bulkUploadOpen, setBulkUploadOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  
  const { data: products, isLoading } = useProducts();
  const { data: categories } = useCategories();
  const deleteProduct = useDeleteProduct();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Apply filters
  const filteredProducts = useMemo(() => {
    if (!products) return [];
    
    let result = [...products];
    
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter((product) =>
        product.name.toLowerCase().includes(query) ||
        product.sku?.toLowerCase().includes(query)
      );
    }
    
    // Category filter
    if (categoryFilter !== "all") {
      result = result.filter((product) => product.category_id === categoryFilter);
    }
    
    // Date filter
    if (dateFilter !== "all") {
      const now = new Date();
      let startDate: Date;
      
      switch (dateFilter) {
        case "today":
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          break;
        case "week":
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case "month":
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        default:
          startDate = new Date(0);
      }
      
      result = result.filter((product) => new Date(product.updated_at) >= startDate);
    }
    
    return result;
  }, [products, searchQuery, categoryFilter, dateFilter]);

  // Pagination
  const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE);
  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredProducts.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredProducts, currentPage]);

  // Reset to page 1 when filters change
  const handleFilterChange = (type: "category" | "date" | "search", value: string) => {
    setCurrentPage(1);
    if (type === "category") setCategoryFilter(value);
    else if (type === "date") setDateFilter(value as "all" | "today" | "week" | "month");
    else setSearchQuery(value);
  };

  const clearFilters = () => {
    setSearchQuery("");
    setCategoryFilter("all");
    setDateFilter("all");
    setCurrentPage(1);
  };

  const hasActiveFilters = searchQuery || categoryFilter !== "all" || dateFilter !== "all";

  const handleRemoveAllInventory = async () => {
    setIsClearing(true);
    try {
      await supabase.from("stock_history").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      await supabase.from("products").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast({
        title: "Inventory Cleared",
        description: "All products have been removed successfully.",
      });
    } catch (error) {
      console.error("Error clearing inventory:", error);
      toast({
        title: "Error",
        description: "Failed to clear inventory.",
        variant: "destructive",
      });
    } finally {
      setIsClearing(false);
    }
  };

  const handleExportInventory = async () => {
    setIsExporting(true);
    try {
      // Export all products (not just filtered)
      const exportData = products?.map((product) => ({
        "Item Details": product.name,
        "BCN": product.sku || "",
        "Design Number": product.design_number || "",
        "Category": product.category?.name || "",
        "GST%": product.gst_rate ?? "",
        "MRP": product.price,
        "Sale Price": product.discount_price || product.price,
        "Cl. Qty.": product.stock_quantity,
        "Cost Price": product.cost_price || "",
        "Status": product.is_active ? "Active" : "Inactive",
        "Last Updated": format(new Date(product.updated_at), "dd/MM/yyyy HH:mm"),
      })) || [];

      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Inventory");

      // Auto-size columns
      const colWidths = [
        { wch: 40 }, // Item Details
        { wch: 15 }, // BCN
        { wch: 15 }, // Design Number
        { wch: 15 }, // Category
        { wch: 12 }, // MRP
        { wch: 12 }, // Sale Price
        { wch: 10 }, // Cl. Qty
        { wch: 12 }, // Cost Price
        { wch: 10 }, // Status
        { wch: 20 }, // Last Updated
      ];
      worksheet["!cols"] = colWidths;

      const fileName = `Inventory_Export_${format(new Date(), "yyyy-MM-dd_HH-mm")}.xlsx`;
      XLSX.writeFile(workbook, fileName);

      toast({
        title: "Export Successful",
        description: `Exported ${exportData.length} products to ${fileName}`,
      });
    } catch (error) {
      console.error("Export error:", error);
      toast({
        title: "Export Failed",
        description: "Failed to export inventory data.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const startItem = (currentPage - 1) * ITEMS_PER_PAGE + 1;
  const endItem = Math.min(currentPage * ITEMS_PER_PAGE, filteredProducts.length);

  return (
    <AdminLayout title="Products">
      {/* Header Actions */}
      <div className="flex flex-col gap-4 mb-6">
        {/* Top Row - Main Actions */}
        <div className="flex flex-wrap gap-2 justify-between">
          <div className="flex gap-2 flex-wrap">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" disabled={isClearing || !products?.length}>
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  {isClearing ? "Clearing..." : "Remove All"}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Remove All Inventory</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete ALL {products?.length || 0} products.
                    This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleRemoveAllInventory}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Yes, Remove All
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
          
          <div className="flex gap-2 flex-wrap">
            <Button 
              variant="outline" 
              onClick={handleExportInventory} 
              disabled={isExporting || !products?.length}
            >
              <Download className="h-4 w-4 mr-2" />
              {isExporting ? "Exporting..." : "Export Inventory"}
            </Button>
            <Button variant="outline" onClick={() => setHistoryOpen(true)}>
              <History className="h-4 w-4 mr-2" />
              History
            </Button>
            <Button variant="outline" onClick={() => setBulkUploadOpen(true)}>
              <Upload className="h-4 w-4 mr-2" />
              Bulk Upload
            </Button>
            <Link to="/admin/products/new">
              <Button className="bg-charcoal hover:bg-charcoal/90 text-cream">
                <Plus className="h-4 w-4 mr-2" />
                Add Product
              </Button>
            </Link>
          </div>
        </div>

        {/* Second Row - Search and Filters */}
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or SKU..."
              value={searchQuery}
              onChange={(e) => handleFilterChange("search", e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Filter Toggle for Mobile */}
          <Button
            variant="outline"
            className="lg:hidden"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="h-4 w-4 mr-2" />
            Filters
            {hasActiveFilters && <span className="ml-2 bg-primary text-primary-foreground rounded-full px-2 py-0.5 text-xs">Active</span>}
          </Button>

          {/* Filters - Desktop always visible, Mobile toggle */}
          <div className={`${showFilters ? "flex" : "hidden lg:flex"} flex-col lg:flex-row gap-2`}>
            {/* Category Filter */}
            <Select value={categoryFilter} onValueChange={(v) => handleFilterChange("category", v)}>
              <SelectTrigger className="w-full lg:w-[180px]">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories?.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Date Filter */}
            <Select value={dateFilter} onValueChange={(v) => handleFilterChange("date", v)}>
              <SelectTrigger className="w-full lg:w-[150px]">
                <SelectValue placeholder="All Dates" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Dates</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
              </SelectContent>
            </Select>

            {/* Clear Filters */}
            {hasActiveFilters && (
              <Button variant="ghost" onClick={clearFilters} className="text-muted-foreground">
                <X className="h-4 w-4 mr-1" />
                Clear
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Products Table */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : paginatedProducts.length > 0 ? (
        <>
          {/* Results Info */}
          <div className="flex items-center justify-between mb-4 text-sm text-muted-foreground">
            <span>
              Showing {startItem}–{endItem} of {filteredProducts.length} products
              {hasActiveFilters && ` (filtered from ${products?.length || 0} total)`}
            </span>
          </div>

          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
              <TableRow>
                  <TableHead className="w-[60px]">Image</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-center">GST%</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                  <TableHead className="text-right">Stock</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedProducts.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell>
                      <div className="w-10 h-10 bg-muted rounded overflow-hidden">
                        {product.images?.[0] ? (
                          <img
                            src={product.images[0]}
                            alt={product.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package className="h-5 w-5 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium max-w-[200px] truncate">
                      {product.name}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {product.sku || "-"}
                    </TableCell>
                    <TableCell>{product.category?.name || "-"}</TableCell>
                    <TableCell className="text-center">
                      {product.gst_rate !== null && product.gst_rate !== undefined ? `${product.gst_rate}%` : "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div>
                        <span>₹{product.price.toLocaleString()}</span>
                        {product.discount_price && (
                          <span className="text-sm text-green-600 ml-2">
                            ₹{product.discount_price.toLocaleString()}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <span
                        className={
                          product.stock_quantity <= (product.min_stock_alert || 5)
                            ? "text-destructive font-medium"
                            : ""
                        }
                      >
                        {product.stock_quantity}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Link to={`/admin/products/${product.id}/edit`}>
                          <Button variant="ghost" size="icon">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </Link>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Product</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete "{product.name}"?
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => deleteProduct.mutate(product.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-muted-foreground">
                Page {currentPage} of {totalPages}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous
                </Button>
                
                {/* Page Numbers */}
                <div className="hidden sm:flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum: number;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    
                    return (
                      <Button
                        key={pageNum}
                        variant={currentPage === pageNum ? "default" : "outline"}
                        size="sm"
                        className="w-8 h-8 p-0"
                        onClick={() => setCurrentPage(pageNum)}
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-16 border rounded-lg">
          <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground mb-4">
            {hasActiveFilters ? "No products match your filters" : "No products found"}
          </p>
          {hasActiveFilters ? (
            <Button variant="outline" onClick={clearFilters}>
              Clear Filters
            </Button>
          ) : (
            <Link to="/admin/products/new">
              <Button>Add Your First Product</Button>
            </Link>
          )}
        </div>
      )}

      {/* Dialogs */}
      <BulkProductUpload open={bulkUploadOpen} onOpenChange={setBulkUploadOpen} />
      <ImportHistory open={historyOpen} onOpenChange={setHistoryOpen} />
    </AdminLayout>
  );
};

export default AdminProducts;
