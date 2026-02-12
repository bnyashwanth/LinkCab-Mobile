import React from 'react';
import { View, Image, StyleSheet } from 'react-native';

interface LinkCabLogoProps {
  size?: 'small' | 'medium' | 'large';
  style?: any;
}

export default function LinkCabLogo({ size = 'medium', style }: LinkCabLogoProps) {
  const getSize = () => {
    switch (size) {
      case 'small':
        return { width: 140, height: 42 };
      case 'large':
        return { width: 240, height: 72 };
      default:
        return { width: 180, height: 54 };
    }
  };

  const dimensions = getSize();

  return (
    <View style={[styles.container, style]}>
      <Image
        source={require('@/assets/linkcab-logo.png')}
        style={[styles.logo, dimensions]}
        resizeMode="contain"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logo: {
    // dimensions set dynamically
  },
});
