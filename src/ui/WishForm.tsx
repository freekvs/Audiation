import { useState } from 'react';
import { Linking, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { WISH_EMAIL } from '../about';
import { fmt, useLocale, useT } from '../i18n';
import { COLORS } from '../theme';
import {
  WISH_KINDS,
  WISH_PLACES,
  wishKindLabel,
  wishMailto,
  wishPlaceLabel,
  type WishKind,
  type WishPlace,
} from '../wish';
import { ChoiceHelp } from './ChoiceHelp';

export function WishForm() {
  const t = useT();
  const { locale } = useLocale();
  const [kind, setKind] = useState<WishKind | null>(null);
  const [place, setPlace] = useState<WishPlace | null>(null);
  const [text, setText] = useState('');
  const [reply, setReply] = useState('');
  const [status, setStatus] = useState<'idle' | 'opened' | 'need' | 'failed'>('idle');

  const send = () => {
    if (!kind || !place || !text.trim()) {
      setStatus('need');
      return;
    }
    const url = wishMailto(kind, place, text, reply, locale, t);
    void Linking.openURL(url)
      .then(() => setStatus('opened'))
      .catch(() => setStatus('failed'));
  };

  return (
    <View style={styles.block}>
      <ChoiceHelp
        label={t.wish.title}
        body={t.help.wish}
        a11y={t.wish.a11y}
      />
      <Text style={styles.hint}>{t.wish.hint}</Text>

      <Text style={styles.label}>{t.wish.kindTitle}</Text>
      <View style={styles.row}>
        {WISH_KINDS.map((item) => {
          const selected = item === kind;
          const label = wishKindLabel(item, t);
          return (
            <Pressable
              key={item}
              accessibilityRole="button"
              accessibilityLabel={fmt(t.wish.kindA11y, { label })}
              accessibilityState={{ selected }}
              onPress={() => setKind(item)}
              style={({ pressed }) => [
                styles.chip,
                selected && styles.chipSelected,
                pressed && styles.pressed,
              ]}
            >
              <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{label}</Text>
            </Pressable>
          );
        })}
      </View>

      <Text style={styles.label}>{t.wish.whereTitle}</Text>
      <View style={styles.row}>
        {WISH_PLACES.map((item) => {
          const selected = item === place;
          const label = wishPlaceLabel(item, t);
          return (
            <Pressable
              key={item}
              accessibilityRole="button"
              accessibilityLabel={fmt(t.wish.whereA11y, { label })}
              accessibilityState={{ selected }}
              onPress={() => setPlace(item)}
              style={({ pressed }) => [
                styles.chip,
                selected && styles.chipSelected,
                pressed && styles.pressed,
              ]}
            >
              <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{label}</Text>
            </Pressable>
          );
        })}
      </View>

      <Text style={styles.label}>{t.wish.textTitle}</Text>
      <TextInput
        accessibilityLabel={t.wish.textA11y}
        multiline
        onChangeText={setText}
        placeholder={t.wish.textPlaceholder}
        placeholderTextColor={COLORS.hint}
        style={styles.input}
        value={text}
      />

      <Text style={styles.label}>{t.wish.replyTitle}</Text>
      <TextInput
        accessibilityLabel={t.wish.replyA11y}
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="email-address"
        onChangeText={setReply}
        placeholder={t.wish.replyPlaceholder}
        placeholderTextColor={COLORS.hint}
        style={styles.inputSingle}
        value={reply}
      />

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t.wish.sendA11y}
        onPress={send}
        style={({ pressed }) => [styles.send, pressed && styles.pressed]}
      >
        <Text style={styles.sendText}>{t.wish.send}</Text>
      </Pressable>
      {status === 'need' ? <Text style={styles.status}>{t.wish.sendNeed}</Text> : null}
      {status === 'opened' ? <Text style={styles.status}>{t.wish.opened}</Text> : null}
      {status === 'failed' ? (
        <Text style={styles.status}>{fmt(t.wish.failed, { email: WISH_EMAIL })}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  block: {
    gap: 10,
  },
  hint: {
    fontSize: 13,
    lineHeight: 18,
    color: COLORS.hint,
  },
  label: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    minHeight: 44,
    paddingHorizontal: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.cardLine,
  },
  chipSelected: {
    backgroundColor: COLORS.accent,
    borderColor: COLORS.accent,
  },
  chipText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
  },
  chipTextSelected: {
    color: COLORS.ink,
  },
  input: {
    minHeight: 96,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.cardLine,
    backgroundColor: COLORS.card,
    color: COLORS.text,
    padding: 12,
    textAlignVertical: 'top',
    fontSize: 15,
  },
  inputSingle: {
    minHeight: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.cardLine,
    backgroundColor: COLORS.card,
    color: COLORS.text,
    paddingHorizontal: 12,
    fontSize: 15,
  },
  send: {
    backgroundColor: COLORS.accent,
    borderRadius: 16,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendText: {
    color: COLORS.ink,
    fontSize: 16,
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.88,
  },
  status: {
    fontSize: 14,
    lineHeight: 20,
    color: COLORS.muted,
  },
});
