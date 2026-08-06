# API Rakeb — endpoints REST (v1 covoiturage)

Base : `https://api.rakeb.tn/v1` · JSON · auth `Authorization: Bearer <access_token>`
Montants en millimes (entier) pour éviter les flottants : `15800` = 15,800 DT.
Pagination curseur : `?cursor=&limit=20`. Erreurs : `{ code, message, field? }`.

---

## 1. Auth & session

| Méthode | Endpoint | Rôle |
|---|---|---|
| POST | `/auth/phone/start` | envoie l'OTP · `{ phone: "+21698123456" }` → `{ otp_token, expires_in, resend_after }` |
| POST | `/auth/phone/verify` | vérifie le code · `{ otp_token, code }` → `{ access_token, refresh_token, is_new_user }` |
| POST | `/auth/phone/resend` | renvoi (rate-limit 60 s, 3 max) |
| POST | `/auth/register` | complète l'inscription · `{ email, password, marketing_opt_in }` |
| POST | `/auth/login` | email + mot de passe |
| POST | `/auth/refresh` | nouveau access_token |
| POST | `/auth/logout` | révoque le refresh_token |
| POST | `/auth/password/forgot` · `/auth/password/reset` | récupération par email |
| GET | `/auth/email/verify?token=` | validation de l'email |

## 2. Profil & vérifications

| Méthode | Endpoint | Rôle |
|---|---|---|
| GET · PATCH | `/me` | prénom, nom, date de naissance, email, téléphone, rôle actif |
| POST | `/me/avatar` | upload photo (multipart ou URL pré-signée via `POST /uploads/sign`) |
| PATCH | `/me/role` | `{ role: "rider" \| "driver" \| "both" }` |
| GET · PUT | `/me/preferences` | `{ chat, music, smoking, pets }` |
| GET | `/me/stats` | nb de trajets, note moyenne, kg CO₂ évités |
| GET | `/users/{id}` | profil public : note, nb d'avis, ancienneté, badges, préférences |
| GET | `/users/{id}/reviews` | avis reçus (paginés) |
| POST | `/me/verifications/cin` | upload CIN → statut `pending` |
| POST | `/me/verifications/licence` | permis (obligatoire avant publication) |
| GET | `/me/verifications` | statuts : phone, email, cin, licence |

## 3. Permissions & notifications

| Méthode | Endpoint | Rôle |
|---|---|---|
| POST | `/me/devices` | enregistre le token push · `{ platform, push_token, locale }` |
| DELETE | `/me/devices/{id}` | à la déconnexion |
| GET · PUT | `/me/notification-settings` | booking_accepted, new_message, departure_reminder |
| POST | `/me/location` | dernière position connue (opt-in) · `{ lat, lng, accuracy }` |

## 4. Lieux & recherche

