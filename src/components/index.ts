/**
 * Shared, genuinely reusable components.
 *
 * The bar for living here: used by at least two features, and free of any
 * knowledge of a domain object. A `TripCard` knows what a trip is — it belongs
 * in `features/carpool/trips`, not here.
 */
export { AppButton, type AppButtonProps } from './AppButton';
export { AppCard, type AppCardProps } from './AppCard';
export { AppInput, type AppInputProps } from './AppInput';
export { AppText, type AppTextProps } from './AppText';
export { DevelopmentPlaceholder } from './DevelopmentPlaceholder';
export { EmptyView } from './EmptyView';
export { ErrorView } from './ErrorView';
export { LoadingView } from './LoadingView';
export { Screen, type ScreenProps } from './Screen';
export { ScreenHeader } from './ScreenHeader';
