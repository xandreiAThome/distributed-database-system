"use client";

import { Input } from "@/components/ui/input";
import UserCards from "@/components/UserCards";
import axios from "axios";
import { useSearchParams } from "next/navigation";
import React, { useEffect, useState } from "react";

const SearchPage = () => {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("query") || "";

  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialQuery) fetchResults(initialQuery);
  }, [initialQuery]);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const timer = setTimeout(() => {
      fetchResults(query);
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  async function fetchResults(name: string) {
    setLoading(true);
    try {
      const response = await axios.get(
        `http://localhost:4000/users/search?limit=10&name=${encodeURIComponent(name)}`
      );
      setResults(response.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      fetchResults(query);
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center p-8 bg-gray-50">
      <h1 className="text-3xl font-semibold mb-8 mt-4">Search / Display Result Page</h1>
      <div className="w-full max-w-lg flex flex-col items-center gap-6">
        <Input
          placeholder="Search"
          className="w-full p-3 text-lg border-gray-400 rounded-md shadow-lg"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        {loading && <p className="text-gray-600 text-sm mt-2">Searching...</p>}
        <div className="flex flex-col gap-4 w-full items-center">
          {results.length > 0 ? (
            results.map((user) => (
              <UserCards
                key={user.userId}
                name={`${user.firstName} ${user.lastName}`}
                username={user.username}
                city={user.city}
                country={user.country}
                gender={user.gender}
                id={user.userId}
              />
            ))
          ) : (
            !loading &&
            query.trim() !== "" && <p className="text-gray-500 text-sm">No results found.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default SearchPage;