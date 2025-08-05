import { cn } from '@/lib/utils';
import { buttonVariants } from '@/components_admin/ui/button';

// 긴 className들을 상수로 분리
export const CALENDAR_STYLES = {
  container: 'bg-background group/calendar p-3 [--cell-size:--spacing(8)] [[data-slot=card-content]_&]:bg-transparent [[data-slot=popover-content]_&]:bg-transparent',
  rtlNext: String.raw`rtl:**:[.rdp-button\_next>svg]:rotate-180`,
  rtlPrevious: String.raw`rtl:**:[.rdp-button\_previous>svg]:rotate-180`,
  navigation: 'flex items-center gap-1 w-full absolute top-0 inset-x-0 justify-between',
  monthCaption: 'flex items-center justify-center h-[--cell-size] w-full px-[--cell-size]',
  dropdowns: 'w-full flex items-center text-sm font-medium justify-center h-[--cell-size] gap-1.5',
  dropdownRoot: 'relative has-focus:border-ring border border-input shadow-xs has-focus:ring-ring/50 has-focus:ring-[3px] rounded-md',
  weekday: 'text-muted-foreground rounded-md flex-1 font-normal text-[0.8rem] select-none',
  day: 'relative w-full h-full p-0 text-center [&:first-child[data-selected=true]_button]:rounded-l-md [&:last-child[data-selected=true]_button]:rounded-r-md group/day aspect-square select-none',
  dayButton: 'data-[selected-single=true]:bg-primary data-[selected-single=true]:text-primary-foreground data-[range-middle=true]:bg-accent data-[range-middle=true]:text-accent-foreground data-[range-start=true]:bg-primary data-[range-start=true]:text-primary-foreground data-[range-end=true]:bg-primary data-[range-end=true]:text-primary-foreground group-data-[focused=true]/day:border-ring group-data-[focused=true]/day:ring-ring/50 dark:hover:text-accent-foreground flex aspect-square w-full min-w-[--cell-size] flex-col gap-1 leading-none font-normal group-data-[focused=true]/day:relative group-data-[focused=true]/day:z-10 group-data-[focused=true]/day:ring-[3px] data-[range-end=true]:rounded-md data-[range-end=true]:rounded-r-md data-[range-middle=true]:rounded-none data-[range-start=true]:rounded-md data-[range-start=true]:rounded-l-md [&>span]:text-xs [&>span]:opacity-70'
};

// classNames 생성 함수
export const createCalendarClassNames = (defaultClassNames, buttonVariant, captionLayout) => ({
  root: cn('w-fit', defaultClassNames.root),
  months: cn('flex gap-4 flex-col md:flex-row relative', defaultClassNames.months),
  month: cn('flex flex-col w-full gap-4', defaultClassNames.month),
  nav: cn(CALENDAR_STYLES.navigation, defaultClassNames.nav),
  button_previous: cn(
    buttonVariants({ variant: buttonVariant }),
    'size-[--cell-size] aria-disabled:opacity-50 p-0 select-none',
    defaultClassNames.button_previous
  ),
  button_next: cn(
    buttonVariants({ variant: buttonVariant }),
    'size-[--cell-size] aria-disabled:opacity-50 p-0 select-none',
    defaultClassNames.button_next
  ),
  month_caption: cn(CALENDAR_STYLES.monthCaption, defaultClassNames.month_caption),
  dropdowns: cn(CALENDAR_STYLES.dropdowns, defaultClassNames.dropdowns),
  dropdown_root: cn(CALENDAR_STYLES.dropdownRoot, defaultClassNames.dropdown_root),
  dropdown: cn('absolute bg-popover inset-0 opacity-0', defaultClassNames.dropdown),
  caption_label: cn(
    'select-none font-medium',
    captionLayout === 'label' ? 'text-sm' : 'rounded-md pl-2 pr-1 flex items-center gap-1 text-sm h-8 [&>svg]:text-muted-foreground [&>svg]:size-3.5',
    defaultClassNames.caption_label
  ),
  table: 'w-full border-collapse',
  weekdays: cn('flex', defaultClassNames.weekdays),
  weekday: cn(CALENDAR_STYLES.weekday, defaultClassNames.weekday),
  week: cn('flex w-full mt-2', defaultClassNames.week),
  week_number_header: cn('select-none w-[--cell-size]', defaultClassNames.week_number_header),
  week_number: cn('text-[0.8rem] select-none text-muted-foreground', defaultClassNames.week_number),
  day: cn(CALENDAR_STYLES.day, defaultClassNames.day),
  range_start: cn('rounded-l-md bg-accent', defaultClassNames.range_start),
  range_middle: cn('rounded-none', defaultClassNames.range_middle),
  range_end: cn('rounded-r-md bg-accent', defaultClassNames.range_end),
  today: cn('bg-accent text-accent-foreground rounded-md data-[selected=true]:rounded-none', defaultClassNames.today),
  outside: cn('text-muted-foreground aria-selected:text-muted-foreground', defaultClassNames.outside),
  disabled: cn('text-muted-foreground opacity-50', defaultClassNames.disabled),
  hidden: cn('invisible', defaultClassNames.hidden)
});
