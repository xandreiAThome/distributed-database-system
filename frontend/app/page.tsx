'use client'
import { Input } from "@/components/ui/input";
import axios from "axios";
import { Pencil, Trash } from "lucide-react";
import { useEffect, useState } from "react";

export default function Home() {
  const [showMenu, setShowMenu] = useState(false);
  const [userInfo, setUserInfo] = useState(null);

  useEffect(() => {
    async function getUserInfo() {
      const username = sessionStorage.getItem("username");
      if (!username) {
        window.location.href = "/login";
      }

      const response = await axios.get("/users/:id", { params: { id: username } });
      setUserInfo(response.data);
    }
    getUserInfo();
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
      
      <div className="w-full max-w-2xl border p-6 space-y-4 rounded-lg shadow-xl bg-white">
        
        <h1 className="text-2xl font-semibold text-center mb-6">Landing Dashboard</h1>
        
        <Input placeholder="Search"/>

        <div className="border border-gray-300 rounded-md p-6 h-64 flex flex-col justify-between relative">
          
          <div className="flex items-center justify-center h-full">
            <p className="text-xl text-gray-500">Current User Info</p>
          </div>
          
          <div 
            className="absolute top-4 right-4 space-y-1 cursor-pointer hover:opacity-70 transition-opacity"
            onClick={() => setShowMenu(!showMenu)}
          >
            <div className="w-6 h-0.5 bg-gray-500"></div>
            <div className="w-6 h-0.5 bg-gray-500"></div>
            <div className="w-6 h-0.5 bg-gray-500"></div>
          </div>

          {showMenu && (
            <div className="absolute top-16 right-4 bg-white border border-gray-300 rounded-lg shadow-lg overflow-hidden z-10">
              <button 
                className="w-full px-6 py-3 text-left hover:bg-blue-50 transition-colors text-gray-700 flex items-center gap-2"
                onClick={() => {
                  setShowMenu(false);
                }}
              >
                <span><Pencil/></span>
                <span>Edit</span>
              </button>
              <button 
                className="w-full px-6 py-3 text-left hover:bg-red-50 transition-colors text-red-600 flex items-center gap-2 border-t border-gray-200"
                onClick={() => {
                  setShowMenu(false);
                }}
              >
                <span><Trash /></span>
                <span>Delete</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}