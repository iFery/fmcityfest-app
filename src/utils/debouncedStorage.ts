/**
 * Debounced AsyncStorage wrapper for Zustand persist middleware
 * Prevents excessive AsyncStorage calls by debouncing write operations
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import type { StateStorage } from 'zustand/middleware';

const DEBOUNCE_MS = 300; // Debounce writes by 300ms

interface PendingWrite {
  key: string;
  value: string;
  timeout: ReturnType<typeof setTimeout>;
}

class DebouncedStorage implements StateStorage {
  private pendingWrites = new Map<string, PendingWrite>();

  async getItem(name: string): Promise<string | null> {
    return AsyncStorage.getItem(name);
  }

  async setItem(name: string, value: string): Promise<void> {
    // Cancel any pending write for this key
    const existing = this.pendingWrites.get(name);
    if (existing) {
      clearTimeout(existing.timeout);
    }

    // Schedule a new write
    const timeout = setTimeout(async () => {
      try {
        await AsyncStorage.setItem(name, value);
        this.pendingWrites.delete(name);
      } catch (error) {
        console.error(`Error writing to AsyncStorage for key ${name}:`, error);
        this.pendingWrites.delete(name);
      }
    }, DEBOUNCE_MS);

    this.pendingWrites.set(name, { key: name, value, timeout });
  }

  async removeItem(name: string): Promise<void> {
    // Cancel any pending write for this key
    const existing = this.pendingWrites.get(name);
    if (existing) {
      clearTimeout(existing.timeout);
      this.pendingWrites.delete(name);
    }

    return AsyncStorage.removeItem(name);
  }
}

// Create a singleton instance
export const debouncedStorage = new DebouncedStorage();



