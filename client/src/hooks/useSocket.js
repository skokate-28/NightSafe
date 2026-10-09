import { useEffect } from 'react';
import { getSocket } from '../socket/socket';
import useAuthStore from '../store/authStore';

export function useSocket(events = {}) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  useEffect(() => {
    if (!isAuthenticated) return;

    const socket = getSocket();
    if (!socket) return;

    Object.entries(events).forEach(([event, handler]) => {
      socket.on(event, handler);
    });

    return () => {
      Object.entries(events).forEach(([event, handler]) => {
        socket.off(event, handler);
      });
    };
  }, [isAuthenticated, events]);
}
