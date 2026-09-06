import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { STALE_TIME } from '@/api/query-client';
import { useIsAuthenticated } from '@/auth/use-auth';
import type { ApiError } from '@/types/api';
import type { Vehicle } from '@/types/models';

import {
  createVehicle,
  deleteVehicle,
  getVehicles,
  updateVehicle,
  type VehicleInput,
} from './api';
import { vehicleKeys } from './keys';

/**
 * `GET /me/vehicles`.
 *
 * `STALE_TIME.session`: the list only changes through the user's own actions,
 * so the publish wizard's vehicle step opens without a spinner.
 */
export function useVehicles() {
  const isAuthenticated = useIsAuthenticated();

  return useQuery<Vehicle[], ApiError>({
    queryKey: vehicleKeys.list(),
    queryFn: ({ signal }) => getVehicles({ signal }),
    enabled: isAuthenticated,
    staleTime: STALE_TIME.session,
  });
}

export function useCreateVehicle() {
  const queryClient = useQueryClient();

  return useMutation<Vehicle, ApiError, VehicleInput>({
    mutationFn: (input) => createVehicle(input),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: vehicleKeys.all }),
  });
}

export function useUpdateVehicle(id: string) {
  const queryClient = useQueryClient();

  return useMutation<Vehicle, ApiError, Partial<VehicleInput> & { is_default?: boolean }>({
    mutationFn: (input) => updateVehicle(id, input),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: vehicleKeys.all }),
  });
}

export function useDeleteVehicle(id: string) {
  const queryClient = useQueryClient();

  return useMutation<void, ApiError, void>({
    mutationFn: () => deleteVehicle(id),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: vehicleKeys.all }),
  });
}
