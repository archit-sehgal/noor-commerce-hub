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

interface EditInvoiceDialogProps {
  invoiceId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onInvoiceUpdated: () => void;
}

const EditInvoiceDialog = ({
  invoiceId,
  open,
  onOpenChange,
  onInvoiceUpdated,
}: EditInvoiceDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [subtotal, setSubtotal] = useState("");
  const [discountAmount, setDiscountAmount] = useState("");
  const [taxAmount, setTaxAmount] = useState("");
  const [totalAmount, setTotalAmount] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    if (invoiceId && open) {
      fetchInvoice();
    }
  }, [invoiceId, open]);

  const fetchInvoice = async () => {
    if (!invoiceId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("invoices")
        .select("*")
        .eq("id", invoiceId)
        .single();

      if (error) throw error;

      setInvoiceNumber(data.invoice_number);
      setSubtotal(String(data.subtotal));
      setDiscountAmount(String(data.discount_amount || 0));
      setTaxAmount(String(data.tax_amount || 0));
      setTotalAmount(String(data.total_amount));
    } catch (error) {
      console.error("Error fetching invoice:", error);
      toast({
        title: "Error",
        description: "Failed to fetch invoice details",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!invoiceId) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from("invoices")
        .update({
          invoice_number: invoiceNumber,
          subtotal: parseFloat(subtotal) || 0,
          discount_amount: parseFloat(discountAmount) || 0,
          tax_amount: parseFloat(taxAmount) || 0,
          total_amount: parseFloat(totalAmount) || 0,
        })
        .eq("id", invoiceId);

      if (error) throw error;

      toast({ title: "Success", description: "Invoice updated successfully" });
      onInvoiceUpdated();
      onOpenChange(false);
    } catch (error) {
      console.error("Error updating invoice:", error);
      toast({
        title: "Error",
        description: "Failed to update invoice",
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
          <DialogTitle className="font-serif">Edit Invoice (Record Only)</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="invoiceNumber">Invoice Number</Label>
              <Input
                id="invoiceNumber"
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
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
                <Label htmlFor="total">Total Amount (₹)</Label>
                <Input
                  id="total"
                  type="number"
                  value={totalAmount}
                  onChange={(e) => setTotalAmount(e.target.value)}
                  className="font-bold text-lg"
                />
              </div>
            </div>

            <p className="text-xs text-muted-foreground">
              * These changes are for record-keeping only and won't affect linked orders.
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

export default EditInvoiceDialog;
