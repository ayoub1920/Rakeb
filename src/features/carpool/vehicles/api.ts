import { apiDelete, apiGet, apiPatch, apiPost } from '@/api/request';
import type { RequestOptions } from '@/types/api';
import type { VehicleResponse } from '@/types/api-responses';
import type { Vehicle } from '@/types/models';

/**
 * The driver's vehicles — `API Rakeb.md` §7.
 *
 * Separate from `publishing` because vehicles are managed on their own screens
 * (from the account tab) as well as picked during the publish wizard.
 */

function toVehicle(dto: VehicleResponse): Vehicle {
  return {
    id: dto.id,
    make: dto.make,
    model: dto.model,
    color: dto.color,
    plate: dto.plate,
    year: dto.year,
    seats: dto.seats,
    is_default: dto.is_default,
  };
}

export type VehicleInput = {
  make: string;
  model: string;
  color: string;
  plate: string;
  year?: number | null;
  seats: number;
};

/** `GET /me/vehicles`. */
export async function getVehicles(options?: RequestOptions): Promise<Vehicle[]> {
  const rows = await apiGet<VehicleResponse[]>('/me/vehicles', undefined, options);
  return rows.map(toVehicle);
}

/** `POST /me/vehicles` — the server rejects a duplicate plate. */
export async function createVehicle(
  input: VehicleInput,
  options?: RequestOptions,
): Promise<Vehicle> {
  return toVehicle(await apiPost<VehicleResponse>('/me/vehicles', input, options));
}

/** `PATCH /me/vehicles/{id}` — also carries `is_default`. */
export async function updateVehicle(
  id: string,
  input: Partial<VehicleInput> & { is_default?: boolean },
  options?: RequestOptions,
): Promise<Vehicle> {
  return toVehicle(await apiPatch<VehicleResponse>(`/me/vehicles/${id}`, input, options));
}

/** `DELETE /me/vehicles/{id}` — fails while a live trip uses it; surface the message. */
export function deleteVehicle(id: string, options?: RequestOptions): Promise<void> {
  return apiDelete<void>(`/me/vehicles/${id}`, options);
}
