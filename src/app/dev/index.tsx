import { Stack, router, type Href } from 'expo-router';
import { FlatList } from 'react-native';

import { AppCard, AppText, Screen } from '@/components';
import { spacing } from '@/theme';

/**
 * Route index.
 *
 * Every scaffolded screen is reachable from here, which is what makes the
 * placeholders reviewable without wiring navigation first. Delete this route
 * once the real flows connect the screens to each other.
 */
const ROUTES: { group: string; href: Href; label: string }[] = [
  { group: 'auth', href: '/(auth)/welcome', label: 'Bienvenue' },
  { group: 'auth', href: '/(auth)/phone', label: 'Numéro de téléphone' },
  { group: 'auth', href: '/(auth)/otp', label: 'Code de vérification' },
  { group: 'auth', href: '/(auth)/register', label: 'Inscription' },
  { group: 'auth', href: '/(auth)/login', label: 'Connexion' },
  { group: 'auth', href: '/(auth)/forgot-password', label: 'Mot de passe oublié' },

  { group: 'tabs', href: '/(tabs)', label: 'Accueil' },
  { group: 'tabs', href: '/(tabs)/services', label: 'Services' },
  { group: 'tabs', href: '/(tabs)/activity', label: 'Activité' },
  { group: 'tabs', href: '/(tabs)/messages', label: 'Messages' },
  { group: 'tabs', href: '/(tabs)/account', label: 'Compte' },

  { group: 'carpool', href: '/carpool/search', label: 'Recherche' },
  { group: 'carpool', href: '/carpool/results', label: 'Résultats' },
  { group: 'carpool', href: '/carpool/trip/trp_1', label: 'Détails du trajet' },
  { group: 'carpool', href: '/carpool/booking/bkg_1', label: 'Réservation' },
  { group: 'carpool', href: '/carpool/tracking/trp_1', label: 'Suivi' },
  { group: 'carpool', href: '/carpool/conversation/cnv_1', label: 'Conversation' },
  { group: 'carpool', href: '/carpool/review/bkg_1', label: 'Avis' },

  { group: 'publish', href: '/carpool/publish', label: 'Publier un trajet' },
  { group: 'publish', href: '/carpool/publish/route', label: 'Itinéraire' },
  { group: 'publish', href: '/carpool/publish/schedule', label: 'Date et heure' },
  { group: 'publish', href: '/carpool/publish/vehicle', label: 'Véhicule' },
  { group: 'publish', href: '/carpool/publish/seats', label: 'Places' },
  { group: 'publish', href: '/carpool/publish/price', label: 'Prix' },
  { group: 'publish', href: '/carpool/publish/review', label: 'Vérifier et publier' },

  { group: 'vehicles', href: '/carpool/vehicles', label: 'Mes véhicules' },
  { group: 'vehicles', href: '/carpool/vehicles/new', label: 'Ajouter un véhicule' },
  { group: 'vehicles', href: '/carpool/vehicles/veh_1', label: 'Détails du véhicule' },

  { group: 'profile', href: '/profile/edit', label: 'Modifier le profil' },
  { group: 'profile', href: '/profile/preferences', label: 'Préférences' },
  { group: 'profile', href: '/profile/verifications', label: 'Vérifications' },
  { group: 'profile', href: '/profile/notifications', label: 'Notifications' },
  { group: 'profile', href: '/profile/payment-methods', label: 'Moyens de paiement' },
  { group: 'profile', href: '/profile/wallet', label: 'Portefeuille' },
  { group: 'profile', href: '/profile/user/usr_2', label: 'Profil public' },

  { group: 'support', href: '/support', label: 'Aide' },
  { group: 'support', href: '/support/ticket', label: 'Ticket de support' },
  { group: 'support', href: '/support/report', label: 'Signalement' },

  { group: 'modals', href: '/(modals)/coming-soon', label: 'Bientôt disponible' },
  { group: 'modals', href: '/(modals)/select-place', label: 'Choisir un lieu' },
];

export default function DevRouteIndexScreen() {
  return (
    <Screen>
      <Stack.Screen options={{ title: 'Index des routes' }} />

      <FlatList
        data={ROUTES}
        keyExtractor={(item) => String(item.href)}
        contentContainerStyle={{ gap: spacing.sm, paddingVertical: spacing.md }}
        renderItem={({ item }) => (
          <AppCard onPress={() => router.push(item.href)} accessibilityLabel={item.label}>
            <AppText variant="label">{item.label}</AppText>
            <AppText variant="caption" color="tertiary">
              {item.group} · {String(item.href)}
            </AppText>
          </AppCard>
        )}
      />
    </Screen>
  );
}
