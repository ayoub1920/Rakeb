import { renderHook, waitFor } from '@testing-library/react-native';

import { createQueryWrapper } from '@/testing/render';
import type { Coordinates } from '@/types/models';

import { useNearbyTrips } from './queries';

const TUNIS: Coordinates = { lat: 36.8065, lng: 10.1815 };

describe('useNearbyTrips', () => {
  it('stays idle until coordinates are provided', () => {
    const { Wrapper } = createQueryWrapper();

    const { result } = renderHook(() => useNearbyTrips(null), { wrapper: Wrapper });

    expect(result.current.fetchStatus).toBe('idle');
    expect(result.current.data).toBeUndefined();
  });

  it('fetches the nearby trips served by the mock API once located', async () => {
    const { Wrapper } = createQueryWrapper();

    const { result } = renderHook(() => useNearbyTrips(TUNIS), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const trips = result.current.data ?? [];
    expect(trips.length).toBeGreaterThan(0);
    expect(trips.every((trip) => trip.status === 'published')).toBe(true);
  });
});
