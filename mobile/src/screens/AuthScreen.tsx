import React, { useMemo, useState } from 'react';
import {
  View, Text, TextInput, Pressable, StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator, ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '../store/theme';
import { useAuth } from '../store/auth';
import { Colors, radius, spacing } from '../theme/theme';
import { type } from '../theme/typography';
import { apiError } from '../api/client';
import GrahikaMark from '../components/GrahikaMark';

export default function AuthScreen({ navigation }: any) {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const s = useMemo(() => makeStyles(c), [c]);
  const { login, register } = useAuth();

  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submit = async () => {
    setError(''); setLoading(true);
    try {
      if (mode === 'login') await login(email.trim(), password);
      else await register(name.trim(), email.trim(), password, 'user');
      navigation.goBack();
    } catch (e) {
      setError(apiError(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, backgroundColor: c.bgBody }}>
      <ScrollView contentContainerStyle={{ flexGrow: 1, paddingTop: insets.top + 40, paddingHorizontal: spacing.xl, paddingBottom: insets.bottom + 24 }} keyboardShouldPersistTaps="handled">
        <View style={{ alignItems: 'center', marginBottom: spacing.xl }}>
          <GrahikaMark size={56} color={c.textPrimary} />
          <Text style={[type.wordmark, { color: c.textPrimary, marginTop: 12 }]}>GRAHIKA</Text>
          <Text style={[type.body, { color: c.textMuted, marginTop: 8, textAlign: 'center' }]}>
            Sub-arcsecond charts · 16 vargas · classical interpretation.
          </Text>
        </View>

        <View style={s.toggle}>
          {(['login','signup'] as const).map((m) => (
            <Pressable key={m} onPress={() => setMode(m)} style={[s.toggleItem, mode === m && s.toggleItemOn]}>
              <Text style={[type.cardTitle, { color: mode === m ? c.onAccent : c.textSecondary }]}>{m === 'login' ? 'Log in' : 'Create account'}</Text>
            </Pressable>
          ))}
        </View>

        {mode === 'signup' && (
          <TextInput value={name} onChangeText={setName} placeholder="Full name" placeholderTextColor={c.textMuted} style={s.input} />
        )}
        <TextInput value={email} onChangeText={setEmail} placeholder="Email" placeholderTextColor={c.textMuted} autoCapitalize="none" keyboardType="email-address" style={s.input} />
        <TextInput value={password} onChangeText={setPassword} placeholder="Password" placeholderTextColor={c.textMuted} secureTextEntry style={s.input} />

        {error ? <Text style={[type.body, { color: c.accentRed, marginTop: 4 }]}>{error}</Text> : null}

        <Pressable onPress={submit} disabled={loading} style={[s.cta, loading && { opacity: 0.7 }]}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={[type.button, { color: '#fff' }]}>{mode === 'login' ? 'Log in' : 'Create account'}</Text>}
        </Pressable>

        <Pressable onPress={() => navigation.goBack()} style={{ marginTop: spacing.lg, alignItems: 'center' }}>
          <Text style={[type.body, { color: c.textMuted }]}>Skip — <Text style={{ color: c.accentPrimary }}>calculate as guest</Text></Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const makeStyles = (c: Colors) => StyleSheet.create({
  toggle: { flexDirection: 'row', backgroundColor: c.bgCard, borderWidth: 1, borderColor: c.borderCard, borderRadius: radius.md, padding: 3, marginBottom: spacing.lg },
  toggleItem: { flex: 1, alignItems: 'center', paddingVertical: 9, borderRadius: radius.sm },
  toggleItemOn: { backgroundColor: c.accentPrimary },
  input: { height: 48, borderWidth: 1, borderColor: c.inputBorder, backgroundColor: c.inputBg, borderRadius: radius.md, paddingHorizontal: 14, color: c.textPrimary, fontFamily: type.input.fontFamily, fontSize: 15, marginBottom: spacing.md },
  cta: { height: 52, borderRadius: radius.lg, backgroundColor: c.accentPrimary, alignItems: 'center', justifyContent: 'center', marginTop: spacing.sm },
});
