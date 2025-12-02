"use client";

import { Input } from "@/components/ui/input";
import { Pencil, Search, LogOut } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/hooks/useUsers";
import { useUpdateUser } from "@/hooks/useMutations";
import axios from "axios";

export default function Home() {
  const router = useRouter();

  // Get user ID from sessionStorage directly
  const storedUserId =
    typeof window !== "undefined" ? sessionStorage.getItem("userId") : null;

  useEffect(() => {
    if (!storedUserId) {
      window.location.href = "/login";
    }
  }, [storedUserId]);

  // Search state (redirects to /search on Enter)
  const [search, setSearch] = useState("");

  // Edit modal & form states
  const [isEditing, setIsEditing] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [editSuccess, setEditSuccess] = useState<string | null>(null);

  // Form fields
  const [form, setForm] = useState({
    username: "",
    first_name: "",
    last_name: "",
    city: "",
    country: "",
    zipcode: "",
    gender: "",
  });

  // Fetch user data with TanStack Query
  const {
    data: userInfo,
    isLoading,
    isError,
    error,
  } = useUser(storedUserId, !!storedUserId);

  // Update mutation
  const updateMutation = useUpdateUser(storedUserId);

  // Prefill form when opening editor
  function openEditor() {
    if (!userInfo) return;
    setForm({
      username: userInfo.username ?? "",
      first_name: userInfo.first_name ?? "",
      last_name: userInfo.last_name ?? "",
      city: userInfo.city ?? "",
      country: userInfo.country ?? "",
      zipcode: userInfo.zipcode ?? "",
      gender: userInfo.gender ?? "",
    });
    setEditError(null);
    setEditSuccess(null);
    setIsEditing(true);
  }

  // Simple client validation
  function validateForm() {
    if (!form.username.trim()) return "Username is required.";
    if (!form.first_name.trim()) return "First name is required.";
    if (!form.last_name.trim()) return "Last name is required.";
    return null;
  }

  // Submit update
  async function submitEdit() {
    const validationError = validateForm();
    if (validationError) {
      setEditError(validationError);
      return;
    }

    setEditError(null);
    setEditSuccess(null);

    updateMutation.mutate(
      {
        username: form.username,
        first_name: form.first_name,
        last_name: form.last_name,
        city: form.city,
        country: form.country,
        zipcode: form.zipcode,
        gender: form.gender,
      },
      {
        onSuccess: () => {
          setEditSuccess("Profile updated.");
          setTimeout(() => {
            setIsEditing(false);
            setEditSuccess(null);
          }, 900);
        },
        onError: (error: unknown) => {
          if (axios.isAxiosError(error)) {
            setEditError(
              error.response?.data?.message ??
                "Failed to update profile. Try again."
            );
          } else {
            setEditError("Failed to update profile. Try again.");
          }
        },
      }
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-600">
        Loading...
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-screen flex items-center justify-center text-red-600">
        {error?.message || "Failed to fetch user"}
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen flex flex-col items-center p-8 bg-gray-50">
        {/* Top Navigation Bar */}
        <div className="w-full max-w-3xl mb-8 flex items-center justify-between gap-4">
          <h1 className="text-4xl font-bold text-gray-900">Dashboard</h1>

          <div className="flex gap-4">
            <button
              onClick={() => {
                window.location.href = "/create";
              }}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors"
              aria-label="Demo Concurrency"
            >
              Create User
            </button>

            <button
              onClick={() => {
                window.location.href = "/demo";
              }}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors"
              aria-label="Demo Concurrency"
            >
              Concurrency
            </button>

            <button
              onClick={() => {
                sessionStorage.clear();
                window.location.href = "/login";
              }}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white transition-colors"
              aria-label="Logout"
            >
              <LogOut size={18} />
              Logout
            </button>
          </div>

        </div>

        {/* Search Bar */}
        <div className="w-full max-w-3xl mb-8 flex gap-2">
          <Input
            placeholder="Search users..."
            className="flex-1"
            value={search}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setSearch(e.target.value)
            }
            onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
              if (e.key === "Enter") {
                const q = String(search ?? "").trim();
                if (q.length === 0) return;
                router.push(`/search?query=${encodeURIComponent(q)}`);
              }
            }}
          />
          <button
            onClick={() => {
              const q = String(search ?? "").trim();
              if (q.length === 0) return;
              router.push(`/search?query=${encodeURIComponent(q)}`);
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors"
            aria-label="Search"
          >
            <Search size={18} />
            Search
          </button>
        </div>

        {/* User Profile Card */}
        <div className="w-full max-w-3xl bg-white rounded-lg shadow-lg p-8">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-4xl font-bold text-gray-900">My Profile</h1>
            <button
              onClick={openEditor}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors"
              aria-label="Edit profile"
            >
              <Pencil size={18} />
              Edit
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Basic Information */}
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  User ID
                </label>
                <p className="text-lg text-gray-900 bg-gray-50 p-3 rounded-lg font-mono">
                  {userInfo?.user_id ?? "-"}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Username
                </label>
                <p className="text-lg text-gray-900 bg-gray-50 p-3 rounded-lg">
                  {userInfo?.username ?? "-"}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  First Name
                </label>
                <p className="text-lg text-gray-900 bg-gray-50 p-3 rounded-lg">
                  {userInfo?.first_name ?? "-"}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Last Name
                </label>
                <p className="text-lg text-gray-900 bg-gray-50 p-3 rounded-lg">
                  {userInfo?.last_name ?? "-"}
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
                  {userInfo?.city || "Not specified"}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Country
                </label>
                <p className="text-lg text-gray-900 bg-gray-50 p-3 rounded-lg">
                  {userInfo?.country || "Not specified"}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Zip Code
                </label>
                <p className="text-lg text-gray-900 bg-gray-50 p-3 rounded-lg">
                  {userInfo?.zipcode || "Not specified"}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Gender
                </label>
                <p className="text-lg text-gray-900 bg-gray-50 p-3 rounded-lg">
                  {userInfo?.gender || "Not specified"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {isEditing && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-2xl bg-white rounded-lg shadow-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold">Edit Profile</h3>
              <button
                className="text-gray-600 hover:text-gray-800"
                onClick={() => setIsEditing(false)}
                aria-label="Close edit"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <label className="space-y-1">
                <div className="text-xs font-medium">Username</div>
                <Input
                  value={form.username}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setForm({ ...form, username: e.target.value })
                  }
                />
              </label>

              <label className="space-y-1">
                <div className="text-xs font-medium">First Name</div>
                <Input
                  value={form.first_name}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setForm({ ...form, first_name: e.target.value })
                  }
                />
              </label>

              <label className="space-y-1">
                <div className="text-xs font-medium">Last Name</div>
                <Input
                  value={form.last_name}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setForm({ ...form, last_name: e.target.value })
                  }
                />
              </label>

              <label className="space-y-1">
                <div className="text-xs font-medium">City</div>
                <Input
                  value={form.city}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setForm({ ...form, city: e.target.value })
                  }
                />
              </label>

              <label className="space-y-1">
                <div className="text-xs font-medium">Country</div>
                <Input
                  value={form.country}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setForm({ ...form, country: e.target.value })
                  }
                />
              </label>

              <label className="space-y-1">
                <div className="text-xs font-medium">Zip Code</div>
                <Input
                  value={form.zipcode}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setForm({ ...form, zipcode: e.target.value })
                  }
                />
              </label>

              <label className="space-y-1 md:col-span-2">
                <div className="text-xs font-medium">Gender</div>
                <select
                  value={form.gender}
                  onChange={(e) => setForm({ ...form, gender: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                >
                  <option value="">Select</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </label>
            </div>

            {/* Error / Success */}
            <div className="mt-4">
              {editError && (
                <div className="text-sm text-red-600">{editError}</div>
              )}
              {editSuccess && (
                <div className="text-sm text-green-600">{editSuccess}</div>
              )}
            </div>

            {/* Actions */}
            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                className="px-4 py-2 rounded bg-gray-100 hover:bg-gray-200"
                onClick={() => setIsEditing(false)}
                disabled={updateMutation.isPending}
              >
                Cancel
              </button>
              <button
                className={`px-4 py-2 rounded text-white ${
                  updateMutation.isPending
                    ? "bg-blue-300"
                    : "bg-blue-600 hover:bg-blue-700"
                }`}
                onClick={submitEdit}
                disabled={updateMutation.isPending}
              >
                {updateMutation.isPending ? "Saving..." : "Save changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
