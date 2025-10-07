import React, { useEffect } from 'react';

export function ButtonTestComponent() {
  useEffect(() => {
    // Only enable button testing in development
    if (import.meta.env.MODE !== 'development') {
      return;
    }
    
    // Add a comprehensive button listener that works with any button
    const handleButtonClick = (event: Event) => {
      const target = event.target as HTMLElement;
      
      // Check if it's a button or button-like element
      if (target.tagName === 'BUTTON' || 
          target.closest('button') || 
          target.getAttribute('role') === 'button' ||
          target.classList.contains('btn') ||
          target.classList.contains('button')) {
        
        const buttonText = target.textContent?.trim() || '';
        const buttonTitle = target.getAttribute('title') || '';
        const buttonClass = target.className || '';
        
        console.log(`🔘 Button clicked: "${buttonText}" (title: "${buttonTitle}")`);
        console.log(`   Element: ${target.tagName}, Classes: ${buttonClass}`);
        
        // Also check for specific button patterns
        if (buttonText.includes('Add Task')) {
          console.log('✅ Add Task button detected!');
        }
        if (buttonText.includes('Complete') || buttonText.includes('✓')) {
          console.log('✅ Complete button detected!');
        }
        if (buttonText.includes('Add Event')) {
          console.log('✅ Add Event button detected!');
        }
        if (buttonText.includes('Create Script')) {
          console.log('✅ Create Script button detected!');
        }
        if (buttonText.includes('Add Transaction')) {
          console.log('✅ Add Transaction button detected!');
        }
        if (buttonTitle.includes('Brief')) {
          console.log('✅ Brief button detected!');
        }
        if (buttonTitle.includes('End Day')) {
          console.log('✅ End Day button detected!');
        }
      }
    };

    // Add the event listener
    document.addEventListener('click', handleButtonClick, true); // Use capture phase

    console.log('🧪 Button test listeners added - click any button to test!');
    console.log('📋 Available buttons to test:');
    console.log('  - Header: Brief, End Day, Notifications, Profile, Logout');
    console.log('  - Tasks: Add Task, Complete, Task items');
    console.log('  - Calendar: Add Event, Edit, Event items');
    console.log('  - Scripts: Create Script, Run, Edit, Copy, Delete');
    console.log('  - Financial: Add Transaction, Edit, Account items');
    console.log('🎯 All button clicks will be logged to console!');

    // Cleanup function
    return () => {
      document.removeEventListener('click', handleButtonClick, true);
    };
  }, []);

  return null; // This component doesn't render anything
}
