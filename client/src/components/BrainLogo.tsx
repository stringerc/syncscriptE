import React from 'react'

export const BrainLogo = ({ className = "w-8 h-8" }: { className?: string }) => {
  return (
    <div className={`${className} bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center`}>
      <svg 
        viewBox="0 0 24 24" 
        className="w-5 h-5 text-white"
        fill="none" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      >
        {/* Brain outline - simplified version */}
        <path d="M12 2C8 2 6 4 6 8c0 2 1 3 2 4v6c0 2 2 4 4 4s4-2 4-4v-6c1-1 2-2 2-4 0-4-2-6-6-6z" />
        <path d="M8 8h8" />
        <path d="M8 12h8" />
        <path d="M8 16h8" />
      </svg>
    </div>
  )
}
