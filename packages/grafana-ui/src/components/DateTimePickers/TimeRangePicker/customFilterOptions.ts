import { t } from '@grafana/i18n';
import { TimeOption } from '@grafana/data';

/**
 * Custom relative time ranges for the filter
 */
export const getCustomRelativeTimeRanges = (): TimeOption[] => [
  {
    from: 'now',
    to: 'now',
    display: t('custom-filters.time-ranges.now', 'Hiện tại'),
  },
  {
    from: 'now/d',        // đầu ngày hiện tại
    to: 'now/d',   // cuối ngày hiện tại (giây cuối cùng)
    display: t('custom-filters.time-ranges.today', 'Trong ngày'),
  },
  {
    from: 'now/w',        // đầu tuần (thứ 2)
    to: 'now/w',   // cuối tuần (chủ nhật)
    display: t('custom-filters.time-ranges.this-week', 'Trong tuần'),
  },
  {
    from: 'now-1w/w',     // đầu tuần trước
    to: 'now-1w/w',// cuối tuần trước
    display: t('custom-filters.time-ranges.last-week', 'Tuần trước'),
  },
  {
    from: 'now/M',        // đầu tháng hiện tại
    to: 'now/M',   // cuối tháng hiện tại
    display: t('custom-filters.time-ranges.this-month', 'Trong tháng'),
  },
  {
    from: 'now-1M/M',     // đầu tháng trước
    to: 'now-1M/M',// cuối tháng trước
    display: t('custom-filters.time-ranges.last-month', 'Tháng trước'),
  },
  {
    from: 'now/y',        // đầu năm hiện tại
    to: 'now/y',   // cuối năm hiện tại
    display: t('custom-filters.time-ranges.this-year', 'Trong năm'),
  },
  {
    from: 'now-1y/y',     // đầu năm trước
    to: 'now-1y/y',// cuối năm trước
    display: t('custom-filters.time-ranges.last-year', 'Năm trước'),
  },
];

/**
 * Factory options structure
 */
export const factoryOptions = [
  { label: 'X1', value: '1' },
  { label: 'X3', value: '2' },
];

/**
 * Production line options
 */
export const productionLineOptions = [
  { label: 'DCDD', value: '1' },
  { label: 'DCDH', value: '2' },
  { label: 'DCDK', value: '3' },
];

/**
 * Production station options
 */
export const productionStationOptions = [
  { label: 'T1', value: '1' },
  { label: 'T2', value: '2' },
  { label: 'T3', value: '3' },
];

/**
 * Type definitions
 */
export interface SelectOption {
  label: string;
  value: string;
}

export interface FilterOptionsStorage {
  factory: SelectOption[];
  productionLine: SelectOption[];
  productionStation: SelectOption[];
  productName: SelectOption[];
}

/**
 * Local storage service for custom filter options
 */
class CustomFilterOptionsStorage {
  private readonly storageKey = 'grafana-custom-filter-options';

  constructor() {
    this.initializeStorage();
  }

  private initializeStorage(): void {
    if (!this.getOptions()) {
      this.setOptions({
        factory: factoryOptions,
        productionLine: productionLineOptions,
        productionStation: productionStationOptions,
        productName: [],
      });
    }
  }

  getOptions(): FilterOptionsStorage | null {
    try {
      const stored = localStorage.getItem(this.storageKey);
      return stored ? JSON.parse(stored) : null;
    } catch (e) {
      console.error('Failed to get filter options from storage:', e);
      return null;
    }
  }

  setOptions(options: FilterOptionsStorage): void {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(options));
    } catch (e) {
      console.error('Failed to save filter options to storage:', e);
    }
  }

  addOptionToFilter(filterName: keyof FilterOptionsStorage, option: SelectOption): void {
    const options = this.getOptions();
    if (options) {
      // Check if option already exists
      const exists = options[filterName].some(opt => opt.value === option.value);
      if (!exists) {
        options[filterName].push(option);
        this.setOptions(options);
      }
    }
  }

  removeOptionFromFilter(filterName: keyof FilterOptionsStorage, value: string): void {
    const options = this.getOptions();
    if (options) {
      options[filterName] = options[filterName].filter(opt => opt.value !== value);
      this.setOptions(options);
    }
  }

  getFilterOptions(filterName: keyof FilterOptionsStorage): SelectOption[] {
    const options = this.getOptions();
    return options ? options[filterName] : [];
  }
}

export const customFilterOptionsStorage = new CustomFilterOptionsStorage();
