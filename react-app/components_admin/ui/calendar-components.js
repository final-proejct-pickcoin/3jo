import { memo } from 'react';
import { ChevronDownIcon, ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

// Chevron 컴포넌트를 메모화
export const CalendarChevron = memo(({ className, orientation, ...props }) => {
  const ChevronComponent = {
    left: ChevronLeftIcon,
    right: ChevronRightIcon,
    down: ChevronDownIcon
  }[orientation] || ChevronDownIcon;
  
  return <ChevronComponent className={cn('size-4', className)} {...props} />;
});
CalendarChevron.displayName = 'CalendarChevron';

// Root 컴포넌트를 메모화
export const CalendarRoot = memo(({ className, rootRef, ...props }) => (
  <div
    data-slot="calendar"
    ref={rootRef}
    className={cn(className)}
    {...props}
  />
));
CalendarRoot.displayName = 'CalendarRoot';

// WeekNumber 컴포넌트를 메모화
export const CalendarWeekNumber = memo(({ children, ...props }) => (
  <td {...props}>
    <div className="flex size-[--cell-size] items-center justify-center text-center">
      {children}
    </div>
  </td>
));
CalendarWeekNumber.displayName = 'CalendarWeekNumber';
