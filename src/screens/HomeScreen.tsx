import { useState } from 'react';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';

import { APP_EMAIL } from '../about';
import { useKlank } from '../audio/klank';
import { useExercisePrefs } from '../exercisePrefs';
import { fmt, useT, type Strings } from '../i18n';
import {
  PRACTICE_PATH,
  TOOLS,
  type PracticeItem,
  type ScreenId,
  type ToolItem,
} from '../navigation';
import { COLORS } from '../theme';
import { AppScreen, useCompactLayout } from '../ui/AppScreen';
import { ChoiceHelp } from '../ui/ChoiceHelp';
import { KlankChips } from '../ui/KlankChips';
import { LanguageChips } from '../ui/LanguageChips';
import { NamingChips } from '../ui/NamingChips';

type Props = {
  onOpen: (screen: ScreenId) => void;
};

function practiceCopy(item: Extract<PracticeItem, { kind: 'exercise' }>, t: Strings) {
  const copy = t.practice[item.screen];
  return {
    title: copy.title,
    body: copy.body,
    tagline: 'tagline' in copy ? copy.tagline : undefined,
    levelLabel: t.levels[item.level],
  };
}

export function HomeScreen({ onOpen }: Props) {
  const { compact } = useCompactLayout();
  const t = useT();
  const { isSimple, applySimple, hasMine, mineIsCurrent, saveMine, applyMine } = useExercisePrefs();
  const { isSec } = useKlank();
  const [moreOpen, setMoreOpen] = useState(false);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const simpleDone = isSimple && isSec;

  return (
    <AppScreen>
      <Text style={[styles.title, compact && styles.titleCompact]}>Audiation</Text>

      <LanguageChips />

      <View style={styles.explain}>
        <Text style={styles.sectionTitle}>{t.home.howTitle}</Text>
        <Text style={styles.explainBlock}>
          <Text style={styles.explainLead}>{t.home.forWhoLead}</Text>
          {t.home.forWhoBody}
        </Text>
        <Text style={styles.explainBlock}>
          <Text style={styles.explainLead}>{t.home.whatLead}</Text>
          {t.home.whatBody}
        </Text>
        <Text style={styles.explainBlock}>
          <Text style={styles.explainLead}>{t.home.whyLead}</Text>
          {t.home.whyBody}
        </Text>
        <Text style={styles.explainBlock}>
          <Text style={styles.explainLead}>{t.home.howLead}</Text>
          {t.home.howBody}
        </Text>
      </View>

      <View style={styles.explain}>
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ expanded: moreOpen }}
          accessibilityLabel={t.home.moreA11y}
          onPress={() => setMoreOpen((open) => !open)}
          style={({ pressed }) => [styles.moreHead, pressed && styles.cardPressed]}
        >
          <Text style={styles.sectionTitle}>{t.home.moreTitle}</Text>
          <Text style={styles.moreToggle}>{moreOpen ? t.home.moreClose : t.home.moreOpen}</Text>
        </Pressable>
        {moreOpen ? (
          <View style={styles.moreBody}>
            <Text style={styles.explainBlock}>
              <Text style={styles.explainLead}>{t.home.feelingLead}</Text>
              {t.home.feelingBody}
            </Text>
            <Text style={styles.explainBlock}>
              <Text style={styles.explainLead}>{t.home.characterLead}</Text>
              {t.home.characterBody}
            </Text>
            <Text style={styles.explainBlock}>
              <Text style={styles.explainLead}>{t.home.identityLead}</Text>
              {t.home.identityBody}
            </Text>
          </View>
        ) : (
          <Text style={styles.sectionHint}>{t.home.moreHint}</Text>
        )}
      </View>

      <View style={styles.section}>
        <NamingChips />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t.home.practiceTitle}</Text>
        <Text style={styles.sectionHint}>{t.home.practiceHint}</Text>
        <View
          style={[styles.simpleCard, simpleDone && styles.simpleCardDone]}
        >
          <ChoiceHelp
            label={t.home.simpleTitle}
            body={t.help.simple}
            a11y={fmt(t.help.moreA11y, { term: t.home.simpleTitle })}
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t.home.simpleA11y}
            accessibilityState={{ selected: simpleDone }}
            onPress={applySimple}
            style={({ pressed }) => [
              styles.simpleAction,
              simpleDone && styles.simpleActionDone,
              pressed && styles.cardPressed,
            ]}
          >
            <Text style={[styles.simpleActionText, simpleDone && styles.simpleActionTextDone]}>
              {simpleDone ? t.home.simpleDone : t.home.simpleButton}
            </Text>
          </Pressable>
        </View>
        <View style={[styles.simpleCard, mineIsCurrent && styles.simpleCardDone]}>
          <ChoiceHelp
            label={t.home.savedTitle}
            body={t.help.saved}
            a11y={fmt(t.help.moreA11y, { term: t.home.savedTitle })}
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t.home.savedA11y}
            accessibilityState={{ selected: mineIsCurrent }}
            onPress={saveMine}
            style={({ pressed }) => [
              styles.simpleAction,
              mineIsCurrent && styles.simpleActionDone,
              pressed && styles.cardPressed,
            ]}
          >
            <Text style={[styles.simpleActionText, mineIsCurrent && styles.simpleActionTextDone]}>
              {mineIsCurrent ? t.home.savedDone : t.home.savedButton}
            </Text>
          </Pressable>
          {hasMine && !mineIsCurrent ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t.home.savedApplyA11y}
              onPress={applyMine}
              style={({ pressed }) => [
                styles.simpleAction,
                styles.simpleActionDone,
                pressed && styles.cardPressed,
              ]}
            >
              <Text style={[styles.simpleActionText, styles.simpleActionTextDone]}>
                {t.home.savedApply}
              </Text>
            </Pressable>
          ) : null}
        </View>
        <View style={styles.cards}>
          {PRACTICE_PATH.map((item) => (
            <PracticeCard
              key={item.kind === 'exercise' ? item.screen : item.id}
              item={item}
              onOpen={onOpen}
            />
          ))}
        </View>
      </View>

      <View style={styles.explain}>
        <View style={styles.moreHead}>
          <ChoiceHelp
            label={t.home.advancedTitle}
            body={t.help.advanced}
            a11y={fmt(t.help.moreA11y, { term: t.home.advancedTitle })}
          />
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ expanded: advancedOpen }}
            accessibilityLabel={t.home.advancedTitle}
            onPress={() => setAdvancedOpen((open) => !open)}
            style={({ pressed }) => [pressed && styles.cardPressed]}
          >
            <Text style={styles.moreToggle}>{advancedOpen ? t.home.moreClose : t.home.moreOpen}</Text>
          </Pressable>
        </View>
        {advancedOpen ? <KlankChips /> : <Text style={styles.sectionHint}>{t.home.advancedHint}</Text>}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t.home.toolsTitle}</Text>
        <View style={styles.cards}>
          {TOOLS.map((item) => (
            <ToolCard key={item.screen} item={item} onOpen={onOpen} />
          ))}
        </View>
      </View>

      <View style={styles.explain}>
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ expanded: aboutOpen }}
          accessibilityLabel={t.about.a11y}
          onPress={() => setAboutOpen((open) => !open)}
          style={({ pressed }) => [styles.moreHead, pressed && styles.cardPressed]}
        >
          <Text style={styles.sectionTitle}>{t.about.title}</Text>
          <Text style={styles.moreToggle}>{aboutOpen ? t.home.moreClose : t.home.moreOpen}</Text>
        </Pressable>
        {aboutOpen ? (
          <View style={styles.moreBody}>
            <Text style={styles.explainBlock}>{t.about.developed}</Text>
            <Pressable
              accessibilityRole="link"
              accessibilityLabel={`${t.about.emailLabel}: ${APP_EMAIL}`}
              onPress={() => {
                void Linking.openURL(`mailto:${APP_EMAIL}`);
              }}
            >
              <Text style={styles.explainBlock}>
                <Text style={styles.explainLead}>{t.about.emailLabel}. </Text>
                <Text style={styles.email}>{APP_EMAIL}</Text>
              </Text>
            </Pressable>
            <Text style={styles.explainBlock}>
              {fmt(t.about.copyright, { year: new Date().getFullYear() })}
            </Text>
            <Text style={styles.explainBlock}>{t.about.disclaimer}</Text>
          </View>
        ) : (
          <Text style={styles.sectionHint}>{APP_EMAIL}</Text>
        )}
      </View>
    </AppScreen>
  );
}

