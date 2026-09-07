import React, { useMemo } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '../store/theme';
import { useAuth } from '../store/auth';
import { Colors, radius, spacing } from '../theme/theme';
import { type } from '../theme/typography';
import GrahikaMark from '../components/GrahikaMark';

const TOOLS: { key: string; label: string; sub: string; icon: any; route: string; auth?: boolean }[] = [
  { key: 'match',   label: 'Matchmaking', sub: 'Ashtakoot compatibility', icon: 'heart-outline', route: 'Match' },
  { key: 'compare', label: 'Compare',     sub: 'Two charts · synastry',   icon: 'git-compare-outline', route: 'Compare' },
  { key: 'prashna', label: 'Prashna',     sub: 'Ask a question now',      icon: 'help-circle-outline', route: 'Prashna' },
  { key: 'saved',   label: 'Saved Charts',sub: 'Synced to your account',  icon: 'bookmark-outline', route: 'Saved', auth: true },
  { key: 'gems',    label: 'Gems',        sub: 'Recommended stones',      icon: 'diamond-outline', route: 'Gems' },
  { key: 'famous',  label: 'Famous Charts',sub: 'Study notable nativities', icon: 'star-outline', route: 'Famous' },
  { key: 'panchanga',label: 'Panchāng',    sub: "Today's tithi, nakṣatra", icon: 'calendar-outline', route: 'Panchanga' },
  { key: 'muhurta', label: 'Muhūrta',      sub: 'Best times for an event', icon: 'time-outline', route: 'Muhurta' },
  { key: 'numerology',label:'Numerology',  sub: 'Moolank · Bhagyank',     icon: 'calculator-outline', route: 'Numerology' },
];

export default function HomeScreen({ navigation }: any) {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const s = useMemo(() => makeStyles(c), [c]);
  const user = useAuth((st) => st.user);

  return (
    <ScrollView
      style={{ backgroundColor: c.bgBody }}
      contentContainerStyle={{ paddingTop: insets.top + spacing.md, paddingBottom: insets.bottom + 32 }}
      showsVerticalScrollIndicator={false}
    >
      {/* app bar */}
      <View style={s.appbar}>
        <GrahikaMark size={26} color={c.textPrimary} />
        <Text style={[type.wordmark, s.word]}>GRAHIKA</Text>
        <View style={{ flex: 1 }} />
        <Pressable style={s.avatar} onPress={() => navigation.navigate('Profile')}>
          <Text style={[type.cardTitle, { color: c.onAccent }]}>{(user?.name?.[0] || 'G').toUpperCase()}</Text>
        </Pressable>
      </View>

      {/* greeting */}
      <View style={{ paddingHorizontal: spacing.xl, marginBottom: spacing.md }}>
        <Text style={[type.body, { color: c.textMuted }]}>{user ? `Namaste, ${user.name}` : 'Namaste'}</Text>
        <Text style={[type.screenTitle, { color: c.textPrimary, marginTop: 2 }]}>What shall we read today?</Text>
      </View>

      {/* hero — Create Kundli */}
      <Pressable onPress={() => navigation.navigate('CreateChart')} style={{ marginHorizontal: spacing.lg }}>
        <LinearGradient colors={[c.accentDeep, c.accentPrimary, c.accentSecondary]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.hero}>
          <Text style={[type.eyebrow, { color: 'rgba(255,255,255,0.85)' }]}>BIRTH CHART</Text>
          <Text style={[type.screenTitle, { color: '#fff', marginTop: 4, fontFamily: undefined }]}>Create Kundli</Text>
          <Text style={[type.body, { color: 'rgba(255,255,255,0.9)', marginTop: 2, maxWidth: 200 }]}>
            Full D1–D60, dashās & interpretation from birth details.
          </Text>
          <View style={s.heroCta}>
            <Text style={[type.button, { color: '#fff' }]}>Start</Text>
            <Ionicons name="arrow-forward" size={15} color="#fff" style={{ marginLeft: 6 }} />
          </View>
          <View style={s.heroRing}><GrahikaMark size={120} color="rgba(255,255,255,0.5)" /></View>
        </LinearGradient>
      </Pressable>

      {/* tools */}
      <Text style={[type.micro, s.sectionLabel]}>TOOLS</Text>
      <View style={s.grid}>
        {TOOLS.map((t) => (
          <Pressable
            key={t.key}
            style={s.tile}
            onPress={() => (t.auth && !user ? navigation.navigate('Auth') : navigation.navigate(t.route))}
          >
            <View style={s.tileIcon}><Ionicons name={t.icon} size={18} color={c.accentPrimary} /></View>
            <Text style={[type.cardTitle, { color: c.textPrimary }]}>{t.label}</Text>
            <Text style={[type.caption, { color: c.textMuted }]}>{t.sub}</Text>
            {t.auth && !user ? <Ionicons name="lock-closed" size={12} color={c.textMuted} style={s.lock} /> : null}
          </Pressable>
        ))}
      </View>
    </ScrollView>
  );
}

const makeStyles = (c: Colors) => StyleSheet.create({
  appbar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.lg, paddingBottom: spacing.md, gap: 9 },
  word: { color: c.textPrimary },
  avatar: { width: 34, height: 34, borderRadius: 17, backgroundColor: c.accentPrimary, alignItems: 'center', justifyContent: 'center' },
  hero: { borderRadius: radius.xl, padding: spacing.lg, overflow: 'hidden' },
  heroCta: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', marginTop: spacing.md, backgroundColor: 'rgba(255,255,255,0.18)', borderRadius: radius.pill, paddingVertical: 7, paddingHorizontal: 14 },
  heroRing: { position: 'absolute', right: -24, top: -18, opacity: 0.5 },
  sectionLabel: { color: c.textMuted, marginTop: spacing.xl, marginBottom: spacing.md, marginHorizontal: spacing.xl },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', paddingHorizontal: spacing.lg, rowGap: spacing.md },
  tile: { width: '48%', backgroundColor: c.bgCard, borderColor: c.borderCard, borderWidth: 1, borderRadius: radius.lg, padding: spacing.md, minHeight: 104, gap: 6 },
  tileIcon: { width: 34, height: 34, borderRadius: 10, backgroundColor: c.accentBg, alignItems: 'center', justifyContent: 'center', marginBottom: 2 },
  lock: { position: 'absolute', top: 12, right: 12 },
});
