import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Animated, Dimensions, TouchableOpacity, Text } from 'react-native';
import { Video, ResizeMode, AVPlaybackStatus } from 'expo-av';
import { useRouter } from 'expo-router';

const { width, height } = Dimensions.get('window');

interface LoginAnimationProps {
  videoSource: any;
  onComplete?: () => void;
  autoPlay?: boolean;
}

export default function LoginAnimation({ 
  videoSource, 
  onComplete, 
  autoPlay = true 
}: LoginAnimationProps) {
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);
  const fadeOutAnim = useRef(new Animated.Value(1)).current;
  const router = useRouter();
  const fallbackTimerRef = useRef<NodeJS.Timeout | null>(null);
  const hasCompletedRef = useRef(false);

  const handleVideoEnd = (status: AVPlaybackStatus) => {
    if (!status.isLoaded || status.isPlaying || status.isBuffering) return;
    handleComplete();
  };

  const handleComplete = () => {
    if (hasCompletedRef.current) return;
    hasCompletedRef.current = true;
    Animated.timing(fadeOutAnim, {
      toValue: 0,
      duration: 500,
      useNativeDriver: true,
    }).start(() => {
      if (onComplete) {
        onComplete();
      } else {
        router.replace('/(app)/home');
      }
    });
  };

  const handleSkip = () => {
    handleComplete();
  };

  useEffect(() => {
    // Fallback to ensure we navigate even if the video fails to load/play
    fallbackTimerRef.current = setTimeout(() => {
      if (!isVideoLoaded) {
        handleSkip();
      }
    }, 3000);

    return () => {
      if (fallbackTimerRef.current) {
        clearTimeout(fallbackTimerRef.current);
      }
    };
  }, [isVideoLoaded]);

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.videoContainer, { opacity: fadeOutAnim }]}>
        <Video
          source={videoSource}
          style={styles.video}
          resizeMode={ResizeMode.CONTAIN}
          shouldPlay={autoPlay && isVideoLoaded}
          isLooping={false}
          onPlaybackStatusUpdate={handleVideoEnd}
          onLoad={() => setIsVideoLoaded(true)}
        />
        
        {/* Skip button for better UX */}
        <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoContainer: {
    width: width,
    height: height,
    position: 'relative',
    backgroundColor: '#FFFFFF',
  },
  video: {
    width: '100%',
    height: '100%',
    backgroundColor: '#FFFFFF',
  },
  skipButton: {
    position: 'absolute',
    bottom: 100,
    alignSelf: 'center',
    backgroundColor: '#FFD700',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  skipText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});
