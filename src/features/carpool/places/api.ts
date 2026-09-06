import { apiGet } from '@/api/request';
import type { RequestOptions } from '@/types/api';
import type { PlaceListResponse, PlaceResponse } from '@/types/api-responses';
import type { Coordinates, Place } from '@/types/models';

/**
 * Tunisian cities and meeting points — `API Rakeb.md` §4.
 *
 * Consumed by the passenger search form and by the driver publish wizard's
 * route step, which is why it is its own feature and not part of
 * `carpool/search`.
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
