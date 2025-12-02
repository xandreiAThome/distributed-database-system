"use client";

import { Trash } from "lucide-react";
import React from "react";
import { useRouter } from "next/navigation";
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

const UserCards = ({ name, username, id }: UserCardProps) => {
  const router = useRouter();

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't navigate if clicking the delete button
    if ((e.target as HTMLElement).closest("button")) {
      return;
    }
    router.push(`/user/${id}`);
  };

  return (
    <div
      onClick={handleCardClick}
      className="flex items-center justify-between w-96 p-3 text-center border border-gray-400 rounded-md text-gray-700 bg-white shadow-sm hover:border-blue-500 hover:shadow-md hover:cursor-pointer transition-all"
    >
      <div>
        <h2 className="text-lg font-semibold mb-1">{name}</h2>
      </div>
      <div className="text-sm text-gray-600 space-y-1">
        <h2 className="text-lg font-semibold mb-1">{username}</h2>
      </div>
    </div>
  );
};

export default UserCards;
