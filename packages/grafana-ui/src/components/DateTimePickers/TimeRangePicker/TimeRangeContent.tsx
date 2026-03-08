import { css } from '@emotion/css';
import { FormEvent, useCallback, useEffect, useId, useState, forwardRef, useImperativeHandle } from 'react';
import * as React from 'react';

import {
  DateTime,
  dateTimeFormat,
  dateTimeParse,
  GrafanaTheme2,
  isDateTime,
  rangeUtil,
  RawTimeRange,
  TimeRange,
  TimeZone,
} from '@grafana/data';
import { selectors } from '@grafana/e2e-selectors';
import { t } from '@grafana/i18n';

import { useStyles2 } from '../../../themes/ThemeContext';
import { Button } from '../../Button/Button';
import { Field } from '../../Forms/Field';
import { Icon } from '../../Icon/Icon';
import { Input } from '../../Input/Input';
import { Tooltip } from '../../Tooltip/Tooltip';
import { WeekStart } from '../WeekStartPicker';
import { commonFormat } from '../commonFormat';
import { isValid } from '../utils';

import TimePickerCalendar from './TimePickerCalendar';

interface Props {
  isFullscreen: boolean;
  value: TimeRange;
  onApply: (range: TimeRange) => void;
  timeZone?: TimeZone;
  fiscalYearStartMonth?: number;
  roundup?: boolean;
  isReversed?: boolean;
  weekStart?: WeekStart;
}

interface InputState {
  value: string;
  validationValue: string;
  invalid: boolean;
  errorMessage: string;
}

const ERROR_MESSAGES = {
  default: () => t('time-picker.range-content.default-error', 'Please enter a past date or "{{now}}"', { now: 'now' }),
  range: () => t('time-picker.range-content.range-error', '"From" can\'t be after "To"'),
};

export interface TimeRangeContentHandle {
  apply: () => void;
}

const TimeRangeContentComponent = (props: Props, ref: React.ForwardedRef<TimeRangeContentHandle>) => {
  const {
    value,
    isFullscreen = false,
    timeZone,
    onApply: onApplyFromProps,
    isReversed,
    fiscalYearStartMonth,
    weekStart,
  } = props;
  const [fromValue, toValue] = valueToState(value.raw.from, value.raw.to, timeZone);
  const style = useStyles2(getStyles);

  const [from, setFrom] = useState<InputState>(fromValue);
  const [to, setTo] = useState<InputState>(toValue);
  const [isOpen, setOpen] = useState(false);

  const fromFieldId = useId();
  const toFieldId = useId();

  // Synchronize internal state with external value
  useEffect(() => {
    const [fromValue, toValue] = valueToState(value.raw.from, value.raw.to, timeZone);
    setFrom(fromValue);
    setTo(toValue);
  }, [value.raw.from, value.raw.to, timeZone]);

  const onOpen = useCallback(
    (event: FormEvent<HTMLElement>) => {
      event.preventDefault();
      setOpen(true);
    },
    [setOpen]
  );

  const onApply = useCallback(() => {
    if (to.invalid || from.invalid) {
      return;
    }

    const raw: RawTimeRange = { from: from.validationValue, to: to.validationValue };
    const timeRange = rangeUtil.convertRawToRange(raw, timeZone, fiscalYearStartMonth, commonFormat);

    onApplyFromProps(timeRange);
  }, [from.invalid, from.validationValue, onApplyFromProps, timeZone, to.invalid, to.validationValue, fiscalYearStartMonth]);

  useImperativeHandle(
    ref,
    () => ({
      apply: onApply,
    }),
    [onApply]
  );

  const onChange = useCallback(
    (from: DateTime | string, to: DateTime | string) => {
      const [fromValue, toValue] = valueToState(from, to, timeZone);
      setFrom(fromValue);
      setTo(toValue);
    },
    [timeZone]
  );

  const submitOnEnter = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      onApply();
    }
  };

  const fiscalYear = rangeUtil.convertRawToRange({ from: 'now/fy', to: 'now/fy' }, timeZone, fiscalYearStartMonth);

  const fyTooltip = (
    <div className={style.tooltip}>
      {rangeUtil.isFiscal(value) ? (
        <Tooltip
          content={t('time-picker.range-content.fiscal-year', 'Fiscal year: {{from}} - {{to}}', {
            from: fiscalYear.from.format('MMM-DD'),
            to: fiscalYear.to.format('MMM-DD'),
          })}
        >
          <Icon name="info-circle" />
        </Tooltip>
      ) : null}
    </div>
  );

  const icon = (
    <Button
      aria-label={t('time-picker.range-content.open-input-calendar', 'Open calendar')}
      data-testid={selectors.components.TimePicker.calendar.openButton}
      icon="calendar-alt"
      variant="secondary"
      type="button"
      onClick={onOpen}
    />
  );

  return (
    <div>
      <div className={style.fieldContainer}>
        <Field
          label={t('time-picker.range-content.from-input', 'From')}
          invalid={from.invalid}
          error={from.errorMessage}
        >
          <Input
            id={fromFieldId}
            onClick={(event) => event.stopPropagation()}
            onChange={(event) => onChange(event.currentTarget.value, to.value)}
            addonAfter={icon}
            onKeyDown={submitOnEnter}
            data-testid={selectors.components.TimePicker.fromField}
            value={from.value}
          />
        </Field>
        {fyTooltip}
      </div>
      <div className={style.fieldContainer}>
        <Field label={t('time-picker.range-content.to-input', 'To')} invalid={to.invalid} error={to.errorMessage}>
          <Input
            id={toFieldId}
            onClick={(event) => event.stopPropagation()}
            onChange={(event) => onChange(from.value, event.currentTarget.value)}
            addonAfter={icon}
            onKeyDown={submitOnEnter}
            data-testid={selectors.components.TimePicker.toField}
            value={to.value}
          />
        </Field>
        {fyTooltip}
      </div>

      <TimePickerCalendar
        isFullscreen={isFullscreen}
        isOpen={isOpen}
        from={dateTimeParse(from.validationValue, { timeZone })}
        to={dateTimeParse(to.validationValue, { timeZone })}
        onApply={onApply}
        onClose={() => setOpen(false)}
        onChange={onChange}
        timeZone={timeZone}
        isReversed={isReversed}
        weekStart={weekStart}
      />
    </div>
  );
};

