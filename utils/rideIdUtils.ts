/**
 * Utility functions for handling ride IDs and UUID conversion
 */

// Map old demo IDs to new UUIDs for backward compatibility
export const DEMO_ID_MAP: { [key: string]: string } = {
  'demo1': '550e8400-e29b-41d4-a716-446655440001',
  'demo2': '550e8400-e29b-41d4-a716-446655440002',
  'demo3': '550e8400-e29b-41d4-a716-446655440003',
  'demo4': '550e8400-e29b-41d4-a716-446655440004',
  'demo5': '550e8400-e29b-41d4-a716-446655440005',
  'demo6': '550e8400-e29b-41d4-a716-446655440006',
  'demo7': '550e8400-e29b-41d4-a716-446655440007',
  'demo8': '550e8400-e29b-41d4-a716-446655440008',
  'demo9': '550e8400-e29b-41d4-a716-446655440009',
  'demo10': '550e8400-e29b-41d4-a716-446655440010',
  'demo11': '550e8400-e29b-41d4-a716-446655440011',
  'demo12': '550e8400-e29b-41d4-a716-446655440012',
  'demo13': '550e8400-e29b-41d4-a716-446655440013',
  'demo14': '550e8400-e29b-41d4-a716-446655440014',
  'demo15': '550e8400-e29b-41d4-a716-446655440015',
};

/**
 * Convert old demo ID to new UUID
 * @param rideId - The ride ID (could be old demo ID or new UUID)
 * @returns Valid UUID or null if invalid
 */
export const getValidRideId = (rideId: string | undefined): string | null => {
  if (!rideId) return null;
  
  // If it's already a UUID format, return as-is
  if (rideId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
    return rideId;
  }
  
  // Convert old demo IDs to new UUIDs
  return DEMO_ID_MAP[rideId] || rideId;
};

/**
 * Check if a ride ID is valid (either UUID or mapped demo ID)
 * @param rideId - The ride ID to validate
 * @returns boolean indicating if the ID is valid
 */
export const isValidRideId = (rideId: string | undefined): boolean => {
  if (!rideId) return false;
  
  // Check if it's a valid UUID
  if (rideId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
    return true;
  }
  
  // Check if it's a mapped demo ID
  return rideId in DEMO_ID_MAP;
};
