import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

interface ServerUrlState {
  serverUrl: string | null;
  setServerUrl: (url: string | null) => void;
}

export const useServerUrlStore = create<ServerUrlState>()(
  devtools(
    (set) => ({
      serverUrl: null,
      setServerUrl: (url) => set({ serverUrl: url }, false, 'setServerUrl'),
    }),
    {
      name: 'server-url-store',
    },
  ),
);
