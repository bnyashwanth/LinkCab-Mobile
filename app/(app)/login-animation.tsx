import React from 'react';
import LoginAnimation from '../../components/LoginAnimation';
import { useRouter } from 'expo-router';

export default function LoginAnimationScreen() {
  const router = useRouter();
  
  // Replace with your actual video file
  const videoSource = require('../../assets/videos/login-animation.mp4');
  
  const handleAnimationComplete = () => {
    // Navigate to home after animation completes
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
