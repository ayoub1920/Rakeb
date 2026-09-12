import { Stack, router } from 'expo-router';
import type { Href } from 'expo-router';
import { View } from 'react-native';

import { AppCard, AppText, Screen } from '@/components';
import { spacing } from '@/theme';

type AdminSection = { href: Href; label: string; description: string };

const SECTIONS: AdminSection[] = [
  {
    href: '/admin/users',
    label: 'Utilisateurs',
    description: 'Rechercher un compte, voir son profil, le suspendre ou changer son rôle.',
  },
  {
    href: '/admin/licences',
    label: 'Vérifications permis',
    description: 'File d’attente des permis soumis par les conducteurs : approuver ou refuser.',
  },
  {
    href: '/admin/taxi' as Href,
    label: 'Chauffeurs taxi',
    description: 'Candidatures de chauffeurs de taxi : documents, plaque, approbation ou refus.',
  },
  {
    href: '/admin/support',
    label: 'Chat support',
    description: 'Conversations en direct des utilisateurs : répondre en temps réel et clôturer.',
  },
];

/** Landing page of the admin console — one card per section. */
export default function AdminDashboardScreen() {
  return (
    <Screen scrollable>
      <Stack.Screen options={{ title: 'Console admin' }} />

      <AppText variant="title" style={styles.title}>
        Console admin
      </AppText>

      <View style={styles.list}>
        {SECTIONS.map((section) => (
          <AppCard
            key={section.href as string}
            onPress={() => router.push(section.href)}
            accessibilityLabel={section.label}
          >
            <AppText variant="subheading">{section.label}</AppText>
            <AppText variant="bodySmall" color="secondary" style={styles.description}>
              {section.description}
            </AppText>
          </AppCard>
        ))}
      </View>
    </Screen>
  );
}

const styles = {
  title: { marginBottom: spacing.lg },
  list: { gap: spacing.md },
  description: { marginTop: spacing.xxs },
} as const;
