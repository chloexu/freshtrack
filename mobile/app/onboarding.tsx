import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { T } from '../constants/theme';

type Step = 'auth' | 'meal_times';
type Mode = 'register' | 'login';

export default function Onboarding() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('auth');
  const [mode, setMode] = useState<Mode>('register');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [lunchTime, setLunchTime] = useState('12:00');
  const [dinnerTime, setDinnerTime] = useState('18:30');

  function handleAuth() {
    // Mock: skip validation, go to step 2
    setStep('meal_times');
  }

  function handleGetStarted() {
    // Mock: skip saving, navigate to tabs
    router.replace('/(tabs)');
  }

  if (step === 'meal_times') {
    return (
      <SafeAreaView style={s.safe}>
        <KeyboardAvoidingView style={s.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <Text style={s.title}>When do you eat?</Text>
          <Text style={s.subtitle}>We'll use these times to schedule reminders.</Text>

          <Text style={s.label}>Lunch time</Text>
          <TextInput
            style={s.input}
            value={lunchTime}
            onChangeText={setLunchTime}
            placeholder="12:00"
            placeholderTextColor={T.inkLight}
          />

          <Text style={s.label}>Dinner time</Text>
          <TextInput
            style={s.input}
            value={dinnerTime}
            onChangeText={setDinnerTime}
            placeholder="18:30"
            placeholderTextColor={T.inkLight}
          />

          <TouchableOpacity style={s.btn} onPress={handleGetStarted} activeOpacity={0.8}>
            <Text style={s.btnText}>Get started →</Text>
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.safe}>
      <KeyboardAvoidingView style={s.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Text style={s.title}>FreshTrack</Text>
        <Text style={s.subtitle}>Zero-waste grocery tracking.</Text>

        <TextInput
          style={s.input}
          value={email}
          onChangeText={setEmail}
          placeholder="Email"
          placeholderTextColor={T.inkLight}
          autoCapitalize="none"
          keyboardType="email-address"
        />
        <TextInput
          style={s.input}
          value={password}
          onChangeText={setPassword}
          placeholder="Password"
          placeholderTextColor={T.inkLight}
          secureTextEntry
        />

        <TouchableOpacity style={s.btn} onPress={handleAuth} activeOpacity={0.8}>
          <Text style={s.btnText}>
            {mode === 'register' ? 'Create account' : 'Sign in'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => setMode(mode === 'register' ? 'login' : 'register')}>
          <Text style={s.toggle}>
            {mode === 'register'
              ? 'Already have an account? Sign in'
              : 'New here? Create account'}
          </Text>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: T.cream },
  container: { flex: 1, justifyContent: 'center', padding: 24 },
  title: { fontSize: 26, fontWeight: '700', color: T.ink, fontFamily: 'PlusJakartaSans_700Bold', letterSpacing: -0.5, marginBottom: 4 },
  subtitle: { fontSize: 13, color: T.inkMid, fontFamily: 'DMSans_400Regular', marginBottom: 32 },
  label: { fontSize: 13, color: T.inkMid, fontFamily: 'DMSans_400Regular', marginBottom: 6 },
  input: {
    backgroundColor: T.creamDark,
    borderWidth: 1,
    borderColor: T.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: T.ink,
    fontFamily: 'DMSans_400Regular',
    marginBottom: 12,
  },
  btn: {
    backgroundColor: T.green700,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  btnText: { color: T.white, fontSize: 16, fontWeight: '600', fontFamily: 'DMSans_600SemiBold' },
  toggle: { textAlign: 'center', color: T.inkLight, fontFamily: 'DMSans_400Regular', fontSize: 13, marginTop: 16 },
});
