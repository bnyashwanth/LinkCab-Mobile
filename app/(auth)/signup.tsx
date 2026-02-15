import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { captureException } from '@/utils/sentry';
import { validatePhone } from '@/utils/validation';

const DEMO_OTP = '123456';

export default function SignupScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [otpCooldownSeconds, setOtpCooldownSeconds] = useState(0);
  const [loading, setLoading] = useState(false);
  const [canSignup, setCanSignup] = useState(true);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);
  const router = useRouter();
  const { signUp } = useAuth();

  // Cooldown timer
  useEffect(() => {
    if (cooldownSeconds > 0) {
      const timer = setTimeout(() => {
        setCooldownSeconds(cooldownSeconds - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      setCanSignup(true);
    }
  }, [cooldownSeconds]);

  useEffect(() => {
    if (otpCooldownSeconds > 0) {
      const timer = setTimeout(() => {
        setOtpCooldownSeconds(otpCooldownSeconds - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [otpCooldownSeconds]);

  const handleSendOtp = () => {
    if (!phoneNumber || !validatePhone(phoneNumber)) {
      Alert.alert('Invalid Phone', 'Please enter a valid mobile number');
      return;
    }

    setOtpSent(true);
    setOtpVerified(false);
    setOtp('');
    setOtpCooldownSeconds(60);

    Alert.alert(
      'OTP Sent',
      `We sent a verification code to ${phoneNumber}.\n\nDemo OTP: ${DEMO_OTP}`
    );
  };

  const handleVerifyOtp = () => {
    if (!otpSent) {
      Alert.alert('Send OTP', 'Please request an OTP first');
      return;
    }

    if (otp.trim() !== DEMO_OTP) {
      Alert.alert('Invalid OTP', 'The code you entered is incorrect');
      return;
    }

    setOtpVerified(true);
    Alert.alert('Verified', 'Your mobile number is verified');
  };

  const handleSignUp = async () => {
    if (!canSignup) {
      Alert.alert('Please Wait', `Please wait ${cooldownSeconds} seconds before trying again.`);
      return;
    }

    if (!email || !password || !fullName || !phoneNumber) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    if (!validatePhone(phoneNumber)) {
      Alert.alert('Error', 'Please enter a valid mobile number');
      return;
    }

    if (!otpVerified) {
      Alert.alert('Verification Required', 'Please verify your mobile number using OTP');
      return;
    }

    setLoading(true);
    setCanSignup(false);
    try {
      const { error } = await signUp(email, password, fullName, phoneNumber);
      if (error) {
        // Handle rate limit error specifically
        if (error.message?.includes('rate limit') || error.message?.includes('too many requests')) {
          Alert.alert(
            'Rate Limit Exceeded',
            'Too many signup attempts. Please wait a few minutes before trying again, or use a different email address.',
            [{ text: 'OK' }]
          );
          // Set a 2-minute cooldown for rate limit errors
          setCooldownSeconds(120);
        } else {
          Alert.alert('Signup Error', error.message);
          // Set a 30-second cooldown for other errors
          setCooldownSeconds(30);
        }
      } else {
        Alert.alert(
          'Success',
          'Account created successfully! You can now log in.',
          [
            {
              text: 'OK',
              onPress: () => router.push('/(auth)/login'),
            },
          ]
        );
      }
    } catch (error) {
      captureException(error);
      Alert.alert('Error', 'An unexpected error occurred');
      setCooldownSeconds(30);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.content}>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Join LinkCab.in today</Text>

          <View style={styles.form}>
            <TextInput
              style={styles.input}
              placeholder="Full Name"
              value={fullName}
              onChangeText={setFullName}
              autoCapitalize="words"
              autoCorrect={false}
            />

            <TextInput
              style={styles.input}
              placeholder="Email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />

            <TextInput
              style={styles.input}
              placeholder="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />

            <TextInput
              style={styles.input}
              placeholder="Confirm Password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
            />

            <TextInput
              style={styles.input}
              placeholder="Mobile Number"
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              keyboardType="phone-pad"
            />

            <View style={styles.otpRow}>
              <TextInput
                style={[styles.input, styles.otpInput]}
                placeholder="Enter OTP"
                value={otp}
                onChangeText={setOtp}
                keyboardType="number-pad"
              />
              <TouchableOpacity
                style={[
                  styles.otpButton,
                  otpCooldownSeconds > 0 && styles.buttonDisabled
                ]}
                onPress={handleSendOtp}
                disabled={otpCooldownSeconds > 0}
              >
                <Text style={styles.otpButtonText}>
                  {otpCooldownSeconds > 0 ? `Resend in ${otpCooldownSeconds}s` : 'Send OTP'}
                </Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.verifyButton, otpVerified && styles.verifyButtonDone]}
              onPress={handleVerifyOtp}
            >
              <Text style={styles.verifyButtonText}>
                {otpVerified ? 'Verified' : 'Verify OTP'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.button, 
                (loading || !canSignup) && styles.buttonDisabled
              ]}
              onPress={handleSignUp}
              disabled={loading || !canSignup}
            >
              <Text style={styles.buttonText}>
                {loading 
                  ? 'Creating Account...' 
                  : !canSignup 
                    ? `Wait ${cooldownSeconds}s` 
                    : 'Sign Up'
                }
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.footer}>
            <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
              <Text style={styles.link}>Already have an account? Sign In</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContainer: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
    color: '#1a1a1a',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 32,
    color: '#666',
  },
  form: {
    marginBottom: 24,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  otpRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  otpInput: {
    flex: 1,
    marginBottom: 0,
  },
  otpButton: {
    backgroundColor: '#111827',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 110,
    alignItems: 'center',
  },
  otpButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  verifyButton: {
    backgroundColor: '#10B981',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 16,
  },
  verifyButtonDone: {
    backgroundColor: '#059669',
  },
  verifyButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    alignItems: 'center',
  },
  link: {
    color: '#007AFF',
    fontSize: 14,
  },
});
