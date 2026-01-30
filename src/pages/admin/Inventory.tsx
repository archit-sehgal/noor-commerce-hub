import { useEffect, useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { Search, AlertTriangle, Plus, Minus, Loader2, Target } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

interface Product {
  id: string;
  name: string;
  sku: string | null;
  stock_quantity: number;
  min_stock_alert: number | null;
  price: number;
  category_name: string | null;
}

interface StockHistory {
  id: string;
  change_type: string;
  change_amount: number;
  previous_quantity: number;
  new_quantity: number;
  notes: string | null;
  created_at: string;
}

const AdminInventory = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [stockHistory, setStockHistory] = useState<StockHistory[]>([]);
  const [adjustmentMode, setAdjustmentMode] = useState<"set" | "adjust">("set");
  const [adjustmentType, setAdjustmentType] = useState<"add" | "remove">("add");
  const [adjustmentQuantity, setAdjustmentQuantity] = useState("");
  const [adjustmentNotes, setAdjustmentNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from("products")
        .select(`
          id,
          name,
          sku,
          stock_quantity,
          min_stock_alert,
          price,
          categories(name)
        `)
        .order("name");

      if (error) throw error;

      setProducts(
        data?.map((p) => ({
          id: p.id,
          name: p.name,
          sku: p.sku,
          stock_quantity: p.stock_quantity,
          min_stock_alert: p.min_stock_alert,
          price: p.price,
          category_name: (p.categories as { name: string } | null)?.name || null,
        })) || []
      );
    } catch (error) {
      console.error("Error fetching products:", error);
      toast({
        title: "Error",
        description: "Failed to fetch inventory",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchStockHistory = async (productId: string) => {
    const { data, error } = await supabase
      .from("stock_history")
      .select("*")
      .eq("product_id", productId)
      .order("created_at", { ascending: false })
      .limit(10);

    if (!error && data) {
      setStockHistory(data);
    }
  };

  const handleOpenAdjustment = async (product: Product) => {
    setSelectedProduct(product);
    await fetchStockHistory(product.id);
    setAdjustmentQuantity("");
    setAdjustmentNotes("");
    setAdjustmentMode("set");
    setDialogOpen(true);
  };

  const handleStockAdjustment = async () => {
    if (!selectedProduct || !adjustmentQuantity) return;

    const quantity = parseInt(adjustmentQuantity);
    if (isNaN(quantity) || quantity < 0) {
      toast({
        title: "Error",
        description: "Please enter a valid quantity",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);

    let newQuantity: number;
    let changeAmount: number;

    if (adjustmentMode === "set") {
      // SET mode: set stock to exact value
      newQuantity = quantity;
      changeAmount = quantity - selectedProduct.stock_quantity;
    } else {
      // ADJUST mode: add or remove from current stock
      changeAmount = adjustmentType === "add" ? quantity : -quantity;
      newQuantity = selectedProduct.stock_quantity + changeAmount;

      if (newQuantity < 0) {
        toast({
          title: "Error",
          description: "Cannot remove more than available stock",
          variant: "destructive",
        });
        setSubmitting(false);
        return;
      }
    }

    try {
      // Update product stock
      const { error: updateError } = await supabase
        .from("products")
        .update({ stock_quantity: newQuantity })
        .eq("id", selectedProduct.id);

      if (updateError) throw updateError;

      // Record stock history
      const { error: historyError } = await supabase.from("stock_history").insert({
        product_id: selectedProduct.id,
        change_type: adjustmentMode === "set" ? "stock_set" : adjustmentType === "add" ? "adjustment_in" : "adjustment_out",
        change_amount: changeAmount,
        previous_quantity: selectedProduct.stock_quantity,
        new_quantity: newQuantity,
        notes: adjustmentNotes || `Stock ${adjustmentMode === "set" ? "set to" : adjustmentType === "add" ? "added" : "removed"} ${quantity}`,
        created_by: user?.id,
      });

      if (historyError) throw historyError;

      toast({
        title: "Success",
        description: `Stock ${adjustmentMode === "set" ? "set to" : "updated to"} ${newQuantity}`,
      });

      setDialogOpen(false);
      fetchProducts();
    } catch (error) {
      console.error("Error updating stock:", error);
      toast({
        title: "Error",
        description: "Failed to update stock",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.sku?.toLowerCase().includes(searchQuery.toLowerCase());

    if (filter === "low") {
      return (
        matchesSearch &&
        product.stock_quantity <= (product.min_stock_alert || 10) &&
        product.stock_quantity > 0
      );
    }
    if (filter === "out") {
      return matchesSearch && product.stock_quantity === 0;
    }
    return matchesSearch;
  });

  const lowStockCount = products.filter(
    (p) => p.stock_quantity <= (p.min_stock_alert || 10) && p.stock_quantity > 0
  ).length;

  const outOfStockCount = products.filter((p) => p.stock_quantity === 0).length;

  return (
    <AdminLayout title="Inventory">
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-background rounded-lg p-4 shadow-sm border border-border">
          <p className="text-sm text-muted-foreground">Total Products</p>
          <p className="text-2xl font-display font-bold">{products.length}</p>
        </div>
        <div className="bg-yellow-50 rounded-lg p-4 shadow-sm border border-yellow-200">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
            <p className="text-sm text-yellow-700">Low Stock</p>
          </div>
          <p className="text-2xl font-display font-bold text-yellow-700">
            {lowStockCount}
          </p>
        </div>
        <div className="bg-red-50 rounded-lg p-4 shadow-sm border border-red-200">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <p className="text-sm text-red-700">Out of Stock</p>
          </div>
          <p className="text-2xl font-display font-bold text-red-700">
            {outOfStockCount}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or SKU..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Filter" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Products</SelectItem>
            <SelectItem value="low">Low Stock</SelectItem>
            <SelectItem value="out">Out of Stock</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Products Table */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground border rounded-lg">
          No products found
        </div>
      ) : (
        <div className="bg-background rounded-lg shadow-sm overflow-hidden border border-border">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                    Product
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground hidden md:table-cell">
                    SKU
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground hidden lg:table-cell">
                    Category
                  </th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-muted-foreground">
                    Stock
                  </th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-muted-foreground hidden sm:table-cell">
                    Min Alert
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground hidden sm:table-cell">
                    Status
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((product) => {
                  const isLow =
                    product.stock_quantity <= (product.min_stock_alert || 10) &&
                    product.stock_quantity > 0;
                  const isOut = product.stock_quantity === 0;

                  return (
                    <tr
                      key={product.id}
                      className="border-b border-border/50 hover:bg-muted/30"
                    >
                      <td className="py-3 px-4 font-medium text-sm">{product.name}</td>
                      <td className="py-3 px-4 text-muted-foreground text-sm hidden md:table-cell">
                        {product.sku || "-"}
                      </td>
                      <td className="py-3 px-4 text-sm hidden lg:table-cell">{product.category_name || "-"}</td>
                      <td className="py-3 px-4 text-center font-bold text-lg">
                        <span className={isOut ? "text-red-600" : isLow ? "text-yellow-600" : "text-green-600"}>
                          {product.stock_quantity}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center text-muted-foreground hidden sm:table-cell">
                        {product.min_stock_alert || 10}
                      </td>
                      <td className="py-3 px-4 hidden sm:table-cell">
                        {isOut ? (
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
                            Out of Stock
                          </span>
                        ) : isLow ? (
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
                            Low Stock
                          </span>
                        ) : (
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                            In Stock
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenAdjustment(product)}
                        >
                          Adjust Stock
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Stock Adjustment Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display">
              Adjust Stock - {selectedProduct?.name}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="bg-muted/50 rounded-lg p-4 text-center">
              <p className="text-sm text-muted-foreground">Current Stock</p>
              <p className="text-4xl font-display font-bold text-gold">
                {selectedProduct?.stock_quantity}
              </p>
            </div>

            {/* Mode Selection */}
            <Tabs value={adjustmentMode} onValueChange={(v) => setAdjustmentMode(v as "set" | "adjust")}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="set" className="gap-2">
                  <Target className="h-4 w-4" />
                  Set Stock To
                </TabsTrigger>
                <TabsTrigger value="adjust" className="gap-2">
                  <Plus className="h-4 w-4" />
                  Add/Remove
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="set" className="space-y-4 pt-4">
                <div>
                  <Label htmlFor="set-quantity">New Stock Quantity</Label>
                  <Input
                    id="set-quantity"
                    type="number"
                    min="0"
                    value={adjustmentQuantity}
                    onChange={(e) => setAdjustmentQuantity(e.target.value)}
                    placeholder="Enter new stock quantity"
                    className="text-lg font-medium"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    The stock will be set to this exact number
                  </p>
                </div>
              </TabsContent>

              <TabsContent value="adjust" className="space-y-4 pt-4">
                <div className="flex gap-2">
                  <Button
                    variant={adjustmentType === "add" ? "default" : "outline"}
                    onClick={() => setAdjustmentType("add")}
                    className="flex-1"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Stock
                  </Button>
                  <Button
                    variant={adjustmentType === "remove" ? "default" : "outline"}
                    onClick={() => setAdjustmentType("remove")}
                    className="flex-1"
                  >
                    <Minus className="h-4 w-4 mr-2" />
                    Remove Stock
                  </Button>
                </div>

                <div>
                  <Label htmlFor="adjust-quantity">Quantity to {adjustmentType}</Label>
                  <Input
                    id="adjust-quantity"
                    type="number"
                    min="1"
                    value={adjustmentQuantity}
                    onChange={(e) => setAdjustmentQuantity(e.target.value)}
                    placeholder={`Enter quantity to ${adjustmentType}`}
                  />
                </div>
              </TabsContent>
            </Tabs>

            <div>
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                value={adjustmentNotes}
                onChange={(e) => setAdjustmentNotes(e.target.value)}
                placeholder="Reason for adjustment..."
                rows={2}
              />
            </div>

            <Button 
              onClick={handleStockAdjustment} 
              className="w-full"
              disabled={submitting || !adjustmentQuantity}
            >
              {submitting ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Confirm {adjustmentMode === "set" ? "Set to" : adjustmentType === "add" ? "Add" : "Remove"} {adjustmentQuantity || "0"}
            </Button>

            {/* History */}
            {stockHistory.length > 0 && (
              <div className="mt-6">
                <h4 className="text-sm font-medium mb-2">Recent History</h4>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {stockHistory.map((item) => (
                    <div
                      key={item.id}
                      className="flex justify-between items-center text-sm py-2 border-b border-border/50"
                    >
                      <div>
                        <span
                          className={
                            item.change_amount > 0
                              ? "text-green-600 font-medium"
                              : "text-red-600 font-medium"
                          }
                        >
                          {item.change_amount > 0 ? "+" : ""}
                          {item.change_amount}
                        </span>
                        <span className="text-muted-foreground ml-2">
                          ({item.previous_quantity} → {item.new_quantity})
                        </span>
                      </div>
                      <span className="text-muted-foreground text-xs">
                        {new Date(item.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminInventory;
