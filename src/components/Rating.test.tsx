import { fireEvent, render, screen } from '@testing-library/react-native';

import { Rating } from './Rating';

describe('Rating', () => {
  it('shows the numeric average by default', () => {
    render(<Rating value={4.8} />);

    expect(screen.getByText('4.8')).toBeTruthy();
  });

  it('calls onChange with the tapped star value', () => {
    const onChange = jest.fn();
    render(<Rating value={0} onChange={onChange} />);

    fireEvent.press(screen.getByLabelText('3 étoiles'));

    expect(onChange).toHaveBeenCalledWith(3);
  });
});
