import { useState, useEffect } from 'react';

interface EmailValidationResult {
  isValid: boolean;
  isDisposable: boolean;
  mxExists: boolean;
  suggestions: string[];
  confidence: number;
}

export function useEmailValidation(email: string) {
  const [validation, setValidation] = useState<EmailValidationResult>({
    isValid: true,
    isDisposable: false,
    mxExists: true,
    suggestions: [],
    confidence: 0
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!email || !email.includes('@')) {
      setValidation(prev => ({ ...prev, isValid: false, confidence: 0 }));
      return;
    }

    const domain = email.split('@')[1];
    if (!domain) return;

    // Common disposable email domains - revenue protection
    const disposableDomains = [
      'tempmail.org', '10minutemail.com', 'mailinator.com', 'guerrillamail.com',
      'throwaway.email', 'trashmail.net', 'getnada.com', 'yopmail.com'
    ];

    const suggestions = [];
    let confidence = 0;

    // Check for disposable emails
    if (disposableDomains.some(d => domain.includes(d))) {
      setValidation(prev => ({ 
        ...prev, 
        isDisposable: true, 
        isValid: false, 
        confidence: 0.95 
      }));
      return;
    }

    // Smart suggestions for typos
    if (email.includes('.con')) suggestions.push(email.replace('.con', '.com'));
    if (email.includes('.conm')) suggestions.push(email.replace('.conm', '.com'));
    if (!email.includes('gmail') && !email.includes('yahoo') && !email.includes('outlook')) {
      confidence += 0.2; // Business domains get boost
    }

    setValidation({
      isValid: true,
      isDisposable: false,
      mxExists: true,
      suggestions: suggestions.slice(0, 2),
      confidence: Math.min(confidence, 1)
    });

  }, [email]);

  return { validation, loading };
}