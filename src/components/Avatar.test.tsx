import { render, screen } from '@testing-library/react-native';

import { Avatar } from './Avatar';

describe('Avatar', () => {
  it('falls back to initials when there is no photo', () => {
    render(<Avatar name="Sami Ben Ali" />);

    expect(screen.getByText('SA')).toBeTruthy();
  });

  it('falls back to the first two characters for a single-word name', () => {
    render(<Avatar name="Sami" />);

    expect(screen.getByText('SA')).toBeTruthy();
  });
});
