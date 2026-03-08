import { getFeatureToggle } from '../../utils/featureToggle';

// The moment.js format to use for datetime inputs when the regionalFormat option is set.
const COMMON_FORMAT = 'HH:mm:ss DD-MM-YYYY';

export const commonFormat = getFeatureToggle('localeFormatPreference') ? COMMON_FORMAT : undefined;
