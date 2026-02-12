import React from 'react';
import { View, Text, StyleSheet, TextStyle } from 'react-native';
import { colors, borderRadius, spacing } from '@/constants/theme';

interface BadgeProps {
  children: React.ReactNode;
  style?: TextStyle;
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info';
}

export function Badge({ children, style, variant = 'primary' }: BadgeProps) {
  const getVariantStyle = () => {
    switch (variant) {
      case 'primary':
        return { backgroundColor: colors.primary[600] };
      case 'secondary':
        return { backgroundColor: colors.secondary[600] };
      case 'success':
        return { backgroundColor: colors.success[600] };
      case 'danger':
        return { backgroundColor: colors.danger[600] };
      case 'warning':
        return { backgroundColor: colors.warning[600] };
      case 'info':
        return { backgroundColor: colors.info[600] };
      default:
        return { backgroundColor: colors.primary[600] };
    }
  };

  return (
    <View style={[styles.badge, getVariantStyle(), style]}>
      <Text style={styles.text}>
        {children}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
    borderRadius: borderRadius.full,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text.inverse,
  },
});
