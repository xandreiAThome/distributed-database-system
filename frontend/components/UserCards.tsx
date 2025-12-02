"use client";

import { Trash } from "lucide-react";
import React from "react";
import { useDeleteUser } from "@/hooks/useMutations";
import { debugLog } from "@/lib/config";

interface UserCardProps {
  name: string;
  username: string;
  city: string;
  country: string;
  gender: string;
  id: string;
}

const UserCards = ({
  name,
  username,
  city,
  country,
  gender,
  id,
}: UserCardProps) => {
  const deleteMutation = useDeleteUser();

  const handleDelete = () => {
    if (confirm("Are you sure you want to delete this user?")) {
      debugLog("Deleting user:", id);
      deleteMutation.mutate(id, {
        onSuccess: () => {
          debugLog("User deleted successfully");
          window.location.reload();
        },
        onError: (error: any) => {
          console.error("Delete error:", error);
          alert("Failed to delete user");
        },
      });
    }
  };

  return (
    <div className="flex items-center justify-between w-96 p-3 text-center border border-gray-400 rounded-md text-gray-700 bg-white shadow-sm hover:border-blue-500 transition-colors">
      <div>
        <h2 className="text-lg font-semibold mb-1">{name}</h2>
      </div>
      <div className="text-sm text-gray-600 space-y-1">
        <h2 className="text-lg font-semibold mb-1">{username}</h2>
      </div>
      <button
        onClick={handleDelete}
        disabled={deleteMutation.isPending}
        className={`flex items-center gap-1 px-2 py-1 rounded transition-colors ${
          deleteMutation.isPending
            ? "bg-red-400 cursor-not-allowed"
            : "bg-red-600 text-white hover:bg-red-700"
        }`}
      >
        <Trash size={16} />
      </button>
    </div>
  );
};

export default UserCards;