function PracticeCard({
  item,
  onOpen,
}: {
  item: PracticeItem;
  onOpen: (screen: ScreenId) => void;
}) {
  const t = useT();
  if (item.kind === 'soon') {
    return null;
  }
  const copy = practiceCopy(item, t);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={fmt(t.home.stepA11y, {
        step: item.step,
        title: copy.title,
        level: copy.levelLabel,
      })}
      onPress={() => onOpen(item.screen)}
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
    >
      <View style={styles.cardHead}>
        <Text style={styles.step}>{item.step}</Text>
        <Text
          style={
            item.level === 'next'
              ? styles.levelNext
              : item.level === 'easy'
                ? styles.levelEasy
                : styles.levelOpen
          }
        >
          {copy.levelLabel}
        </Text>
      </View>
      <Text style={styles.cardTitle}>{copy.title}</Text>
      {copy.tagline ? <Text style={styles.cardTagline}>{copy.tagline}</Text> : null}
      <Text style={styles.cardBody}>{copy.body}</Text>
    </Pressable>
  );
}

function ToolCard({
  item,
  onOpen,
}: {
  item: ToolItem;
  onOpen: (screen: ScreenId) => void;
}) {
  const t = useT();
  const copy = t.tools[item.screen];
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={fmt(t.home.toolA11y, { title: copy.title })}
      onPress={() => onOpen(item.screen)}
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
    >
      <Text style={styles.kicker}>{t.home.toolKicker}</Text>
      <Text style={styles.cardTitle}>{copy.title}</Text>
      <Text style={styles.cardBody}>{copy.body}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 40,
    fontWeight: '700',
    color: COLORS.text,
    letterSpacing: 0.4,
  },
  titleCompact: {
    fontSize: 32,
  },
  explain: {
    gap: 10,
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.cardLine,
  },
  explainBlock: {
    fontSize: 15,
    lineHeight: 22,
    color: COLORS.muted,
  },
  explainLead: {
    fontWeight: '700',
    color: COLORS.text,
  },
  moreHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    minHeight: 44,
  },
  moreToggle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.accent,
  },
  moreBody: {
    gap: 10,
  },
  section: {
    gap: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
  },
  sectionHint: {
    fontSize: 13,
    lineHeight: 18,
    color: COLORS.hint,
  },
  cards: {
    gap: 12,
  },
  simpleCard: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.accent,
    gap: 12,
  },
  simpleCardDone: {
    borderColor: COLORS.hit,
  },
  simpleAction: {
    backgroundColor: COLORS.accent,
    borderRadius: 16,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  simpleActionDone: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.hit,
  },
  simpleActionText: {
    color: COLORS.ink,
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  simpleActionTextDone: {
    color: COLORS.text,
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.cardLine,
    minHeight: 48,
    gap: 6,
  },
  cardSoon: {
    opacity: 0.55,
  },
  cardPressed: {
    opacity: 0.88,
  },
  cardHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  step: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.accent,
  },
  levelEasy: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    color: COLORS.hit,
  },
  levelNext: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    color: COLORS.accent,
  },
  levelOpen: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    color: COLORS.muted,
  },
  levelSoon: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    color: COLORS.hint,
  },
  kicker: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: COLORS.accent,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.text,
  },
  cardTitleSoon: {
    color: COLORS.muted,
  },
  cardTagline: {
    fontSize: 13,
    lineHeight: 18,
    color: COLORS.hint,
  },
  cardBody: {
    fontSize: 15,
    lineHeight: 22,
    color: COLORS.muted,
  },
  email: {
    fontWeight: '700',
    color: COLORS.accent,
  },
});
