import "react-native-url-polyfill/auto"
import { createClient } from "@supabase/supabase-js"
import { MMKV } from "react-native-mmkv"
import Config from "../config"

// Crear instancia de MMKV
const storage = new MMKV()

// Adaptador de almacenamiento para Supabase usando MMKV
const MMKVStorageAdapter = {
  getItem: (key: string) => {
    const value = storage.getString(key)
    return Promise.resolve(value ?? null)
  },
  setItem: (key: string, value: string) => {
    storage.set(key, value)
    return Promise.resolve()
  },
  removeItem: (key: string) => {
    storage.delete(key)
    return Promise.resolve()
  },
}

export const supabase = createClient(Config.SUPABASE_URL, Config.SUPABASE_ANON_KEY, {
  auth: {
    storage: MMKVStorageAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
})
