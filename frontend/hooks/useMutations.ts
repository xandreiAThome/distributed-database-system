import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { getApiUrl, debugLog } from "@/lib/config";
import { User } from "./useUsers";

export interface CreateUserPayload {
  username: string;
  first_name: string;
  last_name: string;
  city: string;
  country: string;
  zipcode: string;
  gender: string;
}

export interface UpdateUserPayload {
  username?: string;
  first_name?: string;
  last_name?: string;
  city?: string;
  country?: string;
  zipcode?: string;
  gender?: string;
}

export interface CreateUserResponse {
  user: User;
  replication: any;
  message: string;
}

export interface UpdateUserResponse {
  user: User;
  replication: any;
  message: string;
}

export interface DeleteUserResponse {
  message: string;
  replication: any;
  deletedUser: User;
}

export const useCreateUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: CreateUserPayload) => {
      const response = await axios.post<CreateUserResponse>(
        getApiUrl("/users"),
        payload
      );
      debugLog("User created:", response.data);
      return response.data;
    },
    onSuccess: (data) => {
      // Invalidate and refetch all users
      queryClient.invalidateQueries({ queryKey: ["users"] });
      // Cache the newly created user
      queryClient.setQueryData(["user", data.user.user_id], data.user);
    },
  });
};

export const useUpdateUser = (userId: string | null) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: UpdateUserPayload) => {
      if (!userId) throw new Error("User ID is required");
      const response = await axios.patch<UpdateUserResponse>(
        getApiUrl(`/users/${userId}`),
        payload
      );
      debugLog("User updated:", response.data);
      return response.data;
    },
    onSuccess: (data) => {
      // Update the specific user query
      queryClient.setQueryData(["user", userId], data.user);
      // Invalidate user-related queries
      queryClient.invalidateQueries({ queryKey: ["users", "search"] });
      queryClient.invalidateQueries({ queryKey: ["users", "username"] });
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
};

export const useDeleteUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string) => {
      const response = await axios.delete<DeleteUserResponse>(
        getApiUrl(`/users/${userId}`)
      );
      debugLog("User deleted:", response.data);
      return response.data;
    },
    onSuccess: (data) => {
      // Remove the deleted user from cache
      queryClient.removeQueries({
        queryKey: ["user", data.deletedUser.user_id],
      });
      // Invalidate all user lists
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.invalidateQueries({ queryKey: ["users", "search"] });
      queryClient.invalidateQueries({ queryKey: ["users", "username"] });
    },
  });
};
