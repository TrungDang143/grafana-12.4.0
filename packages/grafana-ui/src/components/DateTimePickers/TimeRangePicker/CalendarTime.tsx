import { css } from '@emotion/css';
import { t } from '@grafana/i18n';

import { GrafanaTheme2 } from '@grafana/data';
import { useStyles2 } from '../../../themes/ThemeContext';
import { Input } from '../../Input/Input';

import { TimePickerCalendarProps } from './TimePickerCalendar';

export function CalendarTime({ from, to, onChange }: TimePickerCalendarProps) {
  const styles = useStyles2(getTimeStyles);

  const handleFromHourChange = (value: string) => {
    const hour = parseInt(value, 10);
    if (!isNaN(hour) && hour >= 0 && hour <= 23) {
      const newFrom = from.clone().hour(hour);
      onChange(newFrom, to);
    }
  };

  const handleFromMinuteChange = (value: string) => {
    const minute = parseInt(value, 10);
    if (!isNaN(minute) && minute >= 0 && minute <= 59) {
      const newFrom = from.clone().minute(minute);
      onChange(newFrom, to);
    }
  };

  const handleToHourChange = (value: string) => {
    const hour = parseInt(value, 10);
    if (!isNaN(hour) && hour >= 0 && hour <= 23) {
      const newTo = to.clone().hour(hour);
      onChange(from, newTo);
    }
  };

  const handleToMinuteChange = (value: string) => {
    const minute = parseInt(value, 10);
    if (!isNaN(minute) && minute >= 0 && minute <= 59) {
      const newTo = to.clone().minute(minute);
      onChange(from, newTo);
    }
  };

  const formatTime = (value: number) => String(value).padStart(2, '0');

  return (
    <div className={styles.container}>
      <div className={styles.timeGroup}>
        <label className={styles.timeLabel}>{t('time-picker.calendar.from-time', 'From')}</label>
        <div className={styles.timeInputs}>
          <Input
            placeholder="HH"
            value={formatTime(from.hour())}
            onChange={(e) => handleFromHourChange(e.currentTarget.value)}
            width={8}
            type="number"
          />
          <span className={styles.timeSeparator}>:</span>
          <Input
            placeholder="mm"
            value={formatTime(from.minute())}
            onChange={(e) => handleFromMinuteChange(e.currentTarget.value)}
            width={8}
            type="number"
          />
        </div>
      </div>

      <div className={styles.timeGroup}>
        <label className={styles.timeLabel}>{t('time-picker.calendar.to-time', 'To')}</label>
        <div className={styles.timeInputs}>
          <Input
            placeholder="HH"
            value={formatTime(to.hour())}
            onChange={(e) => handleToHourChange(e.currentTarget.value)}
            width={8}
            type="number"
          />
          <span className={styles.timeSeparator}>:</span>
          <Input
            placeholder="mm"
            value={formatTime(to.minute())}
            onChange={(e) => handleToMinuteChange(e.currentTarget.value)}
            width={8}
            type="number"
          />
        </div>
      </div>
    </div>
  );
}

CalendarTime.displayName = 'CalendarTime';

const getTimeStyles = (theme: GrafanaTheme2) => ({
  container: css({
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: theme.spacing(2),
    padding: `${theme.spacing(1)} 0`,
    borderTop: `1px solid ${theme.colors.border.weak}`,
  }),
  timeGroup: css({
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1),
  }),
  timeLabel: css({
    fontSize: theme.typography.size.sm,
    fontWeight: theme.typography.fontWeightMedium,
    color: theme.colors.text.primary,
    minWidth: '35px',
  }),
  timeInputs: css({
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(0.5),
  }),
  timeSeparator: css({
    fontSize: theme.typography.size.md,
    color: theme.colors.text.primary,
  }),
});
