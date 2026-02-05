import { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useProducts, Product } from "@/hooks/useProducts";
import { useCategories } from "@/hooks/useCategories";
import { useCreateOnlineStoreProduct, useUpdateOnlineStoreProduct, OnlineStoreProduct } from "@/hooks/useOnlineStoreProducts";
import { Loader2, Search, Package, Upload, X, ImageIcon } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface AddToStoreDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editProduct?: OnlineStoreProduct | null;
  existingProductIds?: string[];
}

const AddToStoreDialog = ({
  open,
  onOpenChange,
  editProduct,
  existingProductIds = [],
}: AddToStoreDialogProps) => {
  const [step, setStep] = useState<"select" | "customize">(editProduct ? "customize" : "select");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  
  // Form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [discountPrice, setDiscountPrice] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [sizes, setSizes] = useState("");
  const [colors, setColors] = useState("");
  const [images, setImages] = useState("");
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [isFeatured, setIsFeatured] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: inventoryProducts, isLoading: productsLoading } = useProducts({ includeInactive: true });
  const { data: categories } = useCategories();
  const createProduct = useCreateOnlineStoreProduct();
  const updateProduct = useUpdateOnlineStoreProduct();
  const { toast } = useToast();

  // Filter out products already in the online store
  const availableProducts = inventoryProducts?.filter(
    (p) => !existingProductIds.includes(p.id)
  );

  const filteredProducts = availableProducts?.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.sku?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (open) {
      if (editProduct) {
        setStep("customize");
        setName(editProduct.name);
        setDescription(editProduct.description || "");
        setPrice(editProduct.price.toString());
        setDiscountPrice(editProduct.discount_price?.toString() || "");
        setCategoryId(editProduct.category_id || "");
        setSizes(editProduct.sizes?.join(", ") || "");
        setColors(editProduct.colors?.join(", ") || "");
        setImages(editProduct.images?.join("\n") || "");
        setIsActive(editProduct.is_active);
        setIsFeatured(editProduct.is_featured);
      } else {
        setStep("select");
        resetForm();
      }
    }
  }, [open, editProduct]);

  const resetForm = () => {
    setSearchQuery("");
    setSelectedProduct(null);
    setName("");
    setDescription("");
    setPrice("");
    setDiscountPrice("");
    setCategoryId("");
    setSizes("");
    setColors("");
    setImages("");
    setUploadedImages([]);
    setIsActive(true);
    setIsFeatured(false);
  };

  const handleImageUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    setIsUploading(true);
    const newUrls: string[] = [];
    
    try {
      for (const file of Array.from(files)) {
        // Validate file type
        if (!file.type.startsWith("image/")) {
          toast({
            title: "Invalid file type",
            description: `${file.name} is not an image file`,
            variant: "destructive",
          });
          continue;
        }

        // Generate unique filename
        const fileExt = file.name.split(".").pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `online-store/${fileName}`;

        // Upload to Supabase Storage
        const { error: uploadError } = await supabase.storage
          .from("product-images")
          .upload(filePath, file);

        if (uploadError) {
          toast({
            title: "Upload failed",
            description: uploadError.message,
            variant: "destructive",
          });
          continue;
        }

        // Get public URL
        const { data: urlData } = supabase.storage
          .from("product-images")
          .getPublicUrl(filePath);

        newUrls.push(urlData.publicUrl);
      }

      if (newUrls.length > 0) {
        setUploadedImages((prev) => [...prev, ...newUrls]);
        toast({
          title: "Images uploaded",
          description: `${newUrls.length} image(s) uploaded successfully`,
        });
      }
    } catch (error) {
      console.error("Upload error:", error);
      toast({
        title: "Upload error",
        description: "Failed to upload images",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const removeUploadedImage = (url: string) => {
    setUploadedImages((prev) => prev.filter((u) => u !== url));
  };

  const handleSelectProduct = (product: Product) => {
    setSelectedProduct(product);
    setName(product.name);
    setDescription(product.description || "");
    setPrice(product.price.toString());
    setDiscountPrice(product.discount_price?.toString() || "");
    setCategoryId(product.category_id || "");
    setSizes(product.sizes?.join(", ") || "");
    setColors(product.colors?.join(", ") || "");
    setImages(product.images?.join("\n") || "");
    setStep("customize");
  };

  const handleSubmit = async () => {
    // Combine URL images and uploaded images
    const urlImages = images ? images.split("\n").map((i) => i.trim()).filter(Boolean) : [];
    const allImages = [...urlImages, ...uploadedImages];

    const productData = {
      name,
      description: description || undefined,
      price: parseFloat(price),
      discount_price: discountPrice ? parseFloat(discountPrice) : undefined,
      category_id: categoryId || undefined,
      sizes: sizes ? sizes.split(",").map((s) => s.trim()).filter(Boolean) : [],
      colors: colors ? colors.split(",").map((c) => c.trim()).filter(Boolean) : [],
      images: allImages,
      is_active: isActive,
      is_featured: isFeatured,
    };

    if (editProduct) {
      await updateProduct.mutateAsync({ id: editProduct.id, ...productData });
    } else if (selectedProduct) {
      await createProduct.mutateAsync({
        product_id: selectedProduct.id,
        ...productData,
      });
    }

    onOpenChange(false);
    resetForm();
  };

  const isSubmitting = createProduct.isPending || updateProduct.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>
            {editProduct
              ? "Edit Online Store Product"
              : step === "select"
              ? "Select Product from Inventory"
              : "Customize for Online Store"}
          </DialogTitle>
        </DialogHeader>

        {step === "select" ? (
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search inventory by name or SKU..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <ScrollArea className="h-[400px] border rounded-lg">
              {productsLoading ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : filteredProducts && filteredProducts.length > 0 ? (
                <div className="divide-y">
                  {filteredProducts.map((product) => (
                    <div
                      key={product.id}
                      className="flex items-center gap-4 p-4 hover:bg-muted/50 cursor-pointer transition-colors"
                      onClick={() => handleSelectProduct(product)}
                    >
                      <div className="w-12 h-12 bg-muted rounded overflow-hidden flex-shrink-0">
                        {product.images?.[0] ? (
                          <img
                            src={product.images[0]}
                            alt={product.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package className="h-6 w-6 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{product.name}</p>
                        <p className="text-sm text-muted-foreground">
                          SKU: {product.sku || "-"} • Stock: {product.stock_quantity}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">₹{product.price.toLocaleString()}</p>
                        <p className="text-sm text-muted-foreground">
                          {product.category?.name || "No category"}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                  <Package className="h-12 w-12 mb-2" />
                  <p>No products available</p>
                </div>
              )}
            </ScrollArea>
          </div>
        ) : (
          <ScrollArea className="max-h-[60vh]">
            <div className="space-y-4 pr-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label htmlFor="name">Product Name *</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter product name for store"
                  />
                </div>

                <div className="col-span-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Enter product description"
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="price">Price *</Label>
                  <Input
                    id="price"
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <Label htmlFor="discountPrice">Discount Price</Label>
                  <Input
                    id="discountPrice"
                    type="number"
                    value={discountPrice}
                    onChange={(e) => setDiscountPrice(e.target.value)}
                    placeholder="0.00"
                  />
                </div>

                <div className="col-span-2">
                  <Label htmlFor="category">Category</Label>
                  <Select value={categoryId || "none"} onValueChange={(val) => setCategoryId(val === "none" ? "" : val)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No category</SelectItem>
                      {categories?.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="sizes">Sizes (comma-separated)</Label>
                  <Input
                    id="sizes"
                    value={sizes}
                    onChange={(e) => setSizes(e.target.value)}
                    placeholder="S, M, L, XL"
                  />
                </div>

                <div>
                  <Label htmlFor="colors">Colors (comma-separated)</Label>
                  <Input
                    id="colors"
                    value={colors}
                    onChange={(e) => setColors(e.target.value)}
                    placeholder="Red, Blue, Green"
                  />
                </div>

                <div className="col-span-2 space-y-3">
                  <Label>Product Images</Label>
                  
                  {/* Upload Section */}
                  <div className="border-2 border-dashed rounded-lg p-4 text-center">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={(e) => handleImageUpload(e.target.files)}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploading}
                      className="w-full"
                    >
                      {isUploading ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Upload className="h-4 w-4 mr-2" />
                          Upload Images
                        </>
                      )}
                    </Button>
                    <p className="text-xs text-muted-foreground mt-2">
                      Click to upload or drag and drop images
                    </p>
                  </div>

                  {/* Uploaded Images Preview */}
                  {uploadedImages.length > 0 && (
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Uploaded Images</Label>
                      <div className="flex flex-wrap gap-2">
                        {uploadedImages.map((url, idx) => (
                          <div key={idx} className="relative group">
                            <img
                              src={url}
                              alt={`Uploaded ${idx + 1}`}
                              className="w-16 h-16 object-cover rounded border"
                            />
                            <button
                              type="button"
                              onClick={() => removeUploadedImage(url)}
                              className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* URL Input (Optional) */}
                  <div>
                    <Label htmlFor="images" className="text-xs text-muted-foreground">
                      Or paste image URLs (one per line)
                    </Label>
                    <Textarea
                      id="images"
                      value={images}
                      onChange={(e) => setImages(e.target.value)}
                      placeholder="https://example.com/image1.jpg"
                      rows={2}
                      className="mt-1"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="isActive">Active (visible on store)</Label>
                  <Switch
                    id="isActive"
                    checked={isActive}
                    onCheckedChange={setIsActive}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="isFeatured">Featured Product</Label>
                  <Switch
                    id="isFeatured"
                    checked={isFeatured}
                    onCheckedChange={setIsFeatured}
                  />
                </div>
              </div>
            </div>
          </ScrollArea>
        )}

        <DialogFooter>
          {step === "customize" && !editProduct && (
            <Button variant="outline" onClick={() => setStep("select")}>
              Back
            </Button>
          )}
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          {step === "customize" && (
            <Button
              onClick={handleSubmit}
              disabled={!name || !price || isSubmitting}
            >
              {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editProduct ? "Update Product" : "Add to Store"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddToStoreDialog;
