import { fireEvent, render, screen } from '@testing-library/react-native';

import { AppButton } from './AppButton';

describe('AppButton', () => {
  it('renders its label and calls onPress', () => {
    const onPress = jest.fn();
    render(<AppButton label="Continuer" onPress={onPress} />);

    fireEvent.press(screen.getByText('Continuer'));

    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('does not fire while loading', () => {
    const onPress = jest.fn();
    render(<AppButton label="Continuer" onPress={onPress} loading />);

    // The label is replaced by a spinner, so the button is found by its role.
    fireEvent.press(screen.getByRole('button'));

    expect(onPress).not.toHaveBeenCalled();
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('exposes the disabled state to assistive technology', () => {
    render(<AppButton label="Continuer" onPress={jest.fn()} disabled />);

    expect(screen.getByRole('button')).toBeDisabled();
  });
});
