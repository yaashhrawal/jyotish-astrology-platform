import React, { useMemo, useState } from 'react';
import {
  View, Text, TextInput, Pressable, ScrollView, StyleSheet,
  KeyboardAvoidingView, Platform, ActivityIndicator, Keyboard,
} from 'react-native';
import { useT } from '../i18n';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '../store/theme';
import { Colors, radius, spacing } from '../theme/theme';
import { type } from '../theme/typography';
import { getChart, searchPlaces, Place } from '../api/astro';
import { apiError } from '../api/client';

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

export default function CreateChartScreen({ navigation }: any) {
  const c = useColors();
  const { t } = useT();
  const insets = useSafeAreaInsets();
  const s = useMemo(() => makeStyles(c), [c]);

  const [name, setName] = useState('');
  const [gender, setGender] = useState<'male' | 'female' | 'other'>('male');
  const [day, setDay] = useState('1');
  const [month, setMonth] = useState(0);
  const [year, setYear] = useState('1990');
  const [hour, setHour] = useState('12');
  const [minute, setMinute] = useState('0');
  const [ampm, setAmpm] = useState<'AM' | 'PM'>('AM');
  const [place, setPlace] = useState('');
  const [lat, setLat] = useState<number | null>(null);
  const [lon, setLon] = useState<number | null>(null);
  const [tz, setTz] = useState('5.5');
  const [results, setResults] = useState<Place[]>([]);
  const [monthOpen, setMonthOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const onPlaceChange = async (q: string) => {
    setPlace(q); setLat(null); setLon(null);
    if (q.trim().length >= 3) setResults(await searchPlaces(q));
    else setResults([]);
  };
  const pickPlace = (p: Place) => {
    setPlace(p.display.split(',').slice(0, 3).join(',')); setLat(p.latitude); setLon(p.longitude); setResults([]);
    Keyboard.dismiss();
  };

  const to24 = () => {
    let h = parseInt(hour || '0', 10) % 12;
    if (ampm === 'PM') h += 12;
    return h;
  };

  const submit = async () => {
    setError('');
    if (!name.trim()) return setError('Please enter a name.');
    if (lat == null || lon == null) return setError('Pick a birth place from the list.');
    setLoading(true);
    try {
      const birth = {
        name: name.trim(), gender,
        year: parseInt(year, 10), month: month + 1, day: parseInt(day, 10),
        hour: to24(), minute: parseInt(minute || '0', 10),
        tz_offset: parseFloat(tz) || 5.5,
        latitude: lat, longitude: lon, place, ayanamsa: 'lahiri',
      } as any;
      const chart = await getChart(birth);
      navigation.navigate('Chart', { chart, birth });
    } catch (e) {
      setError(apiError(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, backgroundColor: c.bgBody }}>
      <ScrollView
        contentContainerStyle={{ paddingTop: insets.top + spacing.md, paddingBottom: insets.bottom + 120 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={s.header}>
          <Pressable onPress={() => navigation.goBack()} style={s.iconBtn}><Ionicons name="chevron-back" size={22} color={c.textPrimary} /></Pressable>
          <Text style={[type.screenTitle, { color: c.textPrimary }]}>{t('Create Kundli')}</Text>
        </View>

        <Field label="FULL NAME" c={c} s={s}>
          <TextInput value={name} onChangeText={setName} placeholder="e.g. Narendra Modi" placeholderTextColor={c.textMuted} style={s.input} />
        </Field>

        <Field label="GENDER" c={c} s={s}>
          <View style={s.seg}>
            {(['male','female','other'] as const).map((g) => (
              <Pressable key={g} onPress={() => setGender(g)} style={[s.segItem, gender === g && s.segItemOn]}>
                <Text style={[type.bodyMed, { color: gender === g ? c.onAccent : c.textSecondary, textTransform: 'capitalize' }]}>{g}</Text>
              </Pressable>
            ))}
          </View>
        </Field>

        <Field label="DATE OF BIRTH" c={c} s={s}>
          <View style={s.row}>
            <TextInput value={day} onChangeText={setDay} keyboardType="number-pad" maxLength={2} style={[s.input, { width: 58 }]} />
            <Pressable style={[s.input, s.select, { flex: 1 }]} onPress={() => setMonthOpen((v) => !v)}>
              <Text style={[type.input, { color: c.textPrimary }]}>{MONTHS[month]}</Text>
              <Ionicons name="chevron-down" size={16} color={c.textMuted} />
            </Pressable>
            <TextInput value={year} onChangeText={setYear} keyboardType="number-pad" maxLength={4} style={[s.input, { width: 74 }]} />
          </View>
          {monthOpen && (
            <View style={s.dropdown}>
              {MONTHS.map((mn, i) => (
                <Pressable key={mn} onPress={() => { setMonth(i); setMonthOpen(false); }} style={s.dropItem}>
                  <Text style={[type.body, { color: i === month ? c.accentPrimary : c.textPrimary }]}>{mn}</Text>
                </Pressable>
              ))}
            </View>
          )}
        </Field>

        <Field label="TIME OF BIRTH" c={c} s={s}>
          <View style={s.row}>
            <TextInput value={hour} onChangeText={setHour} keyboardType="number-pad" maxLength={2} style={[s.input, { flex: 1 }]} />
            <Text style={[type.screenTitle, { color: c.textMuted }]}>:</Text>
            <TextInput value={minute} onChangeText={setMinute} keyboardType="number-pad" maxLength={2} style={[s.input, { flex: 1 }]} />
            <View style={[s.seg, { width: 96 }]}>
              {(['AM','PM'] as const).map((v) => (
                <Pressable key={v} onPress={() => setAmpm(v)} style={[s.segItem, ampm === v && s.segItemOn]}>
                  <Text style={[type.bodyMed, { color: ampm === v ? c.onAccent : c.textSecondary }]}>{v}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        </Field>

        <Field label="BIRTH PLACE" c={c} s={s}>
          <TextInput value={place} onChangeText={onPlaceChange} placeholder={t('Search any city…')} placeholderTextColor={c.textMuted} style={s.input} />
          {results.length > 0 && (
            <View style={s.dropdown}>
              {results.map((p, i) => (
                <Pressable key={i} onPress={() => pickPlace(p)} style={s.dropItem}>
                  <Ionicons name="location-outline" size={15} color={c.accentPrimary} />
                  <Text style={[type.body, { color: c.textPrimary, marginLeft: 8, flex: 1 }]} numberOfLines={1}>{p.display}</Text>
                </Pressable>
              ))}
            </View>
          )}
          {lat != null && <Text style={[type.caption, { color: c.textMuted, marginTop: 6 }]}>✓ {lat.toFixed(3)}, {lon!.toFixed(3)} · UTC{parseFloat(tz) >= 0 ? '+' : ''}{tz}</Text>}
        </Field>

        {error ? (
          <View style={s.errBox}><Ionicons name="alert-circle" size={16} color={c.accentRed} /><Text style={[type.body, { color: c.accentRed, marginLeft: 8, flex: 1 }]}>{error}</Text></View>
        ) : null}
      </ScrollView>

      <View style={[s.ctaWrap, { paddingBottom: insets.bottom + spacing.md }]}>
        <Pressable onPress={submit} disabled={loading} style={[s.cta, loading && { opacity: 0.7 }]}>
          {loading ? <ActivityIndicator color="#fff" /> : <><Text style={[type.button, { color: '#fff' }]}>{t('Calculate Chart')}</Text><Ionicons name="flash" size={16} color="#fff" style={{ marginLeft: 8 }} /></>}
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

function Field({ label, c, s, children }: any) {
  return (
    <View style={s.field}>
      <Text style={[type.eyebrow, { color: c.textSecondary, marginBottom: 6 }]}>{label}</Text>
      {children}
    </View>
  );
}

const makeStyles = (c: Colors) => StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: spacing.md, paddingBottom: spacing.md },
  iconBtn: { width: 38, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  field: { paddingHorizontal: spacing.lg, marginBottom: spacing.md },
  input: { height: 46, borderWidth: 1, borderColor: c.inputBorder, backgroundColor: c.inputBg, borderRadius: radius.md, paddingHorizontal: 14, color: c.textPrimary, fontFamily: type.input.fontFamily, fontSize: 15 },
  select: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  seg: { flexDirection: 'row', borderWidth: 1, borderColor: c.inputBorder, borderRadius: radius.md, overflow: 'hidden', height: 46 },
  segItem: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 8 },
  segItemOn: { backgroundColor: c.accentPrimary },
  dropdown: { marginTop: 6, backgroundColor: c.bgElevated, borderWidth: 1, borderColor: c.borderCard, borderRadius: radius.md, overflow: 'hidden', maxHeight: 260 },
  dropItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 11, paddingHorizontal: 14, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: c.borderCard },
  errBox: { flexDirection: 'row', alignItems: 'center', marginHorizontal: spacing.lg, marginTop: 4, backgroundColor: c.accentBg, borderRadius: radius.md, padding: 12 },
  ctaWrap: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: spacing.lg, paddingTop: spacing.sm, backgroundColor: c.bgBody, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: c.borderCard },
  cta: { flexDirection: 'row', height: 52, borderRadius: radius.lg, backgroundColor: c.accentPrimary, alignItems: 'center', justifyContent: 'center' },
});
