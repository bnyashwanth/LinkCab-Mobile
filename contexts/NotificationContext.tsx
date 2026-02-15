import React, { createContext, useContext, useEffect, useState } from 'react';
import { Notification } from '@/types';

interface NotificationContextType {
  notifications: Notification[];
  addNotification: (notification: Notification) => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;
  unreadCount: number;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

interface NotificationProviderProps {
  children: React.ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const addNotification = (notification: Notification) => {
    setNotifications(prev => [notification, ...prev]);
    
    // Show system notification if supported
    if (typeof window !== 'undefined' && 'Notification' in window) {
      new Notification(notification.title, {
        body: notification.body,
        icon: '/icon.png',
      });
    }
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  // Request notification permissions
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window && 'requestPermission' in Notification) {
      Notification.requestPermission();
    }
  }, []);

  return (
    <NotificationContext.Provider value={{
      notifications,
      addNotification,
      removeNotification,
      clearNotifications,
      unreadCount,
    }}>
      {children}
    </NotificationContext.Provider>
  );
};
