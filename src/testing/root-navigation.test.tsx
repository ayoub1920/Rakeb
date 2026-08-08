import { renderRouter, screen, waitFor } from 'expo-router/testing-library';

/**
 * Smoke test for the navigation scaffold.
 *
 * It mounts the real `src/app` tree, so it catches the failures that break the
 * whole app and nothing else: a provider missing from the root layout, a route
 * file with no default export, a circular import in the API or auth layer.
 *
 * It also covers the guard: with no persisted session, the router must land on
 * the welcome screen rather than on the tabs.
 */
describe('root navigation', () => {
  it('renders and redirects a signed-out user to the welcome screen', async () => {
    renderRouter('src/app', { initialUrl: '/' });

    await waitFor(() => {
      expect(screen.getByText('Partagez la route, partagez les frais.')).toBeOnTheScreen();
    });
  });
});
