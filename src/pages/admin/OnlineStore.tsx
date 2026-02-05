import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import AddToStoreDialog from "@/components/admin/AddToStoreDialog";
import {
  useOnlineStoreProducts,
  useDeleteOnlineStoreProduct,
  OnlineStoreProduct,
} from "@/hooks/useOnlineStoreProducts";
import { Plus, Search, Edit, Trash2, Loader2, ShoppingBag, Eye, EyeOff, Star } from "lucide-react";

const OnlineStore = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editProduct, setEditProduct] = useState<OnlineStoreProduct | null>(null);

  const { data: products, isLoading } = useOnlineStoreProducts({ activeOnly: false });
  const deleteProduct = useDeleteOnlineStoreProduct();

  const existingProductIds = products?.map((p) => p.product_id) || [];

  const filteredProducts = products?.filter(
    (product) =>
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.product?.sku?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleEdit = (product: OnlineStoreProduct) => {
    setEditProduct(product);
    setAddDialogOpen(true);
  };

  const handleDialogClose = (open: boolean) => {
    setAddDialogOpen(open);
    if (!open) {
      setEditProduct(null);
    }
  };

  return (
    <AdminLayout title="Online Store">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search store products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button
          onClick={() => setAddDialogOpen(true)}
          className="bg-charcoal hover:bg-charcoal/90 text-cream"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Product to Store
        </Button>
      </div>

      {/* Info Banner */}
      <div className="bg-muted/50 border rounded-lg p-4 mb-6">
        <p className="text-sm text-muted-foreground">
          <strong>Online Store Products</strong> are separate from your inventory. 
          Only products listed here will be visible on your e-commerce website. 
          Stock levels are synced with inventory automatically.
        </p>
      </div>

      {/* Products Table */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : filteredProducts && filteredProducts.length > 0 ? (
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px]">Image</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.map((product) => (
                <TableRow key={product.id}>
                  <TableCell>
                    <div className="w-12 h-12 bg-muted rounded overflow-hidden">
                      {product.images?.[0] ? (
                        <img
                          src={product.images[0]}
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ShoppingBag className="h-6 w-6 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{product.name}</span>
                      {product.is_featured && (
                        <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {product.product?.sku || "-"}
                  </TableCell>
                  <TableCell>{product.category?.name || "-"}</TableCell>
                  <TableCell>
                    <div>
                      <span>₹{product.price.toLocaleString()}</span>
                      {product.discount_price && (
                        <span className="text-sm text-green-600 ml-2">
                          ₹{product.discount_price.toLocaleString()}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span
                      className={`${
                        (product.product?.stock_quantity || 0) <= 5
                          ? "text-red-600 font-medium"
                          : ""
                      }`}
                    >
                      {product.product?.stock_quantity || 0}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      {product.is_active ? (
                        <>
                          <Eye className="h-4 w-4 text-green-600" />
                          <span className="text-xs text-green-600">Visible</span>
                        </>
                      ) : (
                        <>
                          <EyeOff className="h-4 w-4 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">Hidden</span>
                        </>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(product)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Remove from Store</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will remove "{product.name}" from your online store.
                              The product will remain in your inventory.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => deleteProduct.mutate(product.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Remove
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
      ) : (
        <div className="text-center py-16 border rounded-lg">
          <ShoppingBag className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground mb-4">No products in your online store</p>
          <Button onClick={() => setAddDialogOpen(true)}>
            Add Your First Product
          </Button>
        </div>
      )}

      {/* Add/Edit Dialog */}
      <AddToStoreDialog
        open={addDialogOpen}
        onOpenChange={handleDialogClose}
        editProduct={editProduct}
        existingProductIds={existingProductIds}
      />
    </AdminLayout>
  );
};

export default OnlineStore;
