import { css, cx } from '@emotion/css';
import { memo, useMemo, useState } from 'react';

import { GrafanaTheme2, isDateTime, rangeUtil, RawTimeRange, TimeOption, TimeRange, TimeZone } from '@grafana/data';
import { selectors } from '@grafana/e2e-selectors';
import { t, Trans } from '@grafana/i18n';

import { useStyles2, useTheme2 } from '../../../themes/ThemeContext';
import { getFocusStyles } from '../../../themes/mixins';
import { FilterInput } from '../../FilterInput/FilterInput';
import { Icon } from '../../Icon/Icon';
import { Input } from '../../Input/Input';
import { Button } from '../../Button/Button';
import { Select } from '../../Select/Select';
import { TextLink } from '../../Link/TextLink';
import { WeekStart } from '../WeekStartPicker';

import { TimePickerFooter } from './TimePickerFooter';
import { TimePickerTitle } from './TimePickerTitle';
import { TimeRangeContent } from './TimeRangeContent';
import { TimeRangeList } from './TimeRangeList';
import { mapOptionToTimeRange, mapRangeToTimeOption } from './mapper';
import {
  getCustomRelativeTimeRanges,
  customFilterOptionsStorage,
  SelectOption,
  FilterOptionsStorage,
} from './customFilterOptions';

interface Props {
  value: TimeRange;
  onChange: (timeRange: TimeRange) => void;
  onChangeTimeZone: (timeZone: TimeZone) => void;
  onChangeFiscalYearStartMonth?: (month: number) => void;
  onError?: (error?: string) => void;
  timeZone?: TimeZone;
  fiscalYearStartMonth?: number;
  quickOptions?: TimeOption[];
  history?: TimeRange[];
  showHistory?: boolean;
  className?: string;
  hideTimeZone?: boolean;
  /** Reverse the order of relative and absolute range pickers. Used to left align the picker in forms */
  isReversed?: boolean;
  hideQuickRanges?: boolean;
  widthOverride?: number;
  weekStart?: WeekStart;
  // Filter callbacks
  onFilterChange?: (filters: {
    factory?: string;
    productionLine?: string;
    productionStation?: string;
    productName?: string;
  }) => void;
  // Support for Grafana variable for product names
  productNameVariable?: string;
}

export interface PropsWithScreenSize extends Props {
  isFullscreen: boolean;
}

interface FormProps extends Omit<Props, 'history'> {
  historyOptions?: TimeOption[];
}

