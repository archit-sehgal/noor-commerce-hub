import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface EmployeePermissions {
  id: string;
  user_id: string;
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
  permission_alterations: boolean;
  permission_purchases: boolean;
}

export const useEmployeePermissions = () => {
  const { user, isAdmin, isSalesStaff } = useAuth();

  const { data: permissions, isLoading } = useQuery({
    queryKey: ["employee-permissions", user?.id],
    queryFn: async () => {
      if (!user) return null;
      
      // Admins have all permissions
      if (isAdmin) {
        return {
          permission_billing: true,
          permission_orders: true,
          permission_customers: true,
          permission_inventory: true,
          permission_products: true,
          permission_categories: true,
          permission_reports: true,
          permission_invoices: true,
          permission_salesmen: true,
          permission_settings: true,
          permission_alterations: true,
          permission_purchases: true,
        } as EmployeePermissions;
      }

      // For sales staff, check their specific permissions
      if (isSalesStaff) {
        const { data, error } = await supabase
          .from("employee_permissions")
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle();

        if (error) {
          console.error("Error fetching permissions:", error);
          // Default permissions for sales staff without specific permissions set
          return {
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
            permission_alterations: true,
            permission_purchases: false,
          } as EmployeePermissions;
        }

        if (!data) {
          // Default permissions if no record exists
          return {
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
            permission_alterations: true,
            permission_purchases: false,
          } as EmployeePermissions;
        }

        return data as EmployeePermissions;
      }

      return null;
    },
    enabled: !!user && (isAdmin || isSalesStaff),
  });

  // IMPORTANT: Admins always have all permissions, regardless of loading state
  const hasPermission = (permission: keyof EmployeePermissions): boolean => {
    if (isAdmin) return true;
    if (isLoading) return true; // Show all items while loading to prevent flash
    if (!permissions) return false;
    return !!permissions[permission];
  };

  return {
    permissions,
    isLoading,
    hasPermission,
  };
};
