import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Truck, Package, Trash2, Eye, Upload, X, ChevronLeft } from "lucide-react";
import { format } from "date-fns";

interface Supplier {
  id: string;
  name: string;
  contact_person: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  city: string | null;
  gst_number: string | null;
  is_active: boolean;
  total_purchases: number;
}

interface PurchaseItem {
  sno: number;
  item_name: string;
  hsn_code: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

const Purchases = () => {
  const queryClient = useQueryClient();
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [isAddSupplierOpen, setIsAddSupplierOpen] = useState(false);
  const [isAddPurchaseOpen, setIsAddPurchaseOpen] = useState(false);
  const [viewingPurchase, setViewingPurchase] = useState<any>(null);

  // Supplier form state
  const [supplierForm, setSupplierForm] = useState({
    name: "",
    contact_person: "",
    phone: "",
    email: "",
    address: "",
    city: "",
    gst_number: "",
  });

  // Purchase form state
  const [purchaseForm, setPurchaseForm] = useState({
    purchase_date: new Date().toISOString().split("T")[0],
    notes: "",
  });
  const [purchaseItems, setPurchaseItems] = useState<PurchaseItem[]>([
    { sno: 1, item_name: "", hsn_code: "", quantity: 1, unit_price: 0, total_price: 0 },
  ]);
  const [billImage, setBillImage] = useState<File | null>(null);

  // Fetch suppliers
  const { data: suppliers, isLoading: loadingSuppliers } = useQuery({
    queryKey: ["suppliers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("suppliers")
        .select("*")
        .order("name");
      if (error) throw error;
      return data as Supplier[];
    },
  });

  // Fetch purchases for selected supplier
  const { data: purchases, isLoading: loadingPurchases } = useQuery({
    queryKey: ["purchases", selectedSupplier?.id],
    queryFn: async () => {
      if (!selectedSupplier) return [];
      const { data, error } = await supabase
        .from("purchases")
        .select("*")
        .eq("supplier_id", selectedSupplier.id)
        .order("purchase_date", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!selectedSupplier,
  });

  // Fetch purchase items for viewing
  const { data: purchaseItemsData } = useQuery({
    queryKey: ["purchase-items", viewingPurchase?.id],
    queryFn: async () => {
      if (!viewingPurchase) return [];
      const { data, error } = await supabase
        .from("purchase_items")
        .select("*")
        .eq("purchase_id", viewingPurchase.id)
        .order("sno");
      if (error) throw error;
      return data;
    },
    enabled: !!viewingPurchase,
  });

  // Add supplier mutation
  const addSupplierMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("suppliers").insert(supplierForm);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Supplier added");
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
      setIsAddSupplierOpen(false);
      setSupplierForm({
        name: "",
        contact_person: "",
        phone: "",
        email: "",
        address: "",
        city: "",
        gst_number: "",
      });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // Add purchase mutation
  const addPurchaseMutation = useMutation({
    mutationFn: async () => {
      if (!selectedSupplier) throw new Error("No supplier selected");

      const totalAmount = purchaseItems.reduce((sum, item) => sum + item.total_price, 0);
      const purchaseNumber = `PUR-${Date.now()}`;

      let billImageUrl = null;

      // Upload bill image if provided
      if (billImage) {
        const fileExt = billImage.name.split(".").pop();
        const fileName = `${purchaseNumber}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from("purchase-bills")
          .upload(fileName, billImage);
        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from("purchase-bills")
          .getPublicUrl(fileName);
        billImageUrl = urlData.publicUrl;
      }

      // Insert purchase
      const { data: purchaseData, error: purchaseError } = await supabase
        .from("purchases")
        .insert({
          supplier_id: selectedSupplier.id,
          purchase_number: purchaseNumber,
          purchase_date: purchaseForm.purchase_date,
          total_amount: totalAmount,
          notes: purchaseForm.notes,
          bill_image_url: billImageUrl,
        })
        .select()
        .single();

      if (purchaseError) throw purchaseError;

      // Insert purchase items
      const itemsToInsert = purchaseItems.map((item) => ({
        purchase_id: purchaseData.id,
        ...item,
      }));

      const { error: itemsError } = await supabase
        .from("purchase_items")
        .insert(itemsToInsert);

      if (itemsError) throw itemsError;

      // Update supplier total
      await supabase
        .from("suppliers")
        .update({
          total_purchases: (selectedSupplier.total_purchases || 0) + totalAmount,
        })
        .eq("id", selectedSupplier.id);
    },
    onSuccess: () => {
      toast.success("Purchase recorded");
      queryClient.invalidateQueries({ queryKey: ["purchases"] });
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
      setIsAddPurchaseOpen(false);
      setPurchaseForm({ purchase_date: new Date().toISOString().split("T")[0], notes: "" });
      setPurchaseItems([{ sno: 1, item_name: "", hsn_code: "", quantity: 1, unit_price: 0, total_price: 0 }]);
      setBillImage(null);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // Delete supplier mutation
  const deleteSupplierMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("suppliers").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Supplier deleted");
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
      setSelectedSupplier(null);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const addPurchaseItem = () => {
    setPurchaseItems([
      ...purchaseItems,
      { sno: purchaseItems.length + 1, item_name: "", hsn_code: "", quantity: 1, unit_price: 0, total_price: 0 },
    ]);
  };

  const updatePurchaseItem = (index: number, field: keyof PurchaseItem, value: any) => {
    const updated = [...purchaseItems];
    updated[index] = { ...updated[index], [field]: value };
    if (field === "quantity" || field === "unit_price") {
      updated[index].total_price = updated[index].quantity * updated[index].unit_price;
    }
    setPurchaseItems(updated);
  };

  const removePurchaseItem = (index: number) => {
    if (purchaseItems.length === 1) return;
    const updated = purchaseItems.filter((_, i) => i !== index).map((item, i) => ({ ...item, sno: i + 1 }));
    setPurchaseItems(updated);
  };

  return (
    <AdminLayout title="Purchases">
      <div className="space-y-6">
        {selectedSupplier ? (
          // Supplier Detail View
          <>
            <div className="flex items-center justify-between">
              <Button
                variant="ghost"
                onClick={() => setSelectedSupplier(null)}
                className="gap-2"
              >
                <ChevronLeft className="h-4 w-4" />
                Back to Suppliers
              </Button>
              <Dialog open={isAddPurchaseOpen} onOpenChange={setIsAddPurchaseOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-gold hover:bg-gold-dark text-charcoal gap-2">
                    <Plus className="h-4 w-4" />
                    Add Purchase
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle className="font-display text-xl">Add Purchase from {selectedSupplier.name}</DialogTitle>
                    <DialogDescription>Record a new purchase from this supplier</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-6 py-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Purchase Date</Label>
                        <Input
                          type="date"
                          value={purchaseForm.purchase_date}
                          onChange={(e) => setPurchaseForm({ ...purchaseForm, purchase_date: e.target.value })}
                          className="border-gold/20"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Bill Image</Label>
                        <div className="flex items-center gap-2">
                          <Input
                            type="file"
                            accept="image/*"
                            onChange={(e) => setBillImage(e.target.files?.[0] || null)}
                            className="border-gold/20"
                          />
                          {billImage && (
                            <Button variant="ghost" size="icon" onClick={() => setBillImage(null)}>
                              <X className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Notes</Label>
                      <Textarea
                        value={purchaseForm.notes}
                        onChange={(e) => setPurchaseForm({ ...purchaseForm, notes: e.target.value })}
                        placeholder="Any notes about this purchase..."
                        className="border-gold/20"
                      />
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <Label className="text-base font-display">Purchase Items</Label>
                        <Button type="button" variant="outline" size="sm" onClick={addPurchaseItem} className="gap-1">
                          <Plus className="h-3 w-3" />
                          Add Item
                        </Button>
                      </div>

                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-12">S.No</TableHead>
                            <TableHead>Item Name</TableHead>
                            <TableHead>HSN Code</TableHead>
                            <TableHead className="w-20">Qty</TableHead>
                            <TableHead className="w-28">Unit Price</TableHead>
                            <TableHead className="w-28">Total</TableHead>
                            <TableHead className="w-12"></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {purchaseItems.map((item, index) => (
                            <TableRow key={index}>
                              <TableCell>{item.sno}</TableCell>
                              <TableCell>
                                <Input
                                  value={item.item_name}
                                  onChange={(e) => updatePurchaseItem(index, "item_name", e.target.value)}
                                  placeholder="Item name"
                                  className="border-gold/20"
                                />
                              </TableCell>
                              <TableCell>
                                <Input
                                  value={item.hsn_code}
                                  onChange={(e) => updatePurchaseItem(index, "hsn_code", e.target.value)}
                                  placeholder="HSN"
                                  className="border-gold/20"
                                />
                              </TableCell>
                              <TableCell>
                                <Input
                                  type="number"
                                  min="1"
                                  value={item.quantity}
                                  onChange={(e) => updatePurchaseItem(index, "quantity", parseInt(e.target.value) || 1)}
                                  className="border-gold/20"
                                />
                              </TableCell>
                              <TableCell>
                                <Input
                                  type="number"
                                  min="0"
                                  value={item.unit_price}
                                  onChange={(e) => updatePurchaseItem(index, "unit_price", parseFloat(e.target.value) || 0)}
                                  className="border-gold/20"
                                />
                              </TableCell>
                              <TableCell className="font-medium">₹{item.total_price.toFixed(2)}</TableCell>
                              <TableCell>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => removePurchaseItem(index)}
                                  disabled={purchaseItems.length === 1}
                                >
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>

                      <div className="text-right">
                        <p className="text-lg font-bold">
                          Total: ₹{purchaseItems.reduce((sum, item) => sum + item.total_price, 0).toFixed(2)}
                        </p>
                      </div>
                    </div>

                    <Button
                      onClick={() => addPurchaseMutation.mutate()}
                      disabled={addPurchaseMutation.isPending || !purchaseItems[0].item_name}
                      className="w-full bg-gold hover:bg-gold-dark text-charcoal"
                    >
                      {addPurchaseMutation.isPending ? "Saving..." : "Save Purchase"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <Card className="border-gold/20">
              <CardHeader className="bg-gradient-to-r from-cream to-cream-dark border-b border-gold/10">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-gold/10 rounded-lg">
                    <Truck className="h-6 w-6 text-gold" />
                  </div>
                  <div>
                    <CardTitle className="font-display text-xl">{selectedSupplier.name}</CardTitle>
                    <CardDescription>
                      {selectedSupplier.phone} {selectedSupplier.email && `• ${selectedSupplier.email}`}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {loadingPurchases ? (
                  <div className="text-center py-12 text-muted-foreground">Loading...</div>
                ) : purchases && purchases.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow className="border-gold/10">
                        <TableHead>Purchase #</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Notes</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {purchases.map((purchase) => (
                        <TableRow key={purchase.id} className="border-gold/10">
                          <TableCell className="font-medium">{purchase.purchase_number}</TableCell>
                          <TableCell>{format(new Date(purchase.purchase_date), "dd MMM yyyy")}</TableCell>
                          <TableCell className="font-bold">₹{purchase.total_amount?.toFixed(2)}</TableCell>
                          <TableCell className="max-w-[200px] truncate">{purchase.notes || "—"}</TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setViewingPurchase(purchase)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-12 space-y-4">
                    <div className="w-16 h-16 mx-auto bg-gold/10 rounded-full flex items-center justify-center">
                      <Package className="h-8 w-8 text-gold" />
                    </div>
                    <div>
                      <p className="font-medium text-lg">No purchases yet</p>
                      <p className="text-muted-foreground">Add your first purchase from this supplier</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* View Purchase Dialog */}
            <Dialog open={!!viewingPurchase} onOpenChange={() => setViewingPurchase(null)}>
              <DialogContent className="max-w-3xl">
                <DialogHeader>
                  <DialogTitle className="font-display text-xl">
                    Purchase: {viewingPurchase?.purchase_number}
                  </DialogTitle>
                  <DialogDescription>
                    {viewingPurchase && format(new Date(viewingPurchase.purchase_date), "dd MMMM yyyy")}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  {viewingPurchase?.bill_image_url && (
                    <div className="space-y-2">
                      <Label>Bill Image</Label>
                      <img
                        src={viewingPurchase.bill_image_url}
                        alt="Bill"
                        className="max-h-48 rounded-lg border"
                      />
                    </div>
                  )}
                  {viewingPurchase?.notes && (
                    <div className="space-y-2">
                      <Label>Notes</Label>
                      <p className="text-muted-foreground">{viewingPurchase.notes}</p>
                    </div>
                  )}
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>S.No</TableHead>
                        <TableHead>Item Name</TableHead>
                        <TableHead>HSN Code</TableHead>
                        <TableHead>Qty</TableHead>
                        <TableHead>Unit Price</TableHead>
                        <TableHead>Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {purchaseItemsData?.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>{item.sno}</TableCell>
                          <TableCell>{item.item_name}</TableCell>
                          <TableCell>{item.hsn_code || "—"}</TableCell>
                          <TableCell>{item.quantity}</TableCell>
                          <TableCell>₹{item.unit_price?.toFixed(2)}</TableCell>
                          <TableCell className="font-bold">₹{item.total_price?.toFixed(2)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  <div className="text-right border-t pt-4">
                    <p className="text-xl font-bold">Total: ₹{viewingPurchase?.total_amount?.toFixed(2)}</p>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </>
        ) : (
          // Suppliers List View
          <Card className="border-gold/20">
            <CardHeader className="bg-gradient-to-r from-cream to-cream-dark border-b border-gold/10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gold/10 rounded-lg">
                    <Truck className="h-5 w-5 text-gold" />
                  </div>
                  <div>
                    <CardTitle className="font-display text-xl">Suppliers</CardTitle>
                    <CardDescription>Manage your suppliers and their purchases</CardDescription>
                  </div>
                </div>
                <Dialog open={isAddSupplierOpen} onOpenChange={setIsAddSupplierOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-gold hover:bg-gold-dark text-charcoal gap-2">
                      <Plus className="h-4 w-4" />
                      Add Supplier
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle className="font-display text-xl">Add New Supplier</DialogTitle>
                      <DialogDescription>Enter supplier details</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Supplier Name *</Label>
                          <Input
                            value={supplierForm.name}
                            onChange={(e) => setSupplierForm({ ...supplierForm, name: e.target.value })}
                            placeholder="Company name"
                            className="border-gold/20"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Contact Person</Label>
                          <Input
                            value={supplierForm.contact_person}
                            onChange={(e) => setSupplierForm({ ...supplierForm, contact_person: e.target.value })}
                            placeholder="Contact name"
                            className="border-gold/20"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Phone</Label>
                          <Input
                            value={supplierForm.phone}
                            onChange={(e) => setSupplierForm({ ...supplierForm, phone: e.target.value })}
                            placeholder="Phone number"
                            className="border-gold/20"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Email</Label>
                          <Input
                            type="email"
                            value={supplierForm.email}
                            onChange={(e) => setSupplierForm({ ...supplierForm, email: e.target.value })}
                            placeholder="email@example.com"
                            className="border-gold/20"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>City</Label>
                          <Input
                            value={supplierForm.city}
                            onChange={(e) => setSupplierForm({ ...supplierForm, city: e.target.value })}
                            placeholder="City"
                            className="border-gold/20"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>GST Number</Label>
                          <Input
                            value={supplierForm.gst_number}
                            onChange={(e) => setSupplierForm({ ...supplierForm, gst_number: e.target.value })}
                            placeholder="GST number"
                            className="border-gold/20"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Address</Label>
                        <Textarea
                          value={supplierForm.address}
                          onChange={(e) => setSupplierForm({ ...supplierForm, address: e.target.value })}
                          placeholder="Full address"
                          className="border-gold/20"
                        />
                      </div>
                      <Button
                        onClick={() => addSupplierMutation.mutate()}
                        disabled={addSupplierMutation.isPending || !supplierForm.name}
                        className="w-full bg-gold hover:bg-gold-dark text-charcoal"
                      >
                        {addSupplierMutation.isPending ? "Adding..." : "Add Supplier"}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {loadingSuppliers ? (
                <div className="text-center py-12 text-muted-foreground">Loading...</div>
              ) : suppliers && suppliers.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow className="border-gold/10">
                      <TableHead>Supplier Name</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>City</TableHead>
                      <TableHead>Total Purchases</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {suppliers.map((supplier) => (
                      <TableRow
                        key={supplier.id}
                        className="border-gold/10 cursor-pointer hover:bg-cream/50"
                        onClick={() => setSelectedSupplier(supplier)}
                      >
                        <TableCell className="font-medium">{supplier.name}</TableCell>
                        <TableCell>{supplier.contact_person || "—"}</TableCell>
                        <TableCell>{supplier.phone || "—"}</TableCell>
                        <TableCell>{supplier.city || "—"}</TableCell>
                        <TableCell className="font-bold">₹{(supplier.total_purchases || 0).toFixed(2)}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (confirm("Delete this supplier?")) {
                                deleteSupplierMutation.mutate(supplier.id);
                              }
                            }}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-12 space-y-4">
                  <div className="w-16 h-16 mx-auto bg-gold/10 rounded-full flex items-center justify-center">
                    <Truck className="h-8 w-8 text-gold" />
                  </div>
                  <div>
                    <p className="font-medium text-lg">No suppliers yet</p>
                    <p className="text-muted-foreground">Add your first supplier to start tracking purchases</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </AdminLayout>
  );
};

export default Purchases;
