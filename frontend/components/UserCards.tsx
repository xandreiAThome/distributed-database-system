import React from 'react'

const UserCards = ({ name }: any) => {
  return (
    <div className="w-96 p-3 text-center border border-gray-400 rounded-md text-gray-700 bg-white shadow-sm hover:border-blue-500 transition-colors">
      {name}
    </div>
  )
}

export default UserCards