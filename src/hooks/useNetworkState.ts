import { useState, useEffect } from 'react';

// Define the possible network quality types
type NetworkStatus = 'good' | 'moderate' | 'poor';

// Function to check the current network status using the browser's Network Information API
const getNetworkStatus = (): NetworkStatus => {
  // Access the connection object (works across different browser prefixes)
  const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
  
  // If the browser doesn't support the API, default to 'good'
  if (!connection) return 'good'; 

  // Check the 'effectiveType' property which estimates connection quality
  const effectiveType = connection.effectiveType;
  switch (effectiveType) {
    case '4g':
      return 'good'; // Treat 4G as good
    case '3g':
      return 'moderate'; // Treat 3G as moderate
    case '2g':
    case 'slow-2g':
      return 'poor'; // Treat 2G and slow-2G as poor
    default:
      return 'good'; // Assume good for unknown types or faster connections
  }
};

// Custom React hook to manage and update the network status
export const useNetworkState = () => {
  // Initialize state with the current network status
  const [status, setStatus] = useState<NetworkStatus>(getNetworkStatus());

  useEffect(() => {
    // Function to update the status state
    const updateStatus = () => setStatus(getNetworkStatus());
    
    // Get the connection object again
    const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
    
    // If the API is supported, listen for changes in network status
    if (connection) {
      connection.addEventListener('change', updateStatus);
      // Clean up the event listener when the component unmounts
      return () => {
        connection.removeEventListener('change', updateStatus);
      };
    }
  }, []); // Only run this effect once when the component mounts

  // Return the current network status
  return status;
};