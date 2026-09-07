import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, Keyboard, Modal, FlatList, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '../store/theme';
import { Colors, radius, spacing } from '../theme/theme';
import { type } from '../theme/typography';
import { searchPlaces, Place, getFamousCharts } from '../api/astro';
import { api } from '../api/client';
import { useAuth } from '../store/auth';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export interface PersonValue {
  name: string; year: number; month: number; day: number; hour: number; minute: number;
  tz_offset: number; lat: number | null; lon: number | null; valid: boolean;
}

export default function PersonInput({ label, onChange }: { label: string; onChange: (v: PersonValue) => void }) {
  const c = useColors();
  const s = useMemo(() => makeStyles(c), [c]);
  const [name, setName] = useState('');
  const [day, setDay] = useState('1');
  const [month, setMonth] = useState(0);
  const [year, setYear] = useState('1995');
  const [hour, setHour] = useState('12');
  const [minute, setMinute] = useState('0');
  const [ampm, setAmpm] = useState<'AM' | 'PM'>('AM');
  const [place, setPlace] = useState('');
  const [lat, setLat] = useState<number | null>(null);
  const [lon, setLon] = useState<number | null>(null);
  const [results, setResults] = useState<Place[]>([]);
  const [monthOpen, setMonthOpen] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const user = useAuth((st) => st.user);
  const [saved, setSaved] = useState<any[]>([]);
  const [famous, setFamous] = useState<any[]>([]);
  const [loadingList, setLoadingList] = useState(false);

  const openPicker = useCallback(async () => {
    setPickerOpen(true);
    if (saved.length || famous.length) return;
    setLoadingList(true);
    try {
      const [f, sv] = await Promise.all([
        getFamousCharts().catch(() => []),
        user ? api.get('/api/charts/list').then((r) => r.data?.charts || r.data || []).catch(() => []) : Promise.resolve([]),
      ]);
      setFamous(f); setSaved(sv);
    } finally { setLoadingList(false); }
  }, [saved.length, famous.length, user]);

  // Fill fields from a saved-chart row (birth_date/birth_time) or famous row (y/m/d/h/min).
  const applyRow = (row: any) => {
    let y: number, mo: number, d: number, h24: number, mi: number;
    if (row.birth_date) {
      [y, mo, d] = String(row.birth_date).split('-').map(Number);
      [h24, mi] = String(row.birth_time || '12:00').split(':').map(Number);
    } else {
      y = row.year; mo = row.month; d = row.day; h24 = row.hour; mi = row.minute;
    }
    setName(row.name || ''); setDay(String(d)); setMonth((mo || 1) - 1); setYear(String(y));
    setAmpm(h24 >= 12 ? 'PM' : 'AM'); setHour(String(h24 % 12 || 12)); setMinute(String(mi || 0));
    setLat(row.latitude ?? null); setLon(row.longitude ?? null);
    setPlace(row.birth_place || row.place || '');
    setPickerOpen(false);
  };

  useEffect(() => {
    let h = parseInt(hour || '0', 10) % 12; if (ampm === 'PM') h += 12;
    onChange({
      name: name.trim() || label, year: parseInt(year, 10) || 1995, month: month + 1, day: parseInt(day, 10) || 1,
      hour: h, minute: parseInt(minute || '0', 10), tz_offset: 5.5, lat, lon, valid: lat != null && lon != null,
    });
  }, [name, day, month, year, hour, minute, ampm, lat, lon]);

  const onPlace = async (q: string) => { setPlace(q); setLat(null); setLon(null); setResults(q.trim().length >= 3 ? await searchPlaces(q) : []); };
  const pick = (p: Place) => { setPlace(p.display.split(',').slice(0, 2).join(',')); setLat(p.latitude); setLon(p.longitude); setResults([]); Keyboard.dismiss(); };

  return (
    <View style={s.card}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.sm }}>
        <Text style={[type.micro, { color: c.accentPrimary }]}>{label.toUpperCase()}</Text>
        <Pressable onPress={openPicker} style={s.loadBtn}>
          <Ionicons name="folder-open-outline" size={13} color={c.accentPrimary} />
          <Text style={[type.caption, { color: c.accentPrimary, marginLeft: 5, fontWeight: '700' }]}>Load saved / famous</Text>
        </Pressable>
      </View>
      <TextInput value={name} onChangeText={setName} placeholder="Name" placeholderTextColor={c.textMuted} style={[s.input, { marginBottom: 8 }]} />
      <View style={s.row}>
        <TextInput value={day} onChangeText={setDay} keyboardType="number-pad" maxLength={2} placeholder="DD" placeholderTextColor={c.textMuted} style={[s.input, { width: 46 }]} />
        <Pressable style={[s.input, s.sel, { flex: 1 }]} onPress={() => setMonthOpen((v) => !v)}>
          <Text style={[type.input, { color: c.textPrimary }]}>{MONTHS[month]}</Text><Ionicons name="chevron-down" size={14} color={c.textMuted} />
        </Pressable>
        <TextInput value={year} onChangeText={setYear} keyboardType="number-pad" maxLength={4} placeholder="YYYY" placeholderTextColor={c.textMuted} style={[s.input, { width: 62 }]} />
      </View>
      {monthOpen && <View style={s.drop}>{MONTHS.map((m, i) => <Pressable key={m} onPress={() => { setMonth(i); setMonthOpen(false); }} style={s.dropItem}><Text style={[type.body, { color: i === month ? c.accentPrimary : c.textPrimary }]}>{m}</Text></Pressable>)}</View>}
      <View style={[s.row, { marginTop: 8 }]}>
        <TextInput value={hour} onChangeText={setHour} keyboardType="number-pad" maxLength={2} style={[s.input, { flex: 1 }]} />
        <Text style={{ color: c.textMuted }}>:</Text>
        <TextInput value={minute} onChangeText={setMinute} keyboardType="number-pad" maxLength={2} style={[s.input, { flex: 1 }]} />
        <View style={s.seg}>{(['AM','PM'] as const).map((v) => <Pressable key={v} onPress={() => setAmpm(v)} style={[s.segItem, ampm === v && { backgroundColor: c.accentPrimary }]}><Text style={[type.caption, { color: ampm === v ? c.onAccent : c.textSecondary }]}>{v}</Text></Pressable>)}</View>
      </View>
      <TextInput value={place} onChangeText={onPlace} placeholder="Birth place" placeholderTextColor={c.textMuted} style={[s.input, { marginTop: 8 }]} />
      {results.length > 0 && <View style={s.drop}>{results.map((p, i) => <Pressable key={i} onPress={() => pick(p)} style={s.dropItem}><Ionicons name="location-outline" size={14} color={c.accentPrimary} /><Text style={[type.caption, { color: c.textPrimary, marginLeft: 6, flex: 1 }]} numberOfLines={1}>{p.display}</Text></Pressable>)}</View>}
      {lat != null && <Text style={[type.caption, { color: c.accentGreen, marginTop: 5 }]}>✓ located</Text>}

      <Modal visible={pickerOpen} transparent animationType="slide" onRequestClose={() => setPickerOpen(false)}>
        <Pressable style={s.modalBg} onPress={() => setPickerOpen(false)}>
          <Pressable style={s.sheet} onPress={(e) => e.stopPropagation()}>
            <View style={s.sheetHead}>
              <Text style={[type.sectionTitle, { color: c.textPrimary }]}>Choose a chart</Text>
              <Pressable onPress={() => setPickerOpen(false)}><Ionicons name="close" size={22} color={c.textMuted} /></Pressable>
            </View>
            {loadingList ? <View style={{ padding: 30 }}><ActivityIndicator color={c.accentPrimary} /></View> : (
              <FlatList
                data={[...(saved.length ? [{ _h: 'Your saved charts' }] : []), ...saved, { _h: 'Famous charts' }, ...famous]}
                keyExtractor={(it, i) => it.id || it._h || String(i)}
                style={{ maxHeight: 460 }}
                renderItem={({ item }) => item._h ? (
                  <Text style={[type.micro, { color: c.textMuted, paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: 4 }]}>{item._h.toUpperCase()}</Text>
                ) : (
                  <Pressable style={s.pickRow} onPress={() => applyRow(item)}>
                    <Ionicons name="planet-outline" size={16} color={c.accentPrimary} />
                    <View style={{ flex: 1, marginLeft: 10 }}>
                      <Text style={[type.cardTitle, { color: c.textPrimary }]} numberOfLines={1}>{item.name}</Text>
                      <Text style={[type.caption, { color: c.textMuted }]} numberOfLines={1}>{item.birth_date || `${item.day}/${item.month}/${item.year}`} · {item.birth_place || item.place || item.category}</Text>
                    </View>
                  </Pressable>
                )}
                ListEmptyComponent={<Text style={[type.body, { color: c.textMuted, padding: spacing.lg }]}>Nothing to load.</Text>}
              />
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const makeStyles = (c: Colors) => StyleSheet.create({
  card: { backgroundColor: c.bgCard, borderColor: c.borderCard, borderWidth: 1, borderRadius: radius.lg, padding: spacing.md, marginBottom: spacing.md },
  input: { height: 44, borderWidth: 1, borderColor: c.inputBorder, backgroundColor: c.inputBg, borderRadius: radius.md, paddingHorizontal: 12, color: c.textPrimary, fontFamily: type.input.fontFamily, fontSize: 15 },
  sel: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  seg: { flexDirection: 'row', borderWidth: 1, borderColor: c.inputBorder, borderRadius: radius.md, overflow: 'hidden', height: 44, width: 84 },
  segItem: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  drop: { marginTop: 6, backgroundColor: c.bgElevated, borderWidth: 1, borderColor: c.borderCard, borderRadius: radius.md, overflow: 'hidden', maxHeight: 200 },
  dropItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: c.borderCard },
  loadBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: c.accentBg, borderRadius: radius.pill, paddingVertical: 5, paddingHorizontal: 10 },
  modalBg: { flex: 1, backgroundColor: c.overlay, justifyContent: 'flex-end' },
  sheet: { backgroundColor: c.bgBody, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, paddingBottom: 32 },
  sheetHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: spacing.lg, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: c.borderCard },
  pickRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 11, paddingHorizontal: spacing.lg, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: c.borderCard },
});
