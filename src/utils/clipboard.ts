/**
 * CLIPBOARD UTILITY
 * Robust clipboard copy with fallback methods
 */

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    // Try modern Clipboard API first
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    console.warn('Clipboard API failed, trying fallback method:', error);
    
    // Fallback: Use legacy execCommand method
    try {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      
      // Make textarea invisible but functional
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      textArea.style.opacity = '0';
      
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      
      // Try to copy using execCommand
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);
      
      if (successful) {
        return true;
      } else {
        throw new Error('execCommand copy failed');
      }
    } catch (fallbackError) {
      console.error('All copy methods failed:', fallbackError);
      return false;
    }
  }
}

/**
 * Select text in an element for manual copy
 * Useful when clipboard API is blocked
 */
export function selectText(element: HTMLElement): void {
  try {
    const selection = window.getSelection();
    const range = document.createRange();
    range.selectNodeContents(element);
    selection?.removeAllRanges();
    selection?.addRange(range);
  } catch (error) {
    console.error('Failed to select text:', error);
  }
}

/**
 * Copy with automatic fallback to text selection
 * Returns true if copied, false if user needs to manually copy
 */
export async function copyWithFallback(
  text: string,
  onSuccess?: () => void,
  onFallback?: () => void
): Promise<'copied' | 'selected' | 'failed'> {
  const success = await copyToClipboard(text);
  
  if (success) {
    onSuccess?.();
    return 'copied';
  } else {
    onFallback?.();
    return 'selected';
  }
}
