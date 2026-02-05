import { useState, useEffect } from "react";
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
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

interface EditOrderDialogProps {
  orderId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOrderUpdated: () => void;
}

const EditOrderDialog = ({
  orderId,
  open,
  onOpenChange,
  onOrderUpdated,
}: EditOrderDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [orderNumber, setOrderNumber] = useState("");
  const [subtotal, setSubtotal] = useState("");
  const [discountAmount, setDiscountAmount] = useState("");
  const [taxAmount, setTaxAmount] = useState("");
  const [shippingAmount, setShippingAmount] = useState("");
  const [totalAmount, setTotalAmount] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    if (orderId && open) {
      fetchOrder();
    }
  }, [orderId, open]);

  const fetchOrder = async () => {
    if (!orderId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .eq("id", orderId)
        .single();

      if (error) throw error;

      setOrderNumber(data.order_number);
      setSubtotal(String(data.subtotal));
      setDiscountAmount(String(data.discount_amount || 0));
      setTaxAmount(String(data.tax_amount || 0));
      setShippingAmount(String(data.shipping_amount || 0));
      setTotalAmount(String(data.total_amount));
    } catch (error) {
      console.error("Error fetching order:", error);
      toast({
        title: "Error",
        description: "Failed to fetch order details",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!orderId) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from("orders")
        .update({
          order_number: orderNumber,
          subtotal: parseFloat(subtotal) || 0,
          discount_amount: parseFloat(discountAmount) || 0,
          tax_amount: parseFloat(taxAmount) || 0,
          shipping_amount: parseFloat(shippingAmount) || 0,
          total_amount: parseFloat(totalAmount) || 0,
        })
        .eq("id", orderId);

      if (error) throw error;

      toast({ title: "Success", description: "Order updated successfully" });
      onOrderUpdated();
      onOpenChange(false);
    } catch (error) {
      console.error("Error updating order:", error);
      toast({
        title: "Error",
        description: "Failed to update order",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-serif">Edit Order (Record Only)</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="orderNumber">Order Number</Label>
              <Input
                id="orderNumber"
                value={orderNumber}
                onChange={(e) => setOrderNumber(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="subtotal">Subtotal (₹)</Label>
                <Input
                  id="subtotal"
                  type="number"
                  value={subtotal}
                  onChange={(e) => setSubtotal(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="discount">Discount (₹)</Label>
                <Input
                  id="discount"
                  type="number"
                  value={discountAmount}
                  onChange={(e) => setDiscountAmount(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tax">Tax (₹)</Label>
                <Input
                  id="tax"
                  type="number"
                  value={taxAmount}
                  onChange={(e) => setTaxAmount(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="shipping">Shipping (₹)</Label>
                <Input
                  id="shipping"
                  type="number"
                  value={shippingAmount}
                  onChange={(e) => setShippingAmount(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="total">Total Amount (₹)</Label>
              <Input
                id="total"
                type="number"
                value={totalAmount}
                onChange={(e) => setTotalAmount(e.target.value)}
                className="font-bold text-lg"
              />
            </div>

            <p className="text-xs text-muted-foreground">
              * These changes are for record-keeping only and won't affect linked invoices or inventory.
            </p>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EditOrderDialog;
