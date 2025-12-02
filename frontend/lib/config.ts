/**
 * Configuration utility for environment variables
 * All environment variables are prefixed with NEXT_PUBLIC_ to be available in the browser
 */

export const config = {
  // API Configuration
  api: {
    baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3010",
    timeout: parseInt(process.env.NEXT_PUBLIC_API_TIMEOUT || "30000", 10),
  },

  // Feature Flags
  features: {
    detailedLogs: process.env.NEXT_PUBLIC_ENABLE_DETAILED_LOGS === "true",
    replicationTrace:
      process.env.NEXT_PUBLIC_ENABLE_REPLICATION_TRACE === "true",
  },

  // Pagination
  pagination: {
    defaultLimit: parseInt(process.env.NEXT_PUBLIC_DEFAULT_LIMIT || "10", 10),
  },

  // Search
  search: {
    debounceMs: parseInt(
      process.env.NEXT_PUBLIC_SEARCH_DEBOUNCE_MS || "300",
      10
    ),
  },
} as const;

/**
 * Helper to construct API URLs
 */
export const getApiUrl = (endpoint: string): string => {
  const baseUrl = config.api.baseUrl.replace(/\/$/, "");
  const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  return `${baseUrl}${cleanEndpoint}`;
};

/**
 * Log only if detailed logs are enabled
 */
export const debugLog = (message: string, data?: unknown): void => {
  if (config.features.detailedLogs) {
    console.log(`[DEBUG] ${message}`, data || "");
  }
};

export default config;
