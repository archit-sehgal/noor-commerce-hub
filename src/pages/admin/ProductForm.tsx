import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import AdminLayout from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { useCategories } from "@/hooks/useCategories";
import { useCreateProduct, useUpdateProduct } from "@/hooks/useProducts";
import { useToast } from "@/hooks/use-toast";
import { Loader2, X, Plus } from "lucide-react";

const AdminProductForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data: categories } = useCategories();
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();

  const isEdit = !!id;
  const [loading, setLoading] = useState(isEdit);
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    sku: "",
    description: "",
    category_id: "",
    price: "",
    discount_price: "",
    cost_price: "",
    stock_quantity: "0",
    min_stock_alert: "5",
    fabric_type: "",
    is_active: true,
    is_featured: false,
  });
  const [sizes, setSizes] = useState<string[]>([]);
  const [colors, setColors] = useState<string[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [images, setImages] = useState<string[]>([]);
  const [newSize, setNewSize] = useState("");
  const [newColor, setNewColor] = useState("");
  const [newTag, setNewTag] = useState("");
  const [newImage, setNewImage] = useState("");

  useEffect(() => {
    if (id) {
      fetchProduct();
    }
  }, [id]);

  const fetchProduct = async () => {
    try {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;

      setFormData({
        name: data.name || "",
        slug: data.slug || "",
        sku: data.sku || "",
        description: data.description || "",
        category_id: data.category_id || "",
        price: data.price?.toString() || "",
        discount_price: data.discount_price?.toString() || "",
        cost_price: data.cost_price?.toString() || "",
        stock_quantity: data.stock_quantity?.toString() || "0",
        min_stock_alert: data.min_stock_alert?.toString() || "5",
        fabric_type: data.fabric_type || "",
        is_active: data.is_active ?? true,
        is_featured: data.is_featured ?? false,
      });
      setSizes(data.sizes || []);
      setColors(data.colors || []);
      setTags(data.tags || []);
      setImages(data.images || []);
    } catch (error: any) {
      toast({
        title: "Error loading product",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  };

  const handleNameChange = (value: string) => {
    setFormData({
      ...formData,
      name: value,
      slug: generateSlug(value),
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const productData = {
      name: formData.name,
      slug: formData.slug,
      sku: formData.sku || undefined,
      description: formData.description || undefined,
      category_id: formData.category_id || undefined,
      price: parseFloat(formData.price),
      discount_price: formData.discount_price
        ? parseFloat(formData.discount_price)
        : undefined,
      cost_price: formData.cost_price
        ? parseFloat(formData.cost_price)
        : undefined,
      stock_quantity: parseInt(formData.stock_quantity),
      min_stock_alert: parseInt(formData.min_stock_alert),
      fabric_type: formData.fabric_type || undefined,
      sizes,
      colors,
      tags,
      images,
      is_active: formData.is_active,
      is_featured: formData.is_featured,
    };

    try {
      if (isEdit) {
        await updateProduct.mutateAsync({ id, ...productData });
      } else {
        await createProduct.mutateAsync(productData);
      }
      navigate("/admin/products");
    } catch (error) {
      // Error handled by hooks
    }
  };

  const addItem = (
    value: string,
    list: string[],
    setList: (v: string[]) => void,
    setValue: (v: string) => void
  ) => {
    if (value.trim() && !list.includes(value.trim())) {
      setList([...list, value.trim()]);
      setValue("");
    }
  };

  const removeItem = (
    index: number,
    list: string[],
    setList: (v: string[]) => void
  ) => {
    setList(list.filter((_, i) => i !== index));
  };

  if (loading) {
    return (
      <AdminLayout title={isEdit ? "Edit Product" : "Add Product"}>
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-gold" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title={isEdit ? "Edit Product" : "Add Product"}>
      <form onSubmit={handleSubmit} className="max-w-4xl space-y-8">
        {/* Basic Information */}
        <div className="bg-background p-6 rounded-lg border">
          <h3 className="text-lg font-medium mb-4">Basic Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <Label htmlFor="name">Product Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleNameChange(e.target.value)}
                required
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="slug">Slug *</Label>
              <Input
                id="slug"
                value={formData.slug}
                onChange={(e) =>
                  setFormData({ ...formData, slug: e.target.value })
                }
                required
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="sku">SKU</Label>
              <Input
                id="sku"
                value={formData.sku}
                onChange={(e) =>
                  setFormData({ ...formData, sku: e.target.value })
                }
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="category">Category</Label>
              <Select
                value={formData.category_id}
                onValueChange={(value) =>
                  setFormData({ ...formData, category_id: value })
                }
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories?.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="fabric_type">Fabric Type</Label>
              <Input
                id="fabric_type"
                value={formData.fabric_type}
                onChange={(e) =>
                  setFormData({ ...formData, fabric_type: e.target.value })
                }
                className="mt-1"
                placeholder="e.g., Cotton, Silk, Georgette"
              />
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                className="mt-1"
                rows={4}
              />
            </div>
          </div>
        </div>

        {/* Pricing */}
        <div className="bg-background p-6 rounded-lg border">
          <h3 className="text-lg font-medium mb-4">Pricing</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="price">Price (₹) *</Label>
              <Input
                id="price"
                type="number"
                value={formData.price}
                onChange={(e) =>
                  setFormData({ ...formData, price: e.target.value })
                }
                required
                min="0"
                step="0.01"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="discount_price">Discount Price (₹)</Label>
              <Input
                id="discount_price"
                type="number"
                value={formData.discount_price}
                onChange={(e) =>
                  setFormData({ ...formData, discount_price: e.target.value })
                }
                min="0"
                step="0.01"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="cost_price">Cost Price (₹)</Label>
              <Input
                id="cost_price"
                type="number"
                value={formData.cost_price}
                onChange={(e) =>
                  setFormData({ ...formData, cost_price: e.target.value })
                }
                min="0"
                step="0.01"
                className="mt-1"
              />
            </div>
          </div>
        </div>

        {/* Inventory */}
        <div className="bg-background p-6 rounded-lg border">
          <h3 className="text-lg font-medium mb-4">Inventory</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="stock_quantity">Stock Quantity</Label>
              <Input
                id="stock_quantity"
                type="number"
                value={formData.stock_quantity}
                onChange={(e) =>
                  setFormData({ ...formData, stock_quantity: e.target.value })
                }
                min="0"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="min_stock_alert">Low Stock Alert Threshold</Label>
              <Input
                id="min_stock_alert"
                type="number"
                value={formData.min_stock_alert}
                onChange={(e) =>
                  setFormData({ ...formData, min_stock_alert: e.target.value })
                }
                min="0"
                className="mt-1"
              />
            </div>
          </div>
        </div>

        {/* Variants */}
        <div className="bg-background p-6 rounded-lg border">
          <h3 className="text-lg font-medium mb-4">Variants</h3>
          <div className="space-y-4">
            {/* Sizes */}
            <div>
              <Label>Sizes</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  value={newSize}
                  onChange={(e) => setNewSize(e.target.value)}
                  placeholder="Add size (e.g., S, M, L)"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addItem(newSize, sizes, setSizes, setNewSize);
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => addItem(newSize, sizes, setSizes, setNewSize)}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {sizes.map((size, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-cream rounded-full text-sm flex items-center gap-1"
                  >
                    {size}
                    <button
                      type="button"
                      onClick={() => removeItem(index, sizes, setSizes)}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* Colors */}
            <div>
              <Label>Colors</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  value={newColor}
                  onChange={(e) => setNewColor(e.target.value)}
                  placeholder="Add color"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addItem(newColor, colors, setColors, setNewColor);
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => addItem(newColor, colors, setColors, setNewColor)}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {colors.map((color, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-cream rounded-full text-sm flex items-center gap-1"
                  >
                    {color}
                    <button
                      type="button"
                      onClick={() => removeItem(index, colors, setColors)}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Images */}
        <div className="bg-background p-6 rounded-lg border">
          <h3 className="text-lg font-medium mb-4">Images</h3>
          <div className="flex gap-2">
            <Input
              value={newImage}
              onChange={(e) => setNewImage(e.target.value)}
              placeholder="Image URL"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addItem(newImage, images, setImages, setNewImage);
                }
              }}
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => addItem(newImage, images, setImages, setNewImage)}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <div className="grid grid-cols-4 gap-4 mt-4">
            {images.map((image, index) => (
              <div key={index} className="relative group">
                <img
                  src={image}
                  alt={`Product ${index + 1}`}
                  className="w-full h-24 object-cover rounded-lg"
                />
                <button
                  type="button"
                  onClick={() => removeItem(index, images, setImages)}
                  className="absolute top-1 right-1 bg-destructive text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Tags */}
        <div className="bg-background p-6 rounded-lg border">
          <h3 className="text-lg font-medium mb-4">Tags</h3>
          <div className="flex gap-2">
            <Input
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              placeholder="Add tag (e.g., Wedding Collection)"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addItem(newTag, tags, setTags, setNewTag);
                }
              }}
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => addItem(newTag, tags, setTags, setNewTag)}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex flex-wrap gap-2 mt-2">
            {tags.map((tag, index) => (
              <span
                key={index}
                className="px-3 py-1 bg-gold/20 text-gold rounded-full text-sm flex items-center gap-1"
              >
                {tag}
                <button
                  type="button"
                  onClick={() => removeItem(index, tags, setTags)}
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
        </div>

        {/* Status */}
        <div className="bg-background p-6 rounded-lg border">
          <h3 className="text-lg font-medium mb-4">Status</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Active</Label>
                <p className="text-sm text-muted-foreground">
                  Product will be visible on the store
                </p>
              </div>
              <Switch
                checked={formData.is_active}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, is_active: checked })
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>Featured</Label>
                <p className="text-sm text-muted-foreground">
                  Show on homepage featured section
                </p>
              </div>
              <Switch
                checked={formData.is_featured}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, is_featured: checked })
                }
              />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-4">
          <Button
            type="submit"
            className="bg-charcoal hover:bg-charcoal/90 text-cream"
            disabled={createProduct.isPending || updateProduct.isPending}
          >
            {(createProduct.isPending || updateProduct.isPending) && (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            )}
            {isEdit ? "Update Product" : "Create Product"}
          </Button>
          <Button type="button" variant="outline" onClick={() => navigate(-1)}>
            Cancel
          </Button>
        </div>
      </form>
    </AdminLayout>
  );
};

export default AdminProductForm;
