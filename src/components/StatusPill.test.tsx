import { render, screen } from '@testing-library/react-native';

import { StatusPill } from './StatusPill';

describe('StatusPill', () => {
  it('renders its label', () => {
    render(<StatusPill label="Confirmé" tone="info" />);

    expect(screen.getByText('Confirmé')).toBeTruthy();
  });
});
