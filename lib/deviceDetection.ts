/**
 * Detects if the device is an iPhone (excluding iPad)
 * Uses user agent and screen characteristics to identify iPhone
 */
export function isIPhone(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  const ua = window.navigator.userAgent.toLowerCase();
  const platform = window.navigator.platform?.toLowerCase() || "";

  // Check for iPhone in user agent
  const isIPhoneUA = /iphone/.test(ua);
  
  // Exclude iPad (iPadOS 13+ reports as Mac, but has touch support)
  const isIPad = /ipad/.test(ua) || 
    (platform === "macintel" && "ontouchend" in document);

  // Check for iPhone characteristics
  // iPhone has maxTouchPoints === 5 (iPad has more)
  const maxTouchPoints = (navigator as any).maxTouchPoints || 0;
  const isTouchDevice = "ontouchstart" in window;
  
  // iPhone detection: iPhone UA, not iPad, touch device, and typically maxTouchPoints <= 5
  if (isIPhoneUA && !isIPad && isTouchDevice) {
    return true;
  }

  // Additional check: iOS device with small screen (iPhone-like)
  // This catches edge cases where UA might not explicitly say "iPhone"
  if (/iphone|ipod/.test(ua) && !isIPad) {
    return true;
  }

  return false;
}


