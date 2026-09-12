import { fireEvent, render, screen } from '@testing-library/react-native';

import { IconButton } from './IconButton';

describe('IconButton', () => {
  it('calls onPress and exposes its accessibility label', () => {
    const onPress = jest.fn();
    render(<IconButton name="swap-vertical" onPress={onPress} accessibilityLabel="Inverser" />);

    fireEvent.press(screen.getByLabelText('Inverser'));

    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('does not fire while disabled', () => {
    const onPress = jest.fn();
    render(<IconButton name="swap-vertical" onPress={onPress} accessibilityLabel="Inverser" disabled />);

    fireEvent.press(screen.getByRole('button'));

    expect(onPress).not.toHaveBeenCalled();
    expect(screen.getByRole('button')).toBeDisabled();
  });
});
