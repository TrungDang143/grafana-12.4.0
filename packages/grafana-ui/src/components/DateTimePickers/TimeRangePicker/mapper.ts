import { TimeOption, TimeRange, TimeZone, rangeUtil, dateTimeFormat, dateTimeParse } from '@grafana/data';

import { getFeatureToggle } from '../../../utils/featureToggle';
import { commonFormat } from '../commonFormat';

const DISPLAY_FORMAT = 'HH:mm DD-MM-YYYY';

/**
 * Convert display format string (HH:mm DD-MM-YYYY) to commonFormat string (HH:mm:ss DD-MM-YYYY)
 * Only applies to absolute date formats, not to relative time ranges (like 'now/d', 'now-7d', etc.)
 */
function convertDisplayToCommonFormat(value: string, timeZone?: TimeZone): string {
  // If it's a relative time range, return as-is without conversion
  if (value.includes('now') || value === '') {
    return value;
  }

  try {
    // Try to parse as display format
    const parsed = dateTimeParse(value, { format: DISPLAY_FORMAT, timeZone });
    if (parsed.isValid()) {
      // Re-format to commonFormat (with seconds)
      return dateTimeFormat(parsed, { timeZone, format: commonFormat });
    }
  } catch (e) {
    // If parsing fails, fall through
  }

  // Return as-is (might already be in correct format)
  return value;
}

/**
 * Takes a printable TimeOption and builds a TimeRange with DateTime properties from it
 */
export const mapOptionToTimeRange = (option: TimeOption, timeZone?: TimeZone): TimeRange => {
  // Convert display format to commonFormat if needed
  const from = convertDisplayToCommonFormat(option.from, timeZone);
  const to = convertDisplayToCommonFormat(option.to, timeZone);

  return rangeUtil.convertRawToRange({ from, to }, timeZone, undefined, commonFormat);
};

/**
 * Takes a TimeRange and makes a printable TimeOption with formatted date strings correct for the timezone from it
 */
export const mapRangeToTimeOption = (range: TimeRange, timeZone?: TimeZone): TimeOption => {
  const from = dateTimeFormat(range.from, { timeZone, format: DISPLAY_FORMAT });
  const to = dateTimeFormat(range.to, { timeZone, format: DISPLAY_FORMAT });

  let display = `${from} ➜ ${to}`;

  if (getFeatureToggle('localeFormatPreference')) {
    display = rangeUtil.describeTimeRange(range, timeZone);
  }

  return {
    from,
    to,
    display,
  };
};
