import { useEffect } from "react";

/**
 * Hook that triggers a browser confirmation dialog when the user attempts to 
 * leave the page or close the tab, if enabled.
 * 
 * @param enabled - Whether the warning should be active
 * @param message - The message to display (note: most modern browsers show a generic message)
 */
export function useBeforeUnload(enabled: boolean, message?: string) {
  useEffect(() => {
    if (!enabled) return;

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      const warningMessage = message || "Leave page? Your escrow draft will not be saved.";
      
      event.preventDefault();
      // Required for Chrome/Firefox/Safari
      event.returnValue = warningMessage;
      
      return warningMessage;
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [enabled, message]);
}