export const TimePickerContentWithScreenSize = (props: PropsWithScreenSize) => {
  const {
    quickOptions = [],
    isReversed,
    isFullscreen,
    hideQuickRanges,
    timeZone,
    fiscalYearStartMonth,
    value,
    onChange,
    history,
    showHistory,
    className,
    hideTimeZone,
    onChangeTimeZone,
    onChangeFiscalYearStartMonth,
    onFilterChange,
    productNameVariable,
  } = props;
  const isHistoryEmpty = !history?.length;
  const isContainerTall =
    (isFullscreen && showHistory) || (!isFullscreen && ((showHistory && !isHistoryEmpty) || !hideQuickRanges));
  const styles = useStyles2(getStyles, isReversed, hideQuickRanges, isContainerTall, isFullscreen);
  const historyOptions = mapToHistoryOptions(history, timeZone);
  const timeOption = useTimeOption(value.raw, quickOptions);
  const [searchTerm, setSearchQuery] = useState('');
  const [selectedFactory, setSelectedFactory] = useState<string>('');
  const [selectedProductionLine, setSelectedProductionLine] = useState<string>('');
  const [selectedProductionStation, setSelectedProductionStation] = useState<string>('');
  const [selectedProductName, setSelectedProductName] = useState<string>('');
  const [newFactory, setNewFactory] = useState<string>('');
  const [newProductionLine, setNewProductionLine] = useState<string>('');
  const [newProductionStation, setNewProductionStation] = useState<string>('');
  const [newProductName, setNewProductName] = useState<string>('');
  const [filterOptions, setFilterOptions] = useState<FilterOptionsStorage>(
    customFilterOptionsStorage.getOptions() || {
      factory: [],
      productionLine: [],
      productionStation: [],
      productName: [],
    }
  );

  const filteredQuickOptions = quickOptions.filter((o) => o.display.toLowerCase().includes(searchTerm.toLowerCase()));

  const onChangeTimeOption = (timeOption: TimeOption) => {
    return onChange(mapOptionToTimeRange(timeOption));
  };

  return (
    <div id="TimePickerContent" className={cx(styles.container, className)}>
      <div className={styles.body}>
        {isFullscreen && (
          <>
            {/* Column 1: Factory + Production Station */}
            <div className={styles.col1}>
              <div className={styles.filterGroup}>
                <label className={styles.filterLabel}>{t('custom-filters.factory', 'Factory')}</label>
                <Select
                  options={filterOptions.factory}
                  value={selectedFactory}
                  onChange={(val) => {
                    setSelectedFactory(val.value);
                    onFilterChange?.({
                      factory: val.value,
                      productionLine: selectedProductionLine,
                      productionStation: selectedProductionStation,
                      productName: selectedProductName,
                    });
                  }}
                  placeholder={t('custom-filters.select-factory', 'Select Factory')}
                />
                <div className={styles.editGroup}>
                  <Input
                    value={newFactory}
                    onChange={(e) => setNewFactory(e.currentTarget.value)}
                    placeholder={t('custom-filters.add-factory', 'Add factory...')}
                    width={20}
                  />
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      if (newFactory.trim()) {
                        const newOption = { label: newFactory, value: newFactory };
                        customFilterOptionsStorage.addOptionToFilter('factory', newOption);
                        setFilterOptions(customFilterOptionsStorage.getOptions()!);
                        setNewFactory('');
                      }
                    }}
                  >
                    {t('custom-filters.add', 'Add')}
                  </Button>
                </div>
              </div>

              <div className={styles.filterGroup}>
                <label className={styles.filterLabel}>{t('custom-filters.production-station', 'Production Station')}</label>
                <Select
                  options={filterOptions.productionStation}
                  value={selectedProductionStation}
                  onChange={(val) => {
                    setSelectedProductionStation(val.value);
                    onFilterChange?.({
                      factory: selectedFactory,
                      productionLine: selectedProductionLine,
                      productionStation: val.value,
                      productName: selectedProductName,
                    });
                  }}
                  placeholder={t('custom-filters.select-production-station', 'Select Production Station')}
                />
                <div className={styles.editGroup}>
                  <Input
                    value={newProductionStation}
                    onChange={(e) => setNewProductionStation(e.currentTarget.value)}
                    placeholder={t('custom-filters.add-production-station', 'Add production station...')}
                    width={20}
                  />
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      if (newProductionStation.trim()) {
                        const newOption = { label: newProductionStation, value: newProductionStation };
                        customFilterOptionsStorage.addOptionToFilter('productionStation', newOption);
                        setFilterOptions(customFilterOptionsStorage.getOptions()!);
                        setNewProductionStation('');
                      }
                    }}
                  >
                    {t('custom-filters.add', 'Add')}
                  </Button>
                </div>
              </div>
            </div>

            {/* Column 2: Production Line + Product Name */}
            <div className={styles.col2}>
              <div className={styles.filterGroup}>
                <label className={styles.filterLabel}>{t('custom-filters.production-line', 'Production Line')}</label>
                <Select
                  options={filterOptions.productionLine}
                  value={selectedProductionLine}
                  onChange={(val) => {
                    setSelectedProductionLine(val.value);
                    onFilterChange?.({
                      factory: selectedFactory,
                      productionLine: val.value,
                      productionStation: selectedProductionStation,
                      productName: selectedProductName,
                    });
                  }}
                  placeholder={t('custom-filters.select-production-line', 'Select Production Line')}
                />
                <div className={styles.editGroup}>
                  <Input
                    value={newProductionLine}
                    onChange={(e) => setNewProductionLine(e.currentTarget.value)}
                    placeholder={t('custom-filters.add-production-line', 'Add production line...')}
                    width={20}
                  />
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      if (newProductionLine.trim()) {
                        const newOption = { label: newProductionLine, value: newProductionLine };
                        customFilterOptionsStorage.addOptionToFilter('productionLine', newOption);
                        setFilterOptions(customFilterOptionsStorage.getOptions()!);
                        setNewProductionLine('');
                      }
                    }}
                  >
                    {t('custom-filters.add', 'Add')}
                  </Button>
                </div>
              </div>

              <div className={styles.filterGroup}>
                <label className={styles.filterLabel}>{t('custom-filters.product-name', 'Product Name')}</label>
                <Select
                  options={filterOptions.productName}
                  value={selectedProductName}
                  onChange={(val) => {
                    setSelectedProductName(val.value);
                    onFilterChange?.({
                      factory: selectedFactory,
                      productionLine: selectedProductionLine,
                      productionStation: selectedProductionStation,
                      productName: val.value,
                    });
                  }}
                  placeholder={t('custom-filters.select-product-name', 'Select Product Name')}
                />
                <div className={styles.editGroup}>
                  <Input
                    value={newProductName}
                    onChange={(e) => setNewProductName(e.currentTarget.value)}
                    placeholder={t('custom-filters.add-product-name', 'Add product name...')}
                    width={20}
                  />
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      if (newProductName.trim()) {
                        const newOption = { label: newProductName, value: newProductName };
                        customFilterOptionsStorage.addOptionToFilter('productName', newOption);
                        setFilterOptions(customFilterOptionsStorage.getOptions()!);
                        setNewProductName('');
                      }
                    }}
                  >
                    {t('custom-filters.add', 'Add')}
                  </Button>
                </div>
              </div>
            </div>

            {/* Column 3: Time Range */}
            <div className={styles.col3}>
              <FullScreenForm {...props} historyOptions={historyOptions} />
            </div>

            {/* Column 4: Quick Ranges */}
            <div className={styles.col4}>
              <div className={styles.timeRangeFilter}>
                <FilterInput
                  width={0}
                  value={searchTerm}
                  onChange={setSearchQuery}
                  placeholder={t('time-picker.content.filter-placeholder', 'Search quick ranges')}
                />
              </div>
              <div className={styles.scrollContent}>
                {!hideQuickRanges && (
                  <TimeRangeList options={filteredQuickOptions} onChange={onChangeTimeOption} value={timeOption} />
                )}
              </div>
            </div>
          </>
        )}
      </div>
      {!hideTimeZone && isFullscreen && (
        <TimePickerFooter
          timeZone={timeZone}
          fiscalYearStartMonth={fiscalYearStartMonth}
          onChangeTimeZone={onChangeTimeZone}
          onChangeFiscalYearStartMonth={onChangeFiscalYearStartMonth}
        />
      )}
    </div>
  );
};

