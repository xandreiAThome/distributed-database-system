"use client";

import React, { useState } from "react";
import { useCreateUser } from "@/hooks/useMutations";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";


const CreatePage = () => {
  const router = useRouter();
  const createUser = useCreateUser();

  const [formData, setFormData] = useState({
    username: "",
    first_name: "",
    last_name: "",
    city: "",
    country: "",
    zipcode: "",
    gender: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createUser.mutateAsync(formData);
      // Redirect to home page on success
      router.push("/");
    } catch (error) {
      console.error("Error creating user:", error);
    }
  };

  return (
    <div className="container mx-auto py-8 max-w-2xl">
      <div>
        <div>
          <h2>Create New User</h2>
          <p>
            Fill in the form below to create a new user
          </p>
        </div>
        <div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                name="username"
                value={formData.username}
                onChange={handleChange}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="first_name">First Name</Label>
                <Input
                  id="first_name"
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="last_name">Last Name</Label>
                <Input
                  id="last_name"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="country">Country</Label>
                <Input
                  id="country"
                  name="country"
                  value={formData.country}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="zipcode">Zipcode</Label>
                <Input
                  id="zipcode"
                  name="zipcode"
                  value={formData.zipcode}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="gender">Gender</Label>
                <Input
                  id="gender"
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <button
                type="submit"
                disabled={createUser.isPending}
                className="flex-1 bg-green-400 hover:bg-green-600 text-white p-2 rounded"
              >
                {createUser.isPending ? "Creating..." : "Create User"}
              </button>
              <button
                type="button"
                onClick={() => router.push("/")}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-black p-2 rounded"
              >
                Cancel
              </button>
            </div>

            {createUser.isError && (
              <p className="text-red-500 text-sm">
                Error: {createUser.error?.message || "Failed to create user"}
              </p>
            )}

            {createUser.isSuccess && (
              <p className="text-green-500 text-sm">
                User created successfully!
              </p>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreatePage;