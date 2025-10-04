import React from 'react'

export const BrainLogo = ({ className = "w-8 h-8" }: { className?: string }) => {
  return (
    <div className={`${className} bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center`}>
      <svg 
        viewBox="0 0 24 24" 
        className="w-5 h-5 text-white"
        fill="currentColor" 
        stroke="none"
      >
        {/* Brain icon - filled version */}
        <path d="M12 2C8.5 2 6 4.5 6 8c0 1.5.5 2.5 1 3.5v6c0 2 1.5 3.5 3.5 3.5s3.5-1.5 3.5-3.5v-6c.5-1 1-2 1-3.5 0-3.5-2.5-6-6-6z" />
        <path d="M9 8h6" stroke="currentColor" strokeWidth="1" fill="none" />
        <path d="M9 12h6" stroke="currentColor" strokeWidth="1" fill="none" />
        <path d="M9 16h6" stroke="currentColor" strokeWidth="1" fill="none" />
      </svg>
    </div>
  )
}
