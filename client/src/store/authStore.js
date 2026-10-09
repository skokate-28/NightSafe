import { create } from 'zustand';
import axios from 'axios';
import { initSocket, disconnectSocket } from '../socket/socket';

const API_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:5000';

const useAuthStore = create((set, get) => ({
  user: null,
  accessToken: null,
  isAuthenticated: false,
  isLoading: true,

  setToken: (accessToken) => set({ accessToken }),

  initAuth: async () => {
    set({ isLoading: true });
    try {
      const { data } = await axios.post(
        `${API_URL}/api/auth/refresh`,
        {},
        { withCredentials: true }
      );
      const accessToken = data.data.accessToken;
      set({ accessToken });

      const meRes = await axios.get(`${API_URL}/api/auth/me`, {
        headers: { Authorization: `Bearer ${accessToken}` },
        withCredentials: true,
      });

      set({
        user: meRes.data.data,
        isAuthenticated: true,
        isLoading: false,
      });

      initSocket(accessToken);
    } catch {
      set({ user: null, accessToken: null, isAuthenticated: false, isLoading: false });
    }
  },

  login: (user, accessToken) => {
    set({ user, accessToken, isAuthenticated: true });
    initSocket(accessToken);
  },

  logout: async () => {
    try {
      await axios.post(`${API_URL}/api/auth/logout`, {}, { withCredentials: true });
    } catch {
      // ignore
    }
    disconnectSocket();
    set({ user: null, accessToken: null, isAuthenticated: false });
  },

  updateUser: (user) => set({ user }),
}));

export default useAuthStore;
