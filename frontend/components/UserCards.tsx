import { Trash } from 'lucide-react';
import React from 'react';

interface UserCardProps {
  name: string;
  username: string;
  city: string;
  country: string;
  gender: string;
  id: string;
}

const UserCards = ({ name, username, city, country, gender, id }: UserCardProps) => {

  const handleDelete = async () => {
    try {
      await fetch(`http://localhost:4000/users/${id}`, {
        method: 'DELETE',
      });
      window.location.reload();
    } catch (error) {
      console.error(error);
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
        className="flex items-center gap-1 px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
      >
        <Trash size={16} /> 
      </button>
    </div>
  );
}

export default UserCards;