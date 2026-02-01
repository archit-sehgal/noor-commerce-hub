import { useEffect, useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
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
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import {
  Plus,
  Loader2,
  Edit2,
  Trash2,
  Search,
  UserCheck,
  TrendingUp,
  IndianRupee,
  ShoppingBag,
  Eye,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Salesman {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  is_active: boolean;
  total_sales: number;
  total_orders: number;
  commission_rate: number;
  created_at: string;
}

interface SalesRecord {
  id: string;
  order_number: string;
  total_amount: number;
  created_at: string;
  customer_name: string | null;
  payment_status: string;
}

const AdminSalesman = () => {
  const [salesmen, setSalesmen] = useState<Salesman[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showDialog, setShowDialog] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [selectedSalesman, setSelectedSalesman] = useState<Salesman | null>(null);
  const [salesRecords, setSalesRecords] = useState<SalesRecord[]>([]);
  const [loadingRecords, setLoadingRecords] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    is_active: true,
    commission_rate: 0,
  });
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchSalesmen();
  }, []);

  const fetchSalesmen = async () => {
    try {
      const { data, error } = await supabase
        .from("salesman")
        .select("*")
        .order("name");

      if (error) throw error;
      setSalesmen(data || []);
    } catch (error) {
      console.error("Error fetching salesmen:", error);
      toast({
        title: "Error",
        description: "Failed to fetch salesmen",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchSalesRecords = async (salesmanId: string) => {
    setLoadingRecords(true);
    try {
      const { data, error } = await supabase
        .from("orders")
        .select(`
          id,
          order_number,
          total_amount,
          created_at,
          payment_status,
          customers (name)
        `)
        .eq("salesman_id", salesmanId)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;

      const records: SalesRecord[] = (data || []).map((order: any) => ({
        id: order.id,
        order_number: order.order_number,
        total_amount: order.total_amount,
        created_at: order.created_at,
        customer_name: order.customers?.name || null,
        payment_status: order.payment_status,
      }));

      setSalesRecords(records);
    } catch (error) {
      console.error("Error fetching sales records:", error);
    } finally {
      setLoadingRecords(false);
    }
  };

  const handleViewDetails = (salesman: Salesman) => {
    setSelectedSalesman(salesman);
    fetchSalesRecords(salesman.id);
    setShowDetailsDialog(true);
  };

  const handleEdit = (salesman: Salesman) => {
    setEditingId(salesman.id);
    setFormData({
      name: salesman.name,
      phone: salesman.phone || "",
      email: salesman.email || "",
      is_active: salesman.is_active,
      commission_rate: Number(salesman.commission_rate) || 0,
    });
    setShowDialog(true);
  };

  const handleAddNew = () => {
    setEditingId(null);
    setFormData({ name: "", phone: "", email: "", is_active: true, commission_rate: 0 });
    setShowDialog(true);
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      toast({
        title: "Error",
        description: "Name is required",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    try {
      if (editingId) {
        const { error } = await supabase
          .from("salesman")
          .update({
            name: formData.name.trim(),
            phone: formData.phone.trim() || null,
            email: formData.email.trim() || null,
            is_active: formData.is_active,
            commission_rate: formData.commission_rate,
          })
          .eq("id", editingId);

        if (error) throw error;
        toast({ title: "Success", description: "Salesman updated successfully" });
      } else {
        const { error } = await supabase.from("salesman").insert({
          name: formData.name.trim(),
          phone: formData.phone.trim() || null,
          email: formData.email.trim() || null,
          is_active: formData.is_active,
          commission_rate: formData.commission_rate,
        });

        if (error) throw error;
        toast({ title: "Success", description: "Salesman added successfully" });
      }

      setShowDialog(false);
      fetchSalesmen();
    } catch (error) {
      console.error("Error saving salesman:", error);
      toast({
        title: "Error",
        description: "Failed to save salesman",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this salesman?")) return;

    try {
      const { error } = await supabase.from("salesman").delete().eq("id", id);
      if (error) throw error;

      toast({ title: "Success", description: "Salesman deleted successfully" });
      fetchSalesmen();
    } catch (error) {
      console.error("Error deleting salesman:", error);
      toast({
        title: "Error",
        description: "Failed to delete salesman",
        variant: "destructive",
      });
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(amount);
  };

  const filteredSalesmen = salesmen.filter(
    (s) =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.phone?.includes(searchQuery) ||
      s.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Calculate totals
  const totalSalesmen = salesmen.length;
  const activeSalesmen = salesmen.filter((s) => s.is_active).length;
  const totalRevenue = salesmen.reduce((sum, s) => sum + Number(s.total_sales || 0), 0);
  const totalOrders = salesmen.reduce((sum, s) => sum + (s.total_orders || 0), 0);

  return (
    <AdminLayout title="Salesman Management">
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-background p-4 rounded-lg shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <UserCheck className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-foreground">Total Salesmen</p>
              <p className="text-2xl font-semibold">{totalSalesmen}</p>
            </div>
          </div>
        </div>
        <div className="bg-background p-4 rounded-lg shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <TrendingUp className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-foreground">Active</p>
              <p className="text-2xl font-semibold">{activeSalesmen}</p>
            </div>
          </div>
        </div>
        <div className="bg-background p-4 rounded-lg shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gold/20 rounded-lg">
              <IndianRupee className="h-5 w-5 text-gold" />
            </div>
            <div>
              <p className="text-sm text-foreground">Total Revenue</p>
              <p className="text-2xl font-semibold">{formatCurrency(totalRevenue)}</p>
            </div>
          </div>
        </div>
        <div className="bg-background p-4 rounded-lg shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <ShoppingBag className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-foreground">Total Orders</p>
              <p className="text-2xl font-semibold">{totalOrders}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground" />
          <Input
            placeholder="Search by name, phone, or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button onClick={handleAddNew}>
          <Plus className="h-4 w-4 mr-2" />
          Add Salesman
        </Button>
      </div>

      {/* Salesmen */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : filteredSalesmen.length === 0 ? (
        <div className="text-center py-12 bg-background rounded-lg shadow-sm">
          <UserCheck className="h-12 w-12 text-foreground mx-auto mb-4" />
          <p className="text-foreground">No salesmen found</p>
        </div>
      ) : (
        <>
          {/* Mobile Card View */}
          <div className="lg:hidden space-y-3">
            {filteredSalesmen.map((salesman) => (
              <div
                key={salesman.id}
                className="bg-card border border-border rounded-lg p-4 shadow-sm"
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <p className="font-semibold">{salesman.name}</p>
                    <p className="text-sm text-foreground">{salesman.phone || salesman.email || "No contact"}</p>
                  </div>
                  <Badge variant={salesman.is_active ? "default" : "secondary"}>
                    {salesman.is_active ? "Active" : "Inactive"}
                  </Badge>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm mb-3">
                  <div>
                    <p className="text-foreground">Commission Rate</p>
                    <p className="font-medium">{Number(salesman.commission_rate || 0)}%</p>
                  </div>
                  <div>
                    <p className="text-foreground">Total Sales</p>
                    <p className="font-semibold text-primary">{formatCurrency(Number(salesman.total_sales || 0))}</p>
                  </div>
                  <div>
                    <p className="text-foreground">Commission Earned</p>
                    <p className="font-semibold text-green-600">
                      {formatCurrency((Number(salesman.total_sales || 0) * Number(salesman.commission_rate || 0)) / 100)}
                    </p>
                  </div>
                  <div>
                    <p className="text-foreground">Orders</p>
                    <p className="font-medium">{salesman.total_orders || 0}</p>
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-2 border-t">
                  <Button variant="ghost" size="sm" onClick={() => handleViewDetails(salesman)}>
                    <Eye className="h-4 w-4 mr-1" /> View
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleEdit(salesman)}>
                    <Edit2 className="h-4 w-4 mr-1" /> Edit
                  </Button>
                  <Button variant="ghost" size="sm" className="text-destructive" onClick={() => handleDelete(salesman.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Table View */}
          <div className="hidden lg:block bg-background rounded-lg shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Commission %</TableHead>
                    <TableHead className="text-right">Total Sales</TableHead>
                    <TableHead className="text-right">Commission Earned</TableHead>
                    <TableHead className="text-right">Orders</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSalesmen.map((salesman) => (
                    <TableRow key={salesman.id}>
                      <TableCell className="font-medium">{salesman.name}</TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {salesman.phone && <p>{salesman.phone}</p>}
                          {salesman.email && (
                            <p className="text-foreground">{salesman.email}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={salesman.is_active ? "default" : "secondary"}>
                          {salesman.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {Number(salesman.commission_rate || 0)}%
                      </TableCell>
                      <TableCell className="text-right font-semibold text-primary">
                        {formatCurrency(Number(salesman.total_sales || 0))}
                      </TableCell>
                      <TableCell className="text-right font-semibold text-green-600">
                        {formatCurrency(
                          (Number(salesman.total_sales || 0) * Number(salesman.commission_rate || 0)) / 100
                        )}
                      </TableCell>
                      <TableCell className="text-right">{salesman.total_orders || 0}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="sm" onClick={() => handleViewDetails(salesman)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleEdit(salesman)}>
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" className="text-destructive" onClick={() => handleDelete(salesman.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-serif">
              {editingId ? "Edit Salesman" : "Add New Salesman"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Name *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Salesman name"
              />
            </div>
            <div>
              <Label>Phone</Label>
              <Input
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="Phone number"
              />
            </div>
            <div>
              <Label>Email</Label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="Email address"
              />
            </div>
            <div>
              <Label>Status</Label>
              <Select
                value={formData.is_active ? "active" : "inactive"}
                onValueChange={(value) =>
                  setFormData({ ...formData, is_active: value === "active" })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Commission Rate (%)</Label>
              <Input
                type="number"
                min="0"
                max="100"
                step="0.5"
                value={formData.commission_rate}
                onChange={(e) => setFormData({ ...formData, commission_rate: parseFloat(e.target.value) || 0 })}
                placeholder="e.g., 5 for 5%"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Commission calculated on total sales
              </p>
            </div>
            <Button
              onClick={handleSubmit}
              disabled={submitting}
              className="w-full"
            >
              {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editingId ? "Update" : "Add"} Salesman
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-serif">
              Sales Records - {selectedSalesman?.name}
            </DialogTitle>
          </DialogHeader>

          {/* Summary */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="bg-muted/50 p-4 rounded-lg">
              <p className="text-sm text-muted-foreground">Total Sales</p>
              <p className="text-2xl font-bold text-primary">
                {formatCurrency(Number(selectedSalesman?.total_sales || 0))}
              </p>
            </div>
            <div className="bg-muted/50 p-4 rounded-lg">
              <p className="text-sm text-muted-foreground">Total Orders</p>
              <p className="text-2xl font-bold">{selectedSalesman?.total_orders || 0}</p>
            </div>
          </div>

          {/* Sales Records Table */}
          {loadingRecords ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : salesRecords.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No sales records found
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order #</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {salesRecords.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell className="font-medium">{record.order_number}</TableCell>
                    <TableCell>{record.customer_name || "Walk-in"}</TableCell>
                    <TableCell>
                      {new Date(record.created_at).toLocaleDateString("en-IN")}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={record.payment_status === "paid" ? "default" : "secondary"}
                      >
                        {record.payment_status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      {formatCurrency(record.total_amount)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminSalesman;
