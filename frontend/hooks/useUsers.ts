import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { getApiUrl, debugLog } from "@/lib/config";

export interface User {
  user_id: string;
  username: string;
  first_name: string;
  last_name: string;
  city: string;
  country: string;
  zipcode: string;
  gender: string;
  updatedAt?: string;
}

export const useUser = (userId: string | null, enabled: boolean = true) => {
  return useQuery({
    queryKey: ["user", userId],
    queryFn: async () => {
      if (!userId) throw new Error("User ID is required");
      const response = await axios.get<User>(getApiUrl(`/users/${userId}`));
      debugLog("User fetched:", response.data);
      return response.data;
    },
    enabled: enabled && !!userId,
  });
};

export const useAllUsers = (limit?: number) => {
  return useQuery({
    queryKey: ["users", limit],
    queryFn: async () => {
      const url = limit
        ? getApiUrl(`/users?limit=${limit}`)
        : getApiUrl("/users");
      const response = await axios.get<User[]>(url);
      debugLog("All users fetched:", response.data);
      return response.data;
    },
  });
};

export const useSearchUsers = (
  query: string,
  limit: number = 10,
  enabled: boolean = true
) => {
  return useQuery({
    queryKey: ["users", "search", query, limit],
    queryFn: async () => {
      const response = await axios.get<User[]>(
        getApiUrl(
          `/users/search?limit=${limit}&name=${encodeURIComponent(query)}`
        )
      );
      debugLog("Search results:", response.data);
      return response.data;
    },
    enabled: enabled && query.trim().length > 0,
  });
};

export const useUserByUsername = (
  username: string,
  limit: number = 10,
  enabled: boolean = true
) => {
  return useQuery({
    queryKey: ["users", "username", username, limit],
    queryFn: async () => {
      const response = await axios.get<User[]>(
        getApiUrl(
          `/users/username/${encodeURIComponent(username)}?limit=${limit}`
        )
      );
      debugLog("Username search results:", response.data);
      return response.data;
    },
    enabled: enabled && username.trim().length > 0,
  });
};