export const TimePickerContent = (props: Props) => {
  const { widthOverride } = props;
  const theme = useTheme2();
  const isFullscreen = (widthOverride || window.innerWidth) >= theme.breakpoints.values.lg;
  return <TimePickerContentWithScreenSize {...props} isFullscreen={isFullscreen} />;
};

const NarrowScreenForm = (props: FormProps) => {
  const { value, hideQuickRanges, onChange, timeZone, historyOptions = [], showHistory, onError, weekStart } = props;
  const styles = useStyles2(getNarrowScreenStyles);
  const isAbsolute = isDateTime(value.raw.from) || isDateTime(value.raw.to);
  const [collapsedFlag, setCollapsedFlag] = useState(!isAbsolute);
  const collapsed = hideQuickRanges ? false : collapsedFlag;

  const onChangeTimeOption = (timeOption: TimeOption) => {
    return onChange(mapOptionToTimeRange(timeOption, timeZone));
  };

  return (
    <fieldset>
      <div className={styles.header}>
        <button
          type={'button'}
          className={styles.expandButton}
          onClick={() => {
            if (!hideQuickRanges) {
              setCollapsedFlag(!collapsed);
            }
          }}
          data-testid={selectors.components.TimePicker.absoluteTimeRangeTitle}
          aria-expanded={!collapsed}
          aria-controls="expanded-timerange"
        >
          <TimePickerTitle>
            <Trans i18nKey="time-picker.absolute.title">Absolute time range</Trans>
          </TimePickerTitle>
          {!hideQuickRanges && <Icon name={!collapsed ? 'angle-up' : 'angle-down'} />}
        </button>
      </div>
      {!collapsed && (
        <div className={styles.body} id="expanded-timerange">
          <div className={styles.form}>
            <TimeRangeContent
              value={value}
              onApply={onChange}
              timeZone={timeZone}
              isFullscreen={false}
              onError={onError}
              weekStart={weekStart}
            />
          </div>
          {showHistory && (
            <TimeRangeList
              title={t('time-picker.absolute.recent-title', 'Recently used absolute ranges')}
              options={historyOptions}
              onChange={onChangeTimeOption}
              placeholderEmpty={null}
            />
          )}
        </div>
      )}
    </fieldset>
  );
};

const FullScreenForm = (props: FormProps) => {
  const { onChange, value, timeZone, fiscalYearStartMonth, isReversed, historyOptions, onError, weekStart } = props;
  const styles = useStyles2(getFullScreenStyles, props.hideQuickRanges);
  const onChangeTimeOption = (timeOption: TimeOption) => {
    return onChange(mapOptionToTimeRange(timeOption, timeZone));
  };

  return (
    <>
      <div className={styles.container}>
        <div className={styles.title} data-testid={selectors.components.TimePicker.absoluteTimeRangeTitle}>
          <TimePickerTitle>
            <Trans i18nKey="time-picker.absolute.title">Absolute time range</Trans>
          </TimePickerTitle>
        </div>
        <TimeRangeContent
          value={value}
          timeZone={timeZone}
          fiscalYearStartMonth={fiscalYearStartMonth}
          onApply={onChange}
          isFullscreen={true}
          isReversed={isReversed}
          onError={onError}
          weekStart={weekStart}
        />
      </div>
      {props.showHistory && (
        <div className={styles.recent}>
          <TimeRangeList
            title={t('time-picker.absolute.recent-title', 'Recently used absolute ranges')}
            options={historyOptions || []}
            onChange={onChangeTimeOption}
            placeholderEmpty={<EmptyRecentList />}
          />
        </div>
      )}
    </>
  );
};

