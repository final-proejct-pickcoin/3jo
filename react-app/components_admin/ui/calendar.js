'use client';

import { useRef, useEffect, memo, useMemo, useCallback } from 'react';
import { DayPicker, getDefaultClassNames } from 'react-day-picker';
import { cn } from '@/lib/utils';
import { Button } from '@/components_admin/ui/button';
import { CALENDAR_STYLES, createCalendarClassNames } from './calendar-styles';
import { CalendarChevron, CalendarRoot, CalendarWeekNumber } from './calendar-components';

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  captionLayout = 'label',
  buttonVariant = 'ghost',
  formatters,
  components,
  ...props
}) {
  const defaultClassNames = getDefaultClassNames();
  
  // formatters를 메모화
  const memoizedFormatters = useMemo(() => ({
    formatMonthDropdown: date => date.toLocaleString('default', { month: 'short' }),
    ...formatters
  }), [formatters]);
  
  // classNames를 메모화
  const memoizedClassNames = useMemo(() => ({
    ...createCalendarClassNames(defaultClassNames, buttonVariant, captionLayout),
    ...classNames
  }), [defaultClassNames, buttonVariant, captionLayout, classNames]);
  
  // components를 메모화
  const memoizedComponents = useMemo(() => ({
    Root: CalendarRoot,
    Chevron: CalendarChevron,
    DayButton: CalendarDayButton,
    WeekNumber: CalendarWeekNumber,
    ...components
  }), [components]);
  
  // className을 메모화
  const containerClassName = useMemo(() => cn(
    CALENDAR_STYLES.container,
    CALENDAR_STYLES.rtlNext,
    CALENDAR_STYLES.rtlPrevious,
    className
  ), [className]);
  
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={containerClassName}
      captionLayout={captionLayout}
      formatters={memoizedFormatters}
      classNames={memoizedClassNames}
      components={memoizedComponents}
      {...props}
    />
  );
}

const CalendarDayButton = memo(({ className, day, modifiers, ...props }) => {
  const defaultClassNames = getDefaultClassNames();
  const ref = useRef(null);
  
  // focus 핸들러를 메모화
  const handleFocus = useCallback(() => {
    if (modifiers.focused) ref.current?.focus();
  }, [modifiers.focused]);
  
  useEffect(handleFocus, [handleFocus]);
  
  // data attributes를 메모화
  const dataAttributes = useMemo(() => ({
    'data-day': day.date.toLocaleDateString(),
    'data-selected-single': modifiers.selected && !modifiers.range_start && !modifiers.range_end && !modifiers.range_middle,
    'data-range-start': modifiers.range_start,
    'data-range-end': modifiers.range_end,
    'data-range-middle': modifiers.range_middle
  }), [day.date, modifiers]);
  
  // className을 메모화
  const buttonClassName = useMemo(() => cn(
    CALENDAR_STYLES.dayButton,
    defaultClassNames.day,
    className
  ), [defaultClassNames.day, className]);
  
  return (
    <Button
      ref={ref}
      variant="ghost"
      size="icon"
      {...dataAttributes}
      className={buttonClassName}
      {...props}
    />
  );
});
CalendarDayButton.displayName = 'CalendarDayButton';

export { Calendar, CalendarDayButton };