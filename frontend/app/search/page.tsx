"use client";

import { Input } from "@/components/ui/input";
import UserCards from "@/components/UserCards";
import { useSearchParams, useRouter } from "next/navigation";
import React, { useEffect, useState, Suspense } from "react";
import { useSearchUsers } from "@/hooks/useUsers";
import { config } from "@/lib/config";
import { Home, ArrowLeft } from "lucide-react";

const SearchPageContent = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("query") || "";

  const [query, setQuery] = useState(initialQuery);
  const [debouncedQuery, setDebouncedQuery] = useState(initialQuery);

  // Debounce the query
  useEffect(() => {
    const timer = setTimeout(
      () => {
        setDebouncedQuery(query);
      },
      query.trim() ? config.search.debounceMs : 0
    );

    return () => clearTimeout(timer);
  }, [query]);

  // Fetch results with TanStack Query
  const { data: results = [], isLoading } = useSearchUsers(
    debouncedQuery,
    config.pagination.defaultLimit,
    !!debouncedQuery
  );

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      setDebouncedQuery(query);
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center p-8 bg-gray-50">
      {/* Navigation Bar */}
      <div className="w-full max-w-2xl mb-8 flex items-center justify-between">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-800 transition-colors"
          aria-label="Go back"
        >
          <ArrowLeft size={18} />
          Back
        </button>
        <button
          onClick={() => router.push("/")}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors"
          aria-label="Go to home"
        >
          <Home size={18} />
          Dashboard
        </button>
      </div>

      <h1 className="text-3xl font-semibold mb-8">
        Search / Display Result Page
      </h1>
      <div className="w-full max-w-lg flex flex-col items-center gap-6">
        <Input
          placeholder="Search"
          className="w-full p-3 text-lg border-gray-400 rounded-md shadow-lg"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        {isLoading && (
          <p className="text-gray-600 text-sm mt-2">Searching...</p>
        )}
        <div className="flex flex-col gap-4 w-full items-center">
          {results.length > 0
            ? results.map((user) => (
                <UserCards
                  key={user.user_id}
                  name={`${user.first_name} ${user.last_name}`}
                  username={user.username}
                  city={user.city}
                  country={user.country}
                  gender={user.gender}
                  id={user.user_id}
                />
              ))
            : !isLoading &&
              query.trim() !== "" && (
                <p className="text-gray-500 text-sm">No results found.</p>
              )}
        </div>
      </div>
    </div>
  );
};

function SearchPageWithSuspense() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SearchPageContent />
    </Suspense>
  );
}

export default SearchPageWithSuspense;
