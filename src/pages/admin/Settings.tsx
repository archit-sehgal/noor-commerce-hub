import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Trash2, UserCog, Shield } from "lucide-react";

interface Employee {
  id: string;
  user_id: string;
  email: string;
  full_name: string;
  permissions: {
    permission_billing: boolean;
    permission_orders: boolean;
    permission_customers: boolean;
    permission_inventory: boolean;
    permission_products: boolean;
    permission_categories: boolean;
    permission_reports: boolean;
    permission_invoices: boolean;
    permission_salesmen: boolean;
    permission_settings: boolean;
  };
}

const permissionLabels = {
  permission_billing: "Billing (POS)",
  permission_orders: "Orders",
  permission_customers: "Customers",
  permission_inventory: "Inventory",
  permission_products: "Products",
  permission_categories: "Categories",
  permission_reports: "Reports",
  permission_invoices: "Invoices",
  permission_salesmen: "Salesmen",
  permission_settings: "Settings",
};

const Settings = () => {
  const queryClient = useQueryClient();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newEmployeeEmail, setNewEmployeeEmail] = useState("");
  const [newEmployeeName, setNewEmployeeName] = useState("");
  const [newEmployeePassword, setNewEmployeePassword] = useState("");
  const [selectedPermissions, setSelectedPermissions] = useState<Record<string, boolean>>({
    permission_billing: true,
    permission_orders: true,
    permission_customers: false,
    permission_inventory: false,
    permission_products: false,
    permission_categories: false,
    permission_reports: false,
    permission_invoices: true,
    permission_salesmen: false,
    permission_settings: false,
  });

  // Fetch all employees (sales_staff role)
  const { data: employees, isLoading } = useQuery({
    queryKey: ["employees"],
    queryFn: async () => {
      // Get all users with sales_staff role
      const { data: roleData, error: roleError } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "sales_staff");

      if (roleError) throw roleError;

      if (!roleData || roleData.length === 0) return [];

      const userIds = roleData.map((r) => r.user_id);

      // Get profiles for these users
      const { data: profiles, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .in("user_id", userIds);

      if (profileError) throw profileError;

      // Get permissions for these users
      const { data: permissions, error: permError } = await supabase
        .from("employee_permissions")
        .select("*")
        .in("user_id", userIds);

      if (permError) throw permError;

      // Combine data
      return (profiles || []).map((profile) => {
        const perm = permissions?.find((p) => p.user_id === profile.user_id);
        return {
          id: profile.id,
          user_id: profile.user_id,
          email: profile.email || "",
          full_name: profile.full_name || "",
          permissions: perm || {
            permission_billing: true,
            permission_orders: true,
            permission_customers: false,
            permission_inventory: false,
            permission_products: false,
            permission_categories: false,
            permission_reports: false,
            permission_invoices: true,
            permission_salesmen: false,
            permission_settings: false,
          },
        };
      }) as Employee[];
    },
  });

  // Add new employee mutation
  const addEmployeeMutation = useMutation({
    mutationFn: async () => {
      // Create new user via sign up
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: newEmployeeEmail,
        password: newEmployeePassword,
        options: {
          emailRedirectTo: window.location.origin,
          data: {
            full_name: newEmployeeName,
          },
        },
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error("Failed to create user");

      // Update role to sales_staff
      const { error: roleError } = await supabase
        .from("user_roles")
        .update({ role: "sales_staff" })
        .eq("user_id", authData.user.id);

      if (roleError) throw roleError;

      // Add permissions
      const { error: permError } = await supabase
        .from("employee_permissions")
        .insert({
          user_id: authData.user.id,
          ...selectedPermissions,
        });

      if (permError) throw permError;

      return authData.user;
    },
    onSuccess: () => {
      toast.success("Employee added successfully");
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      setIsAddDialogOpen(false);
      setNewEmployeeEmail("");
      setNewEmployeeName("");
      setNewEmployeePassword("");
      setSelectedPermissions({
        permission_billing: true,
        permission_orders: true,
        permission_customers: false,
        permission_inventory: false,
        permission_products: false,
        permission_categories: false,
        permission_reports: false,
        permission_invoices: true,
        permission_salesmen: false,
        permission_settings: false,
      });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // Update permissions mutation
  const updatePermissionsMutation = useMutation({
    mutationFn: async ({
      userId,
      permissions,
    }: {
      userId: string;
      permissions: Record<string, boolean>;
    }) => {
      // Check if permissions exist
      const { data: existing } = await supabase
        .from("employee_permissions")
        .select("id")
        .eq("user_id", userId)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from("employee_permissions")
          .update(permissions)
          .eq("user_id", userId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("employee_permissions")
          .insert({ user_id: userId, ...permissions });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success("Permissions updated");
      queryClient.invalidateQueries({ queryKey: ["employees"] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // Delete employee mutation
  const deleteEmployeeMutation = useMutation({
    mutationFn: async (userId: string) => {
      // Remove permissions
      await supabase
        .from("employee_permissions")
        .delete()
        .eq("user_id", userId);

      // Change role back to customer
      const { error } = await supabase
        .from("user_roles")
        .update({ role: "customer" })
        .eq("user_id", userId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Employee removed");
      queryClient.invalidateQueries({ queryKey: ["employees"] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const handlePermissionToggle = (userId: string, permission: string, currentValue: boolean) => {
    updatePermissionsMutation.mutate({
      userId,
      permissions: { [permission]: !currentValue },
    });
  };

  return (
    <AdminLayout title="Settings">
      <div className="space-y-8">
        {/* Employee Management Section */}
        <Card className="border-gold/20">
          <CardHeader className="bg-gradient-to-r from-cream to-cream-dark border-b border-gold/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gold/10 rounded-lg">
                  <UserCog className="h-5 w-5 text-gold" />
                </div>
                <div>
                  <CardTitle className="font-display text-xl">Employee Management</CardTitle>
                  <CardDescription>
                    Add employees and manage their access to different CRM features
                  </CardDescription>
                </div>
              </div>
              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-gold hover:bg-gold-dark text-charcoal">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Employee
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle className="font-display text-xl flex items-center gap-2">
                      <Shield className="h-5 w-5 text-gold" />
                      Add New Employee
                    </DialogTitle>
                    <DialogDescription>
                      Create a new employee account and assign permissions
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-6 py-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Full Name</Label>
                        <Input
                          id="name"
                          value={newEmployeeName}
                          onChange={(e) => setNewEmployeeName(e.target.value)}
                          placeholder="Enter employee name"
                          className="border-gold/20 focus:border-gold"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          value={newEmployeeEmail}
                          onChange={(e) => setNewEmployeeEmail(e.target.value)}
                          placeholder="employee@example.com"
                          className="border-gold/20 focus:border-gold"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password">Password</Label>
                      <Input
                        id="password"
                        type="password"
                        value={newEmployeePassword}
                        onChange={(e) => setNewEmployeePassword(e.target.value)}
                        placeholder="Create a password"
                        className="border-gold/20 focus:border-gold"
                      />
                    </div>

                    <div className="space-y-4">
                      <Label className="text-base font-display">Feature Access</Label>
                      <div className="grid grid-cols-2 gap-3">
                        {Object.entries(permissionLabels).map(([key, label]) => (
                          <div
                            key={key}
                            className="flex items-center space-x-3 p-3 rounded-lg border border-gold/10 hover:border-gold/30 transition-colors bg-cream/50"
                          >
                            <Checkbox
                              id={`new-${key}`}
                              checked={selectedPermissions[key] || false}
                              onCheckedChange={(checked) =>
                                setSelectedPermissions((prev) => ({
                                  ...prev,
                                  [key]: !!checked,
                                }))
                              }
                              className="border-gold data-[state=checked]:bg-gold data-[state=checked]:border-gold"
                            />
                            <Label htmlFor={`new-${key}`} className="font-medium cursor-pointer">
                              {label}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>

                    <Button
                      onClick={() => addEmployeeMutation.mutate()}
                      disabled={addEmployeeMutation.isPending || !newEmployeeEmail || !newEmployeePassword || !newEmployeeName}
                      className="w-full bg-gold hover:bg-gold-dark text-charcoal font-medium"
                    >
                      {addEmployeeMutation.isPending ? "Creating..." : "Create Employee Account"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">Loading employees...</div>
            ) : employees && employees.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow className="border-gold/10">
                    <TableHead className="font-display">Employee</TableHead>
                    {Object.values(permissionLabels).map((label) => (
                      <TableHead key={label} className="text-center text-xs">
                        {label}
                      </TableHead>
                    ))}
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {employees.map((employee) => (
                    <TableRow key={employee.id} className="border-gold/10">
                      <TableCell>
                        <div>
                          <p className="font-medium">{employee.full_name || "—"}</p>
                          <p className="text-sm text-muted-foreground">{employee.email}</p>
                        </div>
                      </TableCell>
                      {Object.keys(permissionLabels).map((key) => (
                        <TableCell key={key} className="text-center">
                          <Checkbox
                            checked={employee.permissions[key as keyof typeof employee.permissions] || false}
                            onCheckedChange={() =>
                              handlePermissionToggle(
                                employee.user_id,
                                key,
                                employee.permissions[key as keyof typeof employee.permissions] || false
                              )
                            }
                            className="border-gold data-[state=checked]:bg-gold data-[state=checked]:border-gold"
                          />
                        </TableCell>
                      ))}
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteEmployeeMutation.mutate(employee.user_id)}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-12 space-y-4">
                <div className="w-16 h-16 mx-auto bg-gold/10 rounded-full flex items-center justify-center">
                  <UserCog className="h-8 w-8 text-gold" />
                </div>
                <div>
                  <p className="font-medium text-lg">No employees yet</p>
                  <p className="text-muted-foreground">
                    Add employees to manage their access to the CRM
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Store Settings Section */}
        <Card className="border-gold/20">
          <CardHeader className="bg-gradient-to-r from-cream to-cream-dark border-b border-gold/10">
            <CardTitle className="font-display text-xl">Store Settings</CardTitle>
            <CardDescription>
              Configure your store details and preferences
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>Store Name</Label>
                <Input 
                  defaultValue="Noor Creations" 
                  className="border-gold/20 focus:border-gold"
                />
              </div>
              <div className="space-y-2">
                <Label>GST Number</Label>
                <Input 
                  placeholder="Enter GST number"
                  className="border-gold/20 focus:border-gold"
                />
              </div>
              <div className="space-y-2">
                <Label>Contact Email</Label>
                <Input 
                  type="email" 
                  placeholder="store@example.com"
                  className="border-gold/20 focus:border-gold"
                />
              </div>
              <div className="space-y-2">
                <Label>Contact Phone</Label>
                <Input 
                  placeholder="+91 XXXXX XXXXX"
                  className="border-gold/20 focus:border-gold"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Store Address</Label>
              <Input 
                placeholder="Enter full store address"
                className="border-gold/20 focus:border-gold"
              />
            </div>
            <Button className="bg-gold hover:bg-gold-dark text-charcoal">
              Save Settings
            </Button>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default Settings;