| Méthode | Endpoint | Rôle |
|---|---|---|
| GET | `/places/autocomplete?q=&near=` | villes et points de RDV tunisiens |
| GET | `/places/{id}` | détail d'un lieu (lat/lng, libellé, gouvernorat) |
| GET | `/trips/search` | `from_place_id`, `to_place_id`, `date`, `seats`, `radius_km`, `sort=departure\|price\|rating`, `filters=direct,instant_book,verified` → liste + `total` |
| GET | `/trips/search/map` | mêmes filtres, renvoie polylignes + marqueurs pour la carte |
| GET | `/trips/nearby?lat=&lng=` | départs près de moi (accueil) |
| GET · DELETE | `/me/recent-searches` | historique de recherche |
| GET · POST · DELETE | `/me/trip-alerts` | alerte sur un trajet régulier (notif quand une place s'ouvre) |

## 5. Trajets (lecture)

| Méthode | Endpoint | Rôle |
|---|---|---|
| GET | `/trips/{id}` | itinéraire complet, étapes + prix par segment, véhicule, conducteur, places restantes, politique d'annulation |
| GET | `/trips/{id}/seat-map` | plan des sièges : `{ seat: "front\|rear_left\|rear_middle\|rear_right", state: "free\|taken\|blocked" }` |
| POST | `/trips/{id}/quote` | devis avant réservation · `{ seats, seat_ids, pickup_stop_id, dropoff_stop_id, promo_code }` → `{ base, service_fee, discount, total }` |

## 6. Réservations (passager)

| Méthode | Endpoint | Rôle |
|---|---|---|
| POST | `/bookings` | crée la demande · `{ trip_id, seats, seat_ids, stops, payment_method_id, promo_code, message }` → statut `pending` ou `confirmed` si instant book |
| GET | `/bookings` | `?status=upcoming\|past\|cancelled` — écran Activité |
| GET | `/bookings/{id}` | détail + billet : `reservation_code`, `barcode_url`, `passenger_code` (4 chiffres) |
| GET | `/bookings/{id}/ticket.ics` | ajout au calendrier |
| POST | `/bookings/{id}/cancel` | annulation + calcul du remboursement (gratuit > 24 h, 50 % après) |
| POST | `/bookings/{id}/share` | lien de suivi à envoyer à un proche → `{ share_url, expires_at }` |

## 7. Publication & gestion (conducteur)

| Méthode | Endpoint | Rôle |
|---|---|---|
| GET · POST · PATCH · DELETE | `/me/vehicles` | modèle, couleur, plaque (`204 TU 3456`), nb de places |
| GET | `/trips/price-suggestion?from=&to=&date=` | prix recommandé + fourchette min/max du curseur |
| POST | `/trips` | publie · `{ vehicle_id, origin, stops[], destination, departure_at, seats, price_per_seat, instant_book, max_two_in_back, recurrence? }` |
| GET | `/me/trips` | `?status=published\|confirmed\|completed` |
| PATCH · DELETE | `/trips/{id}` | modifier (prix, places, heure) · annuler avec motif |
| GET | `/me/booking-requests` | inbox des demandes · `?trip_id=` |
| POST | `/bookings/{id}/accept` · `/bookings/{id}/decline` | réponse sous 24 h (badge Super conducteur) |
| POST | `/trips/{id}/start` | démarre le trajet · `{ passenger_code }` pour valider chaque passager |
| POST | `/trips/{id}/complete` | clôture → déclenche le paiement au conducteur et les demandes d'avis |

## 8. Suivi temps réel

| Méthode | Endpoint | Rôle |
|---|---|---|
| POST | `/trips/{id}/position` | le conducteur pousse sa position (toutes les 5–10 s) |
| GET | `/trips/{id}/tracking` | position, ETA, état trafic (fallback polling) |
| WS | `/ws/trips/{id}` | flux temps réel : `position`, `eta_updated`, `trip_started`, `trip_completed` |

## 9. Messagerie

| Méthode | Endpoint | Rôle |
|---|---|---|
| GET | `/conversations` | liste, dernier message, non-lus |
| GET | `/conversations/{id}/messages` | historique paginé |
| POST | `/conversations/{id}/messages` | envoi · `{ body }` (conversation créée avec la réservation) |
| POST | `/conversations/{id}/read` | accusé de lecture |
| GET | `/conversations/quick-replies` | réponses rapides (« Je suis en route »…) |
| WS | `/ws/conversations/{id}` | messages en direct + indicateur de frappe |

## 10. Avis & pourboire

| Méthode | Endpoint | Rôle |
|---|---|---|
| GET | `/me/pending-reviews` | trajets à noter |
| POST | `/bookings/{id}/review` | `{ rating: 1-5, tags: ["punctual","friendly"], comment }` |
| GET | `/reviews/tags` | liste des tags de compliment |
| POST | `/bookings/{id}/tip` | `{ amount }` — 1/2/5 DT ou libre |

## 11. Paiement & portefeuille

| Méthode | Endpoint | Rôle |
|---|---|---|
| GET | `/payment-methods` | cartes, mobile money, espèces, portefeuille |
| POST | `/payment-methods` | ajout carte (via token PSP, jamais le PAN en clair) |
| POST | `/payment-methods/mobile` | D17 / e-DINAR / Flouci · `{ provider, msisdn }` |
| PATCH · DELETE | `/payment-methods/{id}` | définir par défaut · supprimer |
| GET | `/wallet` | solde disponible + en attente |
| POST | `/wallet/topup` | recharge · `{ amount, payment_method_id }` |
| POST | `/wallet/withdraw` | retrait vers RIB / mobile money |
| GET | `/wallet/transactions` | opérations : débits trajets, ventes de places, parrainage, remboursements |
| POST | `/payments/intents` | autorisation à la réservation (capture à l'acceptation) |
| POST | `/webhooks/psp` | callbacks PSP : `authorized`, `captured`, `failed`, `refunded` |

## 12. Promos, parrainage, services

| Méthode | Endpoint | Rôle |
|---|---|---|
| POST | `/promos/validate` | `{ code, trip_id }` → montant de réduction |
| GET | `/promos/banners` | bannières de l'accueil |
| GET | `/me/referral` | code + crédit gagné (5 DT/ami) |
| POST | `/referrals/claim` | `{ code }` à l'inscription |
| GET | `/services` | catalogue avec `status: "live" \| "coming_soon"` — seul `carpool` est `live` |
| GET | `/config` | feature flags, devise, min/max prix, version mini de l'app |

## 13. Aide & sécurité

| Méthode | Endpoint | Rôle |
|---|---|---|
| GET | `/help/articles` · `/help/articles/{slug}` | centre d'aide |
| POST | `/support/tickets` | contact support |
| POST | `/reports` | signaler un utilisateur ou un trajet · `{ target_type, target_id, reason, details }` |
| POST | `/sos` | alerte urgence pendant un trajet (position + contacts) |

---

## Modèles principaux

`User` · `Vehicle` · `Place` · `Trip` (+ `TripStop`) · `Booking` (+ `BookingSeat`) · `Payment` · `WalletTransaction` · `Conversation` / `Message` · `Review` · `Promo` · `Device` · `Report`

## États

- **Booking** : `pending → confirmed → in_progress → completed` · `declined`, `cancelled_by_rider`, `cancelled_by_driver`, `expired` (sans réponse 24 h)
- **Trip** : `draft → published → full → in_progress → completed` · `cancelled`
- **Payment** : `authorized → captured → refunded` · `failed`
- **Verification** : `none → pending → approved` · `rejected`

## Jobs planifiés

Expiration des demandes à 24 h · rappels départ (J-1 et H-1) · capture des paiements à l'acceptation · versement conducteur après `complete` · remboursements automatiques selon la politique d'annulation · recalcul des notes moyennes · purge des positions GPS (30 j).
