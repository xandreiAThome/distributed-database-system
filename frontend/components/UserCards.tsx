import React from 'react'
interface UserCardProps {
  name: string;
  username: string;
  city: string;
  country: string;
  gender: string;
  id: string;
}


const UserCards = ({ name, username, city, country, gender, id }: UserCardProps) => {
  return (
    <div className="flex items-between justify-between w-96 p-3 text-center border border-gray-400 rounded-md text-gray-700 bg-white shadow-sm hover:border-blue-500 transition-colors">
      <div>
        <h2 className="text-lg font-semibold mb-1">{name}</h2>
      </div>
      <div className="text-sm text-gray-600 space-y-1">
        <h2 className="text-lg font-semibold mb-1">{username}</h2>
      </div>
    </div>
  );
}

export default UserCards