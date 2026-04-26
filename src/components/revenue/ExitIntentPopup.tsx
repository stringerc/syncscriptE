import React, { useState, useEffect, useRef } from 'react';
import { X, Clock, Zap } from 'lucide-react';

interface ExitIntentPopupProps {
  onCheckout: () => void;
}

interface PopupPosition {
  top: string;
  left: string;
  opacity: number;
  transform: string;
}

export const ExitIntentPopup: React.FC<ExitIntentPopupProps> = ({ onCheckout }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const exitRef = useRef<boolean>(false);

  const showPopup = () => {
    if (document.hidden || exitRef.current || isVisible) return;
    
    setIsVisible(true);
    setIsAnimating(true);
    exitRef.current = true;
  };

  const closePopup = () => {
    setIsAnimating(false);
    setTimeout(() => {
      setIsVisible(false);
    }, 200);
  };

  const handleCheckout = () => {
    closePopup();
    onCheckout();
  };

  useEffect(() => {
    // Smart delay - wait 7.5 seconds before showing
    const delayTimer = setTimeout(() => {
      timeoutRef.current = setTimeout(showPopup, 7500);
    }, 7500);

    // Exit detection: fast mouse movement toward top
    const handleMouseMove = (e: MouseEvent) => {
      if (exitRef.current) return;
      
      const velocity = Math.abs(e.movementX) + Math.abs(e.movementY);
      const isExiting = e.clientY <= 50 && velocity > 20;
      
      if (isExiting && !exitRef.current) {
        exitRef.current = true;
        clearTimeout(timeoutRef.current!);
        showPopup();
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseleave', showPopup);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', showPopup);
      clearTimeout(delayTimer);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  if (!isVisible) return null;

  const popupStyle: PopupPosition = {
    top: '50%',
    left: '50%',
    opacity: isAnimating ? 1 : 0,
    transform: isAnimating ? 'translate(-50%, -50%) scale(1)' : 'translate(-50%, -50%) scale(0.9)'
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 transition-all duration-200"
      onClick={closePopup}
    >
      <div 
        className="bg-white rounded-xl shadow-2xl max-w-md mx-4 p-8 relative transform transition-all duration-200"
        style={popupStyle}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button 
          onClick={closePopup}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X size={20} />
        </button>

        {/* Content */}
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-yellow-100 p-3 rounded-full">
              <Clock className="text-yellow-600 h-8 w-8" />
            </div>
          </div>
          
          <h3 className="text-2xl font-bold text-gray-900 mb-2">
            Wait! Don't Miss Out
          </h3>
          
          <p className="text-gray-600 mb-6">
            Get SyncScript Pro at 50% off - limited time only
          </p>

          {/* Offer Details */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-center mb-2">
              <span className="text-3xl font-bold text-blue-600">$39.50</span>
              <span className="text-lg text-gray-500 line-through ml-2">$79.00</span>
            </div>
            <p className="text-sm font-medium text-purple-600 flex items-center justify-center">
              <Zap size={16} className="mr-1" />
              First month at 50% discount
            </p>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              onClick={handleCheckout}
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold py-3 px-6 rounded-lg hover:from-purple-700 hover:to-blue-700 transform hover:scale-105 transition-all"
            >
              Claim 50% Discount Now
            </button>
            
            <button 
              onClick={closePopup}
              className="w-full text-gray-600 hover:text-gray-800 text-sm"
            >
              No thanks, I'll pay full price later
            </button>
          </div>

          {/* Urgency indicator */}
          <div className="mt-4 text-xs text-gray-500">
            ⏳ Limited to next 27 users today
          </div>
        </div>
      </div>
    </div>
  );
};