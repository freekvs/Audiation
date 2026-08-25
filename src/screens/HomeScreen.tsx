import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import {
  PRACTICE_PATH,
  TOOLS,
  type PracticeItem,
  type ScreenId,
  type ToolItem,
} from '../navigation';
import { COLORS } from '../theme';
import { AppScreen, useCompactLayout } from '../ui/AppScreen';
import { NamingChips } from '../ui/NamingChips';

type Props = {
  onOpen: (screen: ScreenId) => void;
};

export function HomeScreen({ onOpen }: Props) {
  const { compact } = useCompactLayout();
  const [moreOpen, setMoreOpen] = useState(false);

  return (
    <AppScreen>
      <Text style={[styles.title, compact && styles.titleCompact]}>Audiation</Text>

      <View style={styles.explain}>
        <Text style={styles.sectionTitle}>Hoe en waarom</Text>
        <Text style={styles.explainBlock}>
          <Text style={styles.explainLead}>Wat. </Text>
          Audiation is muziek horen in je hoofd. De toon is er ook als het stil is.
          Niet de toets, niet de naam: de klank die je vasthoudt.
        </Text>
        <Text style={styles.explainBlock}>
          <Text style={styles.explainLead}>Waarom. </Text>
          Wie innerlijk hoort, kan naspelen, zingen en later samenklank volgen.
          Zonder dat blijft muziek nadoen van vingers.
        </Text>
        <Text style={styles.explainBlock}>
          <Text style={styles.explainLead}>Hoe. </Text>
          Eerst één toon in de stilte. Dan de afstand tussen twee tonen. Dan de
          lijn van een korte melodie. Dan die lijn achterstevoren. Daarna ritme
          en harmonie. Namen (Do of 1) komen ná het horen. Zingen of een
          instrument is een check, niet het doel.
        </Text>
      </View>

      <View style={styles.explain}>
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ expanded: moreOpen }}
          accessibilityLabel="Meer over audiation"
          onPress={() => setMoreOpen((open) => !open)}
          style={({ pressed }) => [styles.moreHead, pressed && styles.cardPressed]}
        >
          <Text style={styles.sectionTitle}>Meer over audiation</Text>
          <Text style={styles.moreToggle}>{moreOpen ? 'Sluit' : 'Open'}</Text>
        </Pressable>
        {moreOpen ? (
          <View style={styles.moreBody}>
            <Text style={styles.explainBlock}>
              <Text style={styles.explainLead}>Gevoel. </Text>
              Je ervaart muziek met gevoel. Dat is hoe muziek bij je binnenkomt.
              Gevoel is echt, en het wisselt.
            </Text>
            <Text style={styles.explainBlock}>
              <Text style={styles.explainLead}>Karakter. </Text>
              Het karakter van een noot, een interval of een harmonie komt uit
              het gebruik. Dezelfde C speelt ergens anders een andere rol.
              Karakter is variabel.
            </Text>
            <Text style={styles.explainBlock}>
              <Text style={styles.explainLead}>Identiteit. </Text>
              Wat stabiel blijft is de identiteit van die drie. Audiation is die
              identiteit herkennen, ook als het stil is.
            </Text>
          </View>
        ) : (
          <Text style={styles.sectionHint}>Gevoel, karakter en identiteit.</Text>
        )}
      </View>

      <View style={styles.section}>
        <NamingChips />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Oefenen</Text>
        <Text style={styles.sectionHint}>
          Werk van boven naar beneden. Opties in een oefening gaan van makkelijk naar moeilijk.
        </Text>
        <View style={styles.cards}>
          {PRACTICE_PATH.map((item) => (
            <PracticeCard key={item.kind === 'exercise' ? item.screen : item.id} item={item} onOpen={onOpen} />
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Gereedschap</Text>
        <View style={styles.cards}>
          {TOOLS.map((item) => (
            <ToolCard key={item.screen} item={item} onOpen={onOpen} />
          ))}
        </View>
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
  if (item.kind === 'soon') {
    return (
      <View
        accessibilityRole="text"
        accessibilityLabel={`${item.step}. ${item.title}, straks`}
        style={[styles.card, styles.cardSoon]}
      >
        <View style={styles.cardHead}>
          <Text style={styles.step}>{item.step}</Text>
          <Text style={styles.levelSoon}>{item.levelLabel}</Text>
        </View>
        <Text style={[styles.cardTitle, styles.cardTitleSoon]}>{item.title}</Text>
        <Text style={styles.cardBody}>{item.body}</Text>
      </View>
    );
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Stap ${item.step}, ${item.title}, ${item.levelLabel}`}
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
          {item.levelLabel}
        </Text>
      </View>
      <Text style={styles.cardTitle}>{item.title}</Text>
      <Text style={styles.cardBody}>{item.body}</Text>
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
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Gereedschap ${item.title}`}
      onPress={() => onOpen(item.screen)}
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
    >
      <Text style={styles.kicker}>Gereedschap</Text>
      <Text style={styles.cardTitle}>{item.title}</Text>
      <Text style={styles.cardBody}>{item.body}</Text>
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
  cardBody: {
    fontSize: 15,
    lineHeight: 22,
    color: COLORS.muted,
  },
});
