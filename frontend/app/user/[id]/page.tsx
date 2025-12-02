"use client";

import { useRouter, useParams } from "next/navigation";
import { useUser } from "@/hooks/useUsers";
import { useDeleteUser } from "@/hooks/useMutations";
import { ArrowLeft, Home, Trash } from "lucide-react";
import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function UserDetailPage() {
  const router = useRouter();
  const params = useParams();
  const userId = params?.id as string;
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const { data: user, isLoading, error } = useUser(userId, !!userId);
  const deleteMutation = useDeleteUser();

  const handleDeleteConfirm = () => {
    if (!user) return;
    deleteMutation.mutate(String(user.user_id), {
      onSuccess: () => {
        setIsDeleteDialogOpen(false);
        router.push("/search");
      },
    });
  };

  const handleDeleteClick = () => {
    setIsDeleteDialogOpen(true);
  };

  if (!userId) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">
            Invalid User ID
          </h1>
          <button
            onClick={() => router.push("/")}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600">Loading user details...</p>
        </div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">
            User not found
          </h1>
          <p className="text-gray-600 mb-6">
            {error instanceof Error
              ? error.message
              : "Unable to load user details"}
          </p>
          <button
            onClick={() => router.push("/")}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center p-8 bg-gray-50">
      {/* Navigation Bar */}
      <div className="w-full max-w-3xl mb-8 flex items-center justify-between gap-4">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-800 transition-colors"
          aria-label="Go back"
        >
          <ArrowLeft size={18} />
          Back
        </button>
        <div className="flex gap-4">
          <button
            onClick={() => router.push("/")}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors"
            aria-label="Go to home"
          >
            <Home size={18} />
            Dashboard
          </button>
          <button
            onClick={handleDeleteClick}
            disabled={deleteMutation.isPending}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Delete user"
          >
            <Trash size={18} />
            {deleteMutation.isPending ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>

      {/* User Detail Card */}
      <div className="w-full max-w-3xl bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-4xl font-bold mb-8 text-gray-900">User Profile</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Basic Information */}
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Full Name
              </label>
              <p className="text-lg text-gray-900 bg-gray-50 p-3 rounded-lg">
                {user.first_name} {user.last_name}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Username
              </label>
              <p className="text-lg text-gray-900 bg-gray-50 p-3 rounded-lg">
                {user.username}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Gender
              </label>
              <p className="text-lg text-gray-900 bg-gray-50 p-3 rounded-lg">
                {user.gender || "Not specified"}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                User ID
              </label>
              <p className="text-lg text-gray-900 bg-gray-50 p-3 rounded-lg font-mono">
                {user.user_id}
              </p>
            </div>
          </div>

          {/* Location Information */}
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                City
              </label>
              <p className="text-lg text-gray-900 bg-gray-50 p-3 rounded-lg">
                {user.city || "Not specified"}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Country
              </label>
              <p className="text-lg text-gray-900 bg-gray-50 p-3 rounded-lg">
                {user.country || "Not specified"}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Zip Code
              </label>
              <p className="text-lg text-gray-900 bg-gray-50 p-3 rounded-lg">
                {user.zipcode || "Not specified"}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Last Updated
              </label>
              <p className="text-lg text-gray-900 bg-gray-50 p-3 rounded-lg">
                {user.updatedAt
                  ? new Date(user.updatedAt).toLocaleString()
                  : "Unknown"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete User</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this user? This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <button
              onClick={() => setIsDeleteDialogOpen(false)}
              className="px-4 py-2 rounded-lg bg-gray-300 hover:bg-gray-400 text-gray-800 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleDeleteConfirm}
              disabled={deleteMutation.isPending}
              className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