export const TimeRangeContent = forwardRef<TimeRangeContentHandle, Props>(TimeRangeContentComponent);

function isRangeInvalid(from: string, to: string, timezone?: string): boolean {
  const raw: RawTimeRange = { from, to };
  const timeRange = rangeUtil.convertRawToRange(raw, timezone, undefined, commonFormat);
  const valid = timeRange.from.isSame(timeRange.to) || timeRange.from.isBefore(timeRange.to);

  return !valid;
}

const DISPLAY_FORMAT = 'HH:mm DD-MM-YYYY';

/**
 * Convert display format string to commonFormat string
 * If input is already a DateTime or not a display format string, return it as is
 */
function convertDisplayToValidationFormat(value: DateTime | string, timeZone?: TimeZone): string {
  // If it's already a DateTime, format it to commonFormat
  if (isDateTime(value)) {
    return dateTimeFormat(value, { timeZone, format: commonFormat });
  }

  // If it's a string, try to parse as display format and re-format as commonFormat
  if (typeof value === 'string') {
    // Try to parse as display format
    try {
      const parsed = dateTimeParse(value, { format: DISPLAY_FORMAT, timeZone });
      if (parsed.isValid()) {
        return dateTimeFormat(parsed, { timeZone, format: commonFormat });
      }
    } catch (e) {
      // If parsing as display format fails, try as-is (might be in commonFormat already)
    }

    // If it ends with 'Z', parse and format to commonFormat
    if (value.endsWith('Z')) {
      const dt = dateTimeParse(value);
      return dateTimeFormat(dt, { timeZone, format: commonFormat });
    }

    // Return as is (might already be in correct format)
    return value;
  }

  return value;
}

function valueToState(
  rawFrom: DateTime | string,
  rawTo: DateTime | string,
  timeZone?: TimeZone
): [InputState, InputState] {
  const fromValidationValue = convertDisplayToValidationFormat(rawFrom, timeZone);
  const toValidationValue = convertDisplayToValidationFormat(rawTo, timeZone);
  const fromValueToDisplay = valueAsStringToDisplay(rawFrom, timeZone);
  const toValueToDisplay = valueAsStringToDisplay(rawTo, timeZone);
  
  const fromInvalid = !isValid(fromValidationValue, false, timeZone);
  const toInvalid = !isValid(toValidationValue, true, timeZone);
  // If "To" is invalid, we should not check the range anyways
  const rangeInvalid = isRangeInvalid(fromValidationValue, toValidationValue, timeZone) && !toInvalid;

  return [
    {
      value: fromValueToDisplay,
      validationValue: fromValidationValue,
      invalid: fromInvalid || rangeInvalid,
      errorMessage: rangeInvalid && !fromInvalid ? ERROR_MESSAGES.range() : ERROR_MESSAGES.default(),
    },
    { 
      value: toValueToDisplay, 
      validationValue: toValidationValue,
      invalid: toInvalid, 
      errorMessage: ERROR_MESSAGES.default() 
    },
  ];
}

function valueAsStringToDisplay(value: DateTime | string, timeZone?: TimeZone): string {
  if (isDateTime(value)) {
    return dateTimeFormat(value, { timeZone, format: DISPLAY_FORMAT });
  }

  if (value.endsWith('Z')) {
    const dt = dateTimeParse(value);
    return dateTimeFormat(dt, { timeZone, format: DISPLAY_FORMAT });
  }

  return value;
}

function getStyles(theme: GrafanaTheme2) {
  return {
    fieldContainer: css({
      display: 'flex',
    }),
    tooltip: css({
      paddingLeft: theme.spacing(1),
      paddingTop: theme.spacing(3),
    }),
  };
}
