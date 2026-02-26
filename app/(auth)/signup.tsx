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

export default function SignupScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
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

  const handleSignUp = async () => {
    if (!canSignup) {
      Alert.alert('Please Wait', `Please wait ${cooldownSeconds} seconds before trying again.`);
      return;
    }

    if (!email || !password || !fullName) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    setCanSignup(false);
    try {
      const { error } = await signUp(email, password, fullName);
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
