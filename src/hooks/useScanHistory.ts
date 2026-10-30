import { useState, useEffect } from 'react';
import { ScanResult } from '../types';

const STORAGE_KEY = 'ghostsignal_scan_history_v1';

export function useScanHistory() {
  const [history, setHistory] = useState<ScanResult[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load only records the user actually scanned in this browser.
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed: ScanResult[] = JSON.parse(stored);
        setHistory(Array.isArray(parsed) ? parsed : []);
      }
    } catch (e) {
      console.warn('Failed to access localStorage for scan history', e);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  const saveScan = (result: ScanResult) => {
    setHistory(prev => {
      // Prepend the new result
      const updated = [result, ...prev.filter(item => item.id !== result.id)].slice(0, 50); // limit to 50
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch (e) {
        console.warn('Failed to save scan to localStorage', e);
      }
      return updated;
    });
  };

  const deleteScan = (id: string) => {
    setHistory(prev => {
      const updated = prev.filter(item => item.id !== id);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch (e) {
        console.warn('Failed to update localStorage', e);
      }
      return updated;
    });
  };

  const clearHistory = () => {
    setHistory([]);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
    } catch (e) {
      console.warn('Failed to clear localStorage', e);
    }
  };

  const getScanById = (id: string): ScanResult | undefined => {
    return history.find(item => item.id === id);
  };

  return {
    history,
    isLoaded,
    saveScan,
    deleteScan,
    clearHistory,
    getScanById
  };
}
