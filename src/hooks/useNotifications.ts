import { useEffect, useCallback, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  data: Record<string, unknown>;
  is_read: boolean;
  created_at: string;
}

// Notification sound - using Web Audio API for premium feel
const playNotificationSound = () => {
  try {
    const audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    
    // Create a more sophisticated notification sound
    const oscillator1 = audioContext.createOscillator();
    const oscillator2 = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator1.connect(gainNode);
    oscillator2.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    // Pleasant bell-like frequencies
    oscillator1.frequency.setValueAtTime(880, audioContext.currentTime);
    oscillator1.frequency.setValueAtTime(1100, audioContext.currentTime + 0.1);
    oscillator2.frequency.setValueAtTime(660, audioContext.currentTime);
    oscillator2.frequency.setValueAtTime(880, audioContext.currentTime + 0.1);
    
    oscillator1.type = 'sine';
    oscillator2.type = 'triangle';
    
    // Envelope
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
    
    oscillator1.start(audioContext.currentTime);
    oscillator2.start(audioContext.currentTime);
    oscillator1.stop(audioContext.currentTime + 0.5);
    oscillator2.stop(audioContext.currentTime + 0.5);
    
    // Voice announcement
    if ('speechSynthesis' in window) {
      setTimeout(() => {
        const utterance = new SpeechSynthesisUtterance('New order received');
        utterance.rate = 0.9;
        utterance.pitch = 1.1;
        utterance.volume = 0.8;
        speechSynthesis.speak(utterance);
      }, 600);
    }
  } catch (error) {
    console.log('Audio not available:', error);
  }
};

// Haptic feedback for mobile
const triggerHaptic = () => {
  if ('vibrate' in navigator) {
    navigator.vibrate([100, 50, 100]);
  }
};

export const useNotifications = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const lastNotificationId = useRef<string | null>(null);

  const { data: notifications = [], isLoading: loading, refetch } = useQuery({
    queryKey: ["notifications"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data || []) as Notification[];
    },
    staleTime: 1000 * 30,
  });

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const setNotifications = useCallback(
    (updater: (prev: Notification[]) => Notification[]) => {
      queryClient.setQueryData<Notification[]>(["notifications"], (prev) => updater(prev || []));
    },
    [queryClient]
  );

  const fetchNotifications = useCallback(() => refetch(), [refetch]);


  const markAsRead = useCallback(async (id: string) => {
    try {
      await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("id", id);

      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  }, [setNotifications]);

  const markAllAsRead = useCallback(async () => {
    try {
      await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("is_read", false);

      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch (error) {
      console.error("Error marking all as read:", error);
    }
  }, [setNotifications]);

  const deleteNotification = useCallback(async (id: string) => {
    try {
      await supabase.from("notifications").delete().eq("id", id);

      setNotifications((prev) => prev.filter((n) => n.id !== id));
    } catch (error) {
      console.error("Error deleting notification:", error);
    }
  }, [setNotifications]);

  const clearAll = useCallback(async () => {
    try {
      await supabase.from("notifications").delete().neq("id", "");
      setNotifications(() => []);
    } catch (error) {
      console.error("Error clearing notifications:", error);
    }
  }, [setNotifications]);


  useEffect(() => {
    fetchNotifications();

    // Subscribe to realtime notifications
    const channel = supabase
      .channel("notifications-channel")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
        },
        (payload) => {
          const newNotification = payload.new as Notification;
          
          // Prevent duplicate handling
          if (lastNotificationId.current === newNotification.id) return;
          lastNotificationId.current = newNotification.id;
          
          setNotifications((prev) => [newNotification, ...prev]);

          
          // Play sound and haptic for new orders
          if (newNotification.type === 'order') {
            playNotificationSound();
            triggerHaptic();
          }
          
          toast({
            title: newNotification.title,
            description: newNotification.message,
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchNotifications, toast]);

  return {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll,
    refetch: fetchNotifications,
  };
};

// Helper to create notification when order is placed
export const createOrderNotification = async (orderNumber: string, totalAmount: number, source: string) => {
  try {
    await supabase.from("notifications").insert({
      type: "order",
      title: source === 'online' ? "🛒 New Online Order!" : "🏪 New Walk-in Order",
      message: `Order ${orderNumber} placed for ₹${totalAmount.toLocaleString()}`,
      data: { orderNumber, totalAmount, source },
    });
  } catch (error) {
    console.error("Error creating notification:", error);
  }
};