const EmptyRecentList = memo(() => {
  const styles = useStyles2(getEmptyListStyles);
  const emptyRecentListText = t(
    'time-picker.content.empty-recent-list-info',
    "It looks like you haven't used this time picker before. As soon as you enter some time intervals, recently used intervals will appear here."
  );

  return (
    <div className={styles.container}>
      <div>
        <span>{emptyRecentListText}</span>
      </div>
      <Trans i18nKey="time-picker.content.empty-recent-list-docs">
        <div>
          <TextLink href="https://grafana.com/docs/grafana/latest/dashboards/time-range-controls" external>
            Read the documentation
          </TextLink>
          <span> to find out more about how to enter custom time ranges.</span>
        </div>
      </Trans>
    </div>
  );
});

function mapToHistoryOptions(ranges?: TimeRange[], timeZone?: TimeZone): TimeOption[] {
  if (!Array.isArray(ranges) || ranges.length === 0) {
    return [];
  }

  return ranges.map((range) => mapRangeToTimeOption(range, timeZone));
}

EmptyRecentList.displayName = 'EmptyRecentList';

const useTimeOption = (raw: RawTimeRange, quickOptions: TimeOption[]): TimeOption | undefined => {
  return useMemo(() => {
    if (!rangeUtil.isRelativeTimeRange(raw)) {
      return;
    }
    return quickOptions.find((option) => {
      return option.from === raw.from && option.to === raw.to;
    });
  }, [raw, quickOptions]);
};

const getStyles = (
  theme: GrafanaTheme2,
  isReversed?: boolean,
  hideQuickRanges?: boolean,
  isContainerTall?: boolean,
  isFullscreen?: boolean
) => ({
  container: css({
    background: theme.colors.background.elevated,
    boxShadow: theme.shadows.z3,
    width: `${isFullscreen ? '1200px' : '262px'}`,
    borderRadius: theme.shape.radius.default,
    border: `1px solid ${theme.colors.border.weak}`,
    [`${isReversed ? 'left' : 'right'}`]: 0,
    display: 'flex',
    flexDirection: 'column',
  }),
  body: css({
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 1.2fr 1fr',
    height: `${isContainerTall ? '500px' : '217px'}`,
    maxHeight: '100vh',
    gap: theme.spacing(2),
    padding: theme.spacing(2),
  }),
  col1: css({
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(1),
    overflow: 'auto',
    scrollbarWidth: 'thin',
    paddingLeft: '4px',
    paddingRight: '4px',
  }),
  col2: css({
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(1),
    overflow: 'auto',
    scrollbarWidth: 'thin',
    paddingLeft: '4px',
    paddingRight: '4px',
  }),
  col3: css({
    minHeight: 0,
    paddingLeft: '4px',
  }),
  col4: css({
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(1),
    overflow: 'auto',
    scrollbarWidth: 'thin',
  }),
  timeRangeFilter: css({
    padding: theme.spacing(1),
  }),
  spacing: css({
    marginTop: '16px',
  }),
  scrollContent: css({
    overflowY: 'auto',
    scrollbarWidth: 'thin',
  }),
  filters: css({
    display: 'contents',
  }),
  filterGroup: css({
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(0.5),
  }),
  filterLabel: css({
    fontSize: theme.typography.size.sm,
    fontWeight: theme.typography.fontWeightMedium,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing(0.5),
  }),
  editGroup: css({
    display: 'flex',
    gap: theme.spacing(0.5),
    alignItems: 'center',
  }),
});

const getNarrowScreenStyles = (theme: GrafanaTheme2) => ({
  header: css({
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: `1px solid ${theme.colors.border.weak}`,
    padding: '7px 9px 7px 9px',
  }),
  expandButton: css({
    backgroundColor: 'transparent',
    border: 'none',
    display: 'flex',
    width: '100%',

    '&:focus-visible': getFocusStyles(theme),
  }),
  body: css({
    borderBottom: `1px solid ${theme.colors.border.weak}`,
  }),
  form: css({
    padding: '7px 9px 7px 9px',
  }),
});

const getFullScreenStyles = (theme: GrafanaTheme2, hideQuickRanges?: boolean) => ({
  container: css({
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    overflow: 'visible',
    paddingLeft: '4px',
  }),
  title: css({
    marginBottom: '11px',
  }),
  recent: css({
    flexGrow: 1,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'flex-end',
    paddingTop: theme.spacing(1),
  }),
});

const getEmptyListStyles = (theme: GrafanaTheme2) => ({
  container: css({
    padding: '12px',
    margin: '12px',

    'a, span': {
      fontSize: '13px',
    },
  }),
});
