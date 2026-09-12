import { fireEvent, render, screen } from '@testing-library/react-native';

import { ChoiceCard } from './ChoiceCard';

describe('ChoiceCard', () => {
  it('renders its title and description and calls onPress', () => {
    const onPress = jest.fn();
    render(
      <ChoiceCard
        icon="car-outline"
        title="Chauffeur de taxi"
        description="Déposez votre candidature."
        onPress={onPress}
      />,
    );

    expect(screen.getByText('Chauffeur de taxi')).toBeTruthy();
    expect(screen.getByText('Déposez votre candidature.')).toBeTruthy();

    fireEvent.press(screen.getByLabelText('Chauffeur de taxi'));

    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('shows the subtitle instead of the description when given', () => {
    render(
      <ChoiceCard
        icon="car-outline"
        title="Chauffeur de taxi"
        description="Déposez votre candidature."
        subtitle="Candidature : Approuvée"
        onPress={jest.fn()}
      />,
    );

    expect(screen.getByText('Candidature : Approuvée')).toBeTruthy();
    expect(screen.queryByText('Déposez votre candidature.')).toBeNull();
  });
});
