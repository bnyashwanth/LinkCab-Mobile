/**
 * Utility functions for handling ride IDs
 */

/**
 * Converts a ride ID to a valid UUID format
 * This is used to handle legacy ride IDs that might not be in UUID format
 */
export function getValidRideId(rideId: string): string {
  // If the rideId is already a valid UUID, return it as is
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (uuidRegex.test(rideId)) {
    return rideId;
  }
  
  // For non-UUID IDs, create a deterministic UUID based on the rideId
  // This ensures consistency while maintaining UUID format
  const hash = simpleHash(rideId);
  return `${hash.slice(0, 8)}-${hash.slice(8, 12)}-${hash.slice(12, 16)}-${hash.slice(16, 20)}-${hash.slice(20, 32)}`;
}

/**
 * Simple hash function to convert string to hexadecimal
 */
function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  // Convert to hexadecimal and ensure it's 32 characters
  const hex = Math.abs(hash).toString(16).padStart(8, '0');
  return hex.repeat(4); // Repeat to get 32 characters
}

/**
 * Validates if a ride ID is in the correct format
 */
export function isValidRideId(rideId: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(rideId);
}
