// Example: How to use the LoginAnimation component
// Add this to your login success handler or auth flow

import React from 'react';
import LoginAnimation from '../components/LoginAnimation';

// Example usage in your login/auth component:
export default function LoginSuccessScreen() {
  // Your video file - replace with your actual video path
  const videoSource = require('../assets/videos/login-animation.mp4');
  
  const handleAnimationComplete = () => {
    // Navigate to home after animation
    router.replace('/(app)/home');
  };

  return (
    <LoginAnimation 
      videoSource={videoSource}
      onComplete={handleAnimationComplete}
      autoPlay={true}
    />
  );
}

// Alternative: Add to your existing login flow
// In your AuthContext or login component:
const handleLoginSuccess = async () => {
  try {
    // Your existing login logic
    await signIn(email, password);
    
    // Show video animation instead of direct navigation
    router.push('/login-animation');
    
  } catch (error) {
    console.error('Login failed:', error);
  }
};
