import { Input } from '@/components/ui/input'
import UserCards from '@/components/UserCards'
import React from 'react'

const SearchPage = () => {
  return (
    <div className='min-h-screen flex flex-col items-center p-8 bg-gray-50'>
      
      <h1 className="text-3xl font-semibold mb-8 mt-4">Search / Display Result Page</h1>

      <div className="w-full max-w-lg flex flex-col items-center gap-6">

        <Input 
          placeholder="Search" 
          className="w-full p-3 text-lg border-gray-400 rounded-md shadow-lg"
        />

        <div className='flex flex-col gap-4 w-full items-center'>
        
        <UserCards name="User1"/>
        <UserCards name="User2"/>
        <UserCards name="User3"/>
        <UserCards name="User4"/>
        <UserCards name="User5"/>

          
        </div>
      </div>
    </div>
  )
}

export default SearchPage