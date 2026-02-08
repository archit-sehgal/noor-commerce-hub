import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Search, Scissors, Loader2 } from "lucide-react";

interface OrderItem {
  id: string;
  product_name: string;
  product_sku: string | null;
  quantity: number;
  size: string | null;
  color: string | null;
}

interface OrderOption {
  id: string;
  order_number: string;
  customer_name: string;
  customer_phone: string | null;
  items: OrderItem[];
}

const NewAlterationForm = () => {
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [orderSearch, setOrderSearch] = useState("");
  const [selectedOrderId, setSelectedOrderId] = useState<string>("");
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [dueDate, setDueDate] = useState("");
  const [notes, setNotes] = useState("");

  // Fetch orders that don't already have alterations
  const { data: orders, isLoading: ordersLoading } = useQuery({
    queryKey: ["orders-for-alteration", orderSearch],
    queryFn: async () => {
      let query = supabase
        .from("orders")
        .select(`
          id,
          order_number,
          customer:customers(name, phone),
          order_items(id, product_name, product_sku, quantity, size, color)
        `)
        .order("created_at", { ascending: false })
        .limit(20);

      if (orderSearch.trim()) {
        query = query.or(
          `order_number.ilike.%${orderSearch}%`
        );
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []).map((o: any) => ({
        id: o.id,
        order_number: o.order_number,
        customer_name: o.customer?.name || "Walk-in",
        customer_phone: o.customer?.phone || null,
        items: o.order_items || [],
      })) as OrderOption[];
    },
    enabled: isOpen,
  });

  const selectedOrder = orders?.find((o) => o.id === selectedOrderId);

  const createAlterationMutation = useMutation({
    mutationFn: async () => {
      if (!selectedOrderId) throw new Error("Please select an order");
      if (selectedItems.length === 0) throw new Error("Please select at least one item");
      if (!dueDate) throw new Error("Please set a due date");

      // Build alteration notes with selected items
      const order = orders?.find((o) => o.id === selectedOrderId);
      const itemDetails = order?.items
        .filter((item) => selectedItems.includes(item.id))
        .map(
          (item) =>
            `${item.product_name}${item.size ? ` (${item.size})` : ""}${item.color ? ` - ${item.color}` : ""}`
        )
        .join(", ");

      const fullNotes = `Items: ${itemDetails}${notes ? `\nNotes: ${notes}` : ""}`;

      const { error } = await supabase
        .from("orders")
        .update({
          needs_alteration: true,
          alteration_status: "pending",
          alteration_due_date: new Date(dueDate).toISOString(),
          alteration_notes: fullNotes,
        })
        .eq("id", selectedOrderId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Alteration created successfully");
      queryClient.invalidateQueries({ queryKey: ["alteration-orders"] });
      resetForm();
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const resetForm = () => {
    setSelectedOrderId("");
    setSelectedItems([]);
    setDueDate("");
    setNotes("");
    setOrderSearch("");
    setIsOpen(false);
  };

  const toggleItem = (itemId: string) => {
    setSelectedItems((prev) =>
      prev.includes(itemId) ? prev.filter((id) => id !== itemId) : [...prev, itemId]
    );
  };

  const selectAllItems = () => {
    if (!selectedOrder) return;
    if (selectedItems.length === selectedOrder.items.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(selectedOrder.items.map((i) => i.id));
    }
  };

  if (!isOpen) {
    return (
      <Button onClick={() => setIsOpen(true)} className="bg-gold hover:bg-gold-dark text-white">
        <Plus className="h-4 w-4 mr-2" />
        New Alteration
      </Button>
    );
  }

  return (
    <Card className="border-gold/20">
      <CardHeader className="bg-gradient-to-r from-cream to-cream-dark border-b border-gold/10">
        <CardTitle className="font-display text-lg flex items-center gap-2">
          <Scissors className="h-5 w-5 text-gold" />
          New Alteration
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 space-y-4">
        {/* Order Search & Select */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Select Order</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by order number..."
              value={orderSearch}
              onChange={(e) => {
                setOrderSearch(e.target.value);
                setSelectedOrderId("");
                setSelectedItems([]);
              }}
              className="pl-9 border-gold/20"
            />
          </div>
          {ordersLoading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading orders...
            </div>
          ) : (
            <Select value={selectedOrderId} onValueChange={(val) => {
              setSelectedOrderId(val);
              setSelectedItems([]);
            }}>
              <SelectTrigger className="border-gold/20">
                <SelectValue placeholder="Choose an order" />
              </SelectTrigger>
              <SelectContent>
                {orders?.map((order) => (
                  <SelectItem key={order.id} value={order.id}>
                    {order.order_number} — {order.customer_name}
                    {order.customer_phone ? ` (${order.customer_phone})` : ""}
                  </SelectItem>
                ))}
                {orders?.length === 0 && (
                  <div className="px-3 py-2 text-sm text-muted-foreground">No orders found</div>
                )}
              </SelectContent>
            </Select>
          )}
        </div>

        {/* Item Selection */}
        {selectedOrder && selectedOrder.items.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Select Items for Alteration</Label>
              <Button
                variant="ghost"
                size="sm"
                className="text-xs h-7"
                onClick={selectAllItems}
              >
                {selectedItems.length === selectedOrder.items.length
                  ? "Deselect All"
                  : "Select All"}
              </Button>
            </div>
            <div className="border border-gold/10 rounded-lg divide-y divide-gold/10">
              {selectedOrder.items.map((item) => (
                <label
                  key={item.id}
                  className="flex items-center gap-3 p-3 cursor-pointer hover:bg-muted/50 transition-colors"
                >
                  <Checkbox
                    checked={selectedItems.includes(item.id)}
                    onCheckedChange={() => toggleItem(item.id)}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.product_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {[
                        item.product_sku && `SKU: ${item.product_sku}`,
                        item.size && `Size: ${item.size}`,
                        item.color && `Color: ${item.color}`,
                        `Qty: ${item.quantity}`,
                      ]
                        .filter(Boolean)
                        .join(" • ")}
                    </p>
                  </div>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Due Date */}
        <div className="space-y-2">
          <Label htmlFor="due-date" className="text-sm font-medium">
            Due Date
          </Label>
          <Input
            id="due-date"
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="border-gold/20"
            min={new Date().toISOString().split("T")[0]}
          />
        </div>

        {/* Notes */}
        <div className="space-y-2">
          <Label htmlFor="alt-notes" className="text-sm font-medium">
            Alteration Details / Notes
          </Label>
          <Textarea
            id="alt-notes"
            placeholder="Enter alteration details (e.g., shorten sleeves, adjust waist, etc.)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="border-gold/20 min-h-[80px]"
          />
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <Button
            onClick={() => createAlterationMutation.mutate()}
            disabled={
              !selectedOrderId ||
              selectedItems.length === 0 ||
              !dueDate ||
              createAlterationMutation.isPending
            }
            className="bg-gold hover:bg-gold-dark text-white flex-1"
          >
            {createAlterationMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Scissors className="h-4 w-4 mr-2" />
                Create Alteration
              </>
            )}
          </Button>
          <Button variant="outline" onClick={resetForm} className="border-gold/20">
            Cancel
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default NewAlterationForm;
