import React, { useMemo, useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { useT } from '../i18n';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '../store/theme';
import { Colors, radius, spacing } from '../theme/theme';
import { type } from '../theme/typography';
import { api, apiError } from '../api/client';
import GenericResult from '../components/GenericResult';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export default function NumerologyScreen({ navigation }: any) {
  const c = useColors();
  const { t } = useT();
  const insets = useSafeAreaInsets();
  const s = useMemo(() => makeStyles(c), [c]);
  const [name, setName] = useState('');
  const [day, setDay] = useState('1');
  const [month, setMonth] = useState(0);
  const [year, setYear] = useState('1995');
  const [monthOpen, setMonthOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [data, setData] = useState<any>(null);

  const run = async () => {
    setError(''); setLoading(true); setData(null);
    try {
      const r = await api.post('/api/calc/numerology', { name: name.trim(), day: parseInt(day, 10), month: month + 1, year: parseInt(year, 10) });
      setData(r.data);
    } catch (e) { setError(apiError(e)); } finally { setLoading(false); }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, backgroundColor: c.bgBody }}>
      <View style={[s.header, { paddingTop: insets.top + spacing.sm }]}>
        <Pressable onPress={() => navigation.goBack()} style={s.iconBtn}><Ionicons name="chevron-back" size={22} color={c.textPrimary} /></Pressable>
        <Text style={[type.screenTitle, { color: c.textPrimary }]}>{t('Numerology')}</Text>
      </View>
      <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: insets.bottom + 40 }} keyboardShouldPersistTaps="handled">
        <TextInput value={name} onChangeText={setName} placeholder={t('Full name')} placeholderTextColor={c.textMuted} style={s.input} />
        <View style={s.row}>
          <TextInput value={day} onChangeText={setDay} keyboardType="number-pad" maxLength={2} placeholder="DD" placeholderTextColor={c.textMuted} style={[s.input, { width: 56, marginBottom: 0 }]} />
          <Pressable style={[s.input, s.sel, { flex: 1, marginBottom: 0 }]} onPress={() => setMonthOpen((v) => !v)}>
            <Text style={[type.input, { color: c.textPrimary }]}>{MONTHS[month]}</Text><Ionicons name="chevron-down" size={16} color={c.textMuted} />
          </Pressable>
          <TextInput value={year} onChangeText={setYear} keyboardType="number-pad" maxLength={4} placeholder="YYYY" placeholderTextColor={c.textMuted} style={[s.input, { width: 74, marginBottom: 0 }]} />
        </View>
        {monthOpen && <View style={s.drop}>{MONTHS.map((m, i) => <Pressable key={m} onPress={() => { setMonth(i); setMonthOpen(false); }} style={s.dropItem}><Text style={[type.body, { color: i === month ? c.accentPrimary : c.textPrimary }]}>{m}</Text></Pressable>)}</View>}
        <Pressable onPress={run} disabled={loading} style={[s.cta, loading && { opacity: 0.7 }]}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={[type.button, { color: '#fff' }]}>{t('Calculate')}</Text>}
        </Pressable>
        {error ? <Text style={[type.body, { color: c.accentRed, marginTop: spacing.md }]}>{error}</Text> : null}
        {data ? <View style={s.card}><GenericResult data={data} /></View> : null}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const makeStyles = (c: Colors) => StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: spacing.sm, paddingBottom: spacing.sm },
  iconBtn: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  input: { height: 46, borderWidth: 1, borderColor: c.inputBorder, backgroundColor: c.inputBg, borderRadius: radius.md, paddingHorizontal: 13, color: c.textPrimary, fontFamily: type.input.fontFamily, fontSize: 15, marginBottom: spacing.md },
  sel: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: spacing.md },
  drop: { backgroundColor: c.bgElevated, borderWidth: 1, borderColor: c.borderCard, borderRadius: radius.md, overflow: 'hidden', marginBottom: spacing.md },
  dropItem: { paddingVertical: 10, paddingHorizontal: 14, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: c.borderCard },
  cta: { height: 52, borderRadius: radius.lg, backgroundColor: c.accentPrimary, alignItems: 'center', justifyContent: 'center' },
  card: { backgroundColor: c.bgCard, borderColor: c.borderCard, borderWidth: 1, borderRadius: radius.lg, padding: spacing.lg, marginTop: spacing.lg },
});
