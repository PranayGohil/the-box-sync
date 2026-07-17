import { useEffect, useCallback } from 'react';

const useBarcodeScanner = (onScan, { minLength = 6, timeout = 50 } = {}) => {
  useEffect(() => {
    let barcodeString = '';
    let lastKeyTime = 0;

    const handleKeyDown = (e) => {
      // Ignore keydown if target is an input or textarea
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        return;
      }

      const currentTime = Date.now();
      
      // If time since last keypress is too long, reset string (not a scanner)
      if (barcodeString.length > 0 && currentTime - lastKeyTime > timeout) {
        barcodeString = '';
      }

      lastKeyTime = currentTime;

      // Scanners typically send 'Enter' (key code 13) at the end of the scan
      if (e.key === 'Enter') {
        if (barcodeString.length >= minLength) {
          onScan(barcodeString);
        }
        barcodeString = '';
      } else if (e.key.length === 1) { // Ignore meta keys (Shift, Ctrl, etc.)
        barcodeString += e.key;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onScan, minLength, timeout]);
};

export default useBarcodeScanner;
