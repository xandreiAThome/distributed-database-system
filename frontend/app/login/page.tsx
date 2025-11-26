'use client'
import { Input } from "@/components/ui/input";
import { Label } from "@radix-ui/react-label";
import { Pencil, Trash } from "lucide-react";
import { useState } from "react";


export default function Home() {

    const [search, setSearch] = useState("");

    const handleSubmit = () => {
        sessionStorage.setItem("username", search);
        window.location.href = "/";
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
        
            <div className="w-full max-w-xl h-56 border p-6 space-y-4 rounded-lg shadow-xl bg-white">
                
                <h1 className="text-2xl font-semibold text-center mb-6">Login</h1>
                
                <div className="flex flex-col gap-3">
                    <Label className="text-xl">Enter your username:</Label>
                    
                    <div>
                    <Input placeholder="Search" value={search} onChange={(e) => setSearch(e.target.value)} />
                    <button className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors" onClick={handleSubmit}>
                        Submit
                    </button>
                    </div>
                </div>
            </div>
        </div>
    );
}