'use client';

import { Input } from "@/components/ui/input";
import axios from "axios";
import { Pencil, Trash } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface UserInfo {
  user_id: string;
  username: string;
  first_name: string;
  last_name: string;
  city: string;
  country: string;
  zipcode: string;
  gender: string;
}

export default function Home() {
  const router = useRouter();

  // Search state (redirects to /search on Enter)
  const [search, setSearch] = useState("");

  const [showMenu, setShowMenu] = useState(false);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Edit modal & form states
  const [isEditing, setIsEditing] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
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

  useEffect(() => {
    async function getUserInfo() {
      const userId = sessionStorage.getItem("userId");
      if (!userId) {
        window.location.href = "/login";
        return;
      }
      try {
        const response = await axios.get(`http://localhost:4000/users/${userId}`);
        setUserInfo(response.data);
      } catch (err: any) {
        setError("Failed to fetch user info.");
      } finally {
        setLoading(false);
      }
    }
    getUserInfo();
  }, []);

  // Prefill form when opening editor
  function openEditor() {
    setShowMenu(false);
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

  // Submit update to provided API
  async function submitEdit() {
    const validationError = validateForm();
    if (validationError) {
      setEditError(validationError);
      return;
    }

    setEditLoading(true);
    setEditError(null);
    setEditSuccess(null);

    try {
      // NOTE: using the endpoint you gave for update
      const updateUrl = "http://localhost:4000/users/1";
      // Use PATCH to send only changed fields
      const payload = {
        username: form.username,
        first_name: form.first_name,
        last_name: form.last_name,
        city: form.city,
        country: form.country,
        zipcode: form.zipcode,
        gender: form.gender,
      };

      const response = await axios.patch(updateUrl, payload);
      // If API returns the updated user, use it; otherwise merge optimistic update
      const updated = response.data ?? { ...userInfo, ...payload };

      setUserInfo(updated);
      setEditSuccess("Profile updated.");
      // close after a short moment for smooth UX
      setTimeout(() => {
        setIsEditing(false);
        setEditSuccess(null);
      }, 900);
    } catch (err: any) {
      setEditError(
        err?.response?.data?.message ?? "Failed to update profile. Try again."
      );
    } finally {
      setEditLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-600">
        Loading...
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center text-red-600">
        {error}
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen flex items-center justify-center p-4 bg-gray-100">
        <div className="w-full max-w-2xl bg-white shadow-xl rounded-xl p-8 space-y-6">
          <h1 className="text-3xl font-bold text-center">Dashboard</h1>

          {/* Search Bar (press Enter to redirect to /search?query=...) */}
          <Input
            placeholder="Search..."
            className="mt-4"
            value={search}
            onChange={(e: any) => setSearch(e.target.value)}
            onKeyDown={(e: any) => {
              if (e.key === "Enter") {
                const q = String(search ?? "").trim();
                if (q.length === 0) return;
                router.push(`/search?query=${encodeURIComponent(q)}`);
              }
            }}
          />

          {/* User Info Card */}
          <div className="border border-gray-200 rounded-xl p-6 relative shadow-sm bg-gray-50">
            <h2 className="text-xl font-semibold mb-4">User Details</h2>

            <div className="grid grid-cols-2 gap-2 text-sm">
              <div><span className="font-medium">User ID:</span> {userInfo?.user_id ?? "-"}</div>
              <div><span className="font-medium">Username:</span> {userInfo?.username ?? "-"}</div>
              <div><span className="font-medium">First Name:</span> {userInfo?.first_name ?? "-"}</div>
              <div><span className="font-medium">Last Name:</span> {userInfo?.last_name ?? "-"}</div>
              <div><span className="font-medium">City:</span> {userInfo?.city ?? "-"}</div>
              <div><span className="font-medium">Country:</span> {userInfo?.country ?? "-"}</div>
              <div><span className="font-medium">Zip Code:</span> {userInfo?.zipcode ?? "-"}</div>
              <div><span className="font-medium">Gender:</span> {userInfo?.gender ?? "-"}</div>
            </div>

            {/* Three-dot menu */}
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="absolute top-4 right-4 p-2 hover:bg-gray-200 rounded-lg transition"
              aria-label="Open menu"
            >
              <div className="space-y-1">
                <div className="w-5 h-0.5 bg-gray-600" />
                <div className="w-5 h-0.5 bg-gray-600" />
                <div className="w-5 h-0.5 bg-gray-600" />
              </div>
            </button>

            {/* Dropdown menu */}
            {showMenu && (
              <div className="absolute top-14 right-4 bg-white border border-gray-300 rounded-lg shadow-lg overflow-hidden w-44 z-20">
                <button
                  className="flex items-center gap-2 px-4 py-3 w-full text-left hover:bg-blue-50 text-gray-700"
                  onClick={openEditor}
                >
                  <Pencil size={16} /> Edit
                </button>
              </div>
            )}
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
                  onChange={(e: any) => setForm({ ...form, username: e.target.value })}
                />
              </label>

              <label className="space-y-1">
                <div className="text-xs font-medium">First Name</div>
                <Input
                  value={form.first_name}
                  onChange={(e: any) => setForm({ ...form, first_name: e.target.value })}
                />
              </label>

              <label className="space-y-1">
                <div className="text-xs font-medium">Last Name</div>
                <Input
                  value={form.last_name}
                  onChange={(e: any) => setForm({ ...form, last_name: e.target.value })}
                />
              </label>

              <label className="space-y-1">
                <div className="text-xs font-medium">City</div>
                <Input value={form.city} onChange={(e: any) => setForm({ ...form, city: e.target.value })} />
              </label>

              <label className="space-y-1">
                <div className="text-xs font-medium">Country</div>
                <Input value={form.country} onChange={(e: any) => setForm({ ...form, country: e.target.value })} />
              </label>

              <label className="space-y-1">
                <div className="text-xs font-medium">Zip Code</div>
                <Input value={form.zipcode} onChange={(e: any) => setForm({ ...form, zipcode: e.target.value })} />
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
              {editError && <div className="text-sm text-red-600">{editError}</div>}
              {editSuccess && <div className="text-sm text-green-600">{editSuccess}</div>}
            </div>

            {/* Actions */}
            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                className="px-4 py-2 rounded bg-gray-100 hover:bg-gray-200"
                onClick={() => setIsEditing(false)}
                disabled={editLoading}
              >
                Cancel
              </button>
              <button
                className={`px-4 py-2 rounded text-white ${
                  editLoading ? "bg-blue-300" : "bg-blue-600 hover:bg-blue-700"
                }`}
                onClick={submitEdit}
                disabled={editLoading}
              >
                {editLoading ? "Saving..." : "Save changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
