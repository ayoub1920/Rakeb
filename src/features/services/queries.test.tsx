import { renderHook, waitFor } from '@testing-library/react-native';

import { createQueryWrapper } from '@/testing/render';

import { useServices } from './queries';

/**
 * Exercises the whole read path: hook → TanStack Query → Axios → mock adapter →
 * fixtures. If mock mode were misconfigured this test would attempt a real
 * request and fail, which is the point of asserting on the served copy rather
 * than on the local fallback.
 */
describe('useServices', () => {
  it('returns the catalogue served by the mock API', async () => {
    const { Wrapper } = createQueryWrapper();

    const { result } = renderHook(() => useServices(), { wrapper: Wrapper });

    // `placeholderData` makes the fallback catalogue available immediately.
    expect(result.current.data?.map((service) => service.id)).toEqual([
      'carpool',
      'taxi',
      'food',
      'grocery',
    ]);
    expect(result.current.isPlaceholderData).toBe(true);

    await waitFor(() => expect(result.current.isPlaceholderData).toBe(false));

    const services = result.current.data ?? [];
    expect(services.map((service) => service.id)).toEqual(['carpool', 'taxi', 'food', 'grocery']);
    // Only the served fixture uses this wording — proof it is not the fallback.
    expect(services[0]?.description).toContain('villes tunisiennes');
  });

  it('marks carpool as the only live service', async () => {
    const { Wrapper } = createQueryWrapper();

    const { result } = renderHook(() => useServices(), { wrapper: Wrapper });
    await waitFor(() => expect(result.current.isPlaceholderData).toBe(false));

    const live = (result.current.data ?? []).filter((service) => service.status === 'live');
    expect(live.map((service) => service.id)).toEqual(['carpool']);
  });
});
