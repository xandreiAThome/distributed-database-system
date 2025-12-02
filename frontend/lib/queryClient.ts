import { QueryClient } from "@tanstack/react-query";

export const createQueryClient = () => {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000, // 1 minute
        gcTime: 5 * 60 * 1000, // 5 minutes (formerly cacheTime)
        retry: 1,
        refetchOnWindowFocus: false,
      },
      mutations: {
        retry: 1,
      },
    },
  });
};

let clientSingleton: QueryClient | undefined;

export const getQueryClient = () => {
  if (typeof window === "undefined") {
    // Server: always create a new client
    return createQueryClient();
  } else {
    // Browser: create client once and reuse
    if (!clientSingleton) {
      clientSingleton = createQueryClient();
    }
    return clientSingleton;
  }
};
