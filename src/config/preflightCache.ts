export interface CachedPreflight {
  timestamp: number;
  location: any;
  preflightRes: any;
}

let cached: CachedPreflight | null = null;

export const setCachedPreflight = (data: CachedPreflight | null) => {
  cached = data;
};

export const getCachedPreflight = (): CachedPreflight | null => {
  if (!cached) return null;
  // Expira después de 30 segundos
  if (Date.now() - cached.timestamp > 30000) {
    cached = null;
    return null;
  }
  return cached;
};

export const clearCachedPreflight = () => {
  cached = null;
};

