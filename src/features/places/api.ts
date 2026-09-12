import { apiGet } from '@/api/request';
import type { RequestOptions } from '@/types/api';
import type {
  PlaceListResponse,
  PlaceResponse,
  ReverseGeocodeResponse,
} from '@/types/api-responses';
import type { Coordinates, Place } from '@/types/models';

/**
 * Tunisian cities and meeting points — `API Rakeb.md` §4.
 *
 * Platform-level (promoted out of `features/carpool/places`): consumed by the
 * carpool passenger search form, the carpool publish wizard's route step,
 * *and* the taxi passenger search screen — three features that may not import
 * each other, so this had to live outside all of them.
 *
 * Not implemented (add here):
 *   GET · DELETE /me/recent-searches
 */

function toPlace(dto: PlaceResponse): Place {
  return {
    id: dto.id,
    label: dto.name,
    governorate: dto.governorate ?? '',
    lat: dto.lat,
    lng: dto.lng,
  };
}

/**
 * `GET /places/autocomplete?q=&near=`.
 *
 * `near` is filled from `services/location` only when permission is already
 * granted; it is omitted otherwise and the picker never blocks on a prompt.
 */
export async function autocompletePlaces(
  term: string,
  near?: Coordinates | null,
  options?: RequestOptions,
): Promise<Place[]> {
  const res = await apiGet<PlaceListResponse>(
    '/places/autocomplete',
    { q: term, near: near ? `${near.lat},${near.lng}` : undefined },
    options,
  );
  return res.items.map(toPlace);
}

/** `GET /places/{id}` — full record for a place the user picked from history. */
export async function getPlace(placeId: string, options?: RequestOptions): Promise<Place> {
  return toPlace(await apiGet<PlaceResponse>(`/places/${placeId}`, undefined, options));
}

/**
 * `GET /geocode/reverse?lat=&lng=` — turns a dropped map pin into a `Place`.
 *
 * The result has no server id (`id: ''`): it is an ad-hoc point, not a row in
 * the `places` table. `publishing/api.ts` already sends `lat/lng/label` for
 * such points and omits `place_id`. Not usable for `/trips/search`, which keys
 * on real place ids.
 */
export async function reverseGeocode(
  coords: Coordinates,
  options?: RequestOptions,
): Promise<Place> {
  const dto = await apiGet<ReverseGeocodeResponse>(
    '/geocode/reverse',
    { lat: coords.lat, lng: coords.lng },
    options,
  );
  return {
    id: '',
    label: dto.label,
    governorate: dto.governorate ?? '',
    lat: dto.lat,
    lng: dto.lng,
  };
}
