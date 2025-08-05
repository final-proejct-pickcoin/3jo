import { cn } from '@/lib/utils';

// 캐러셀 스타일 상수들
export const CAROUSEL_STYLES = {
  container: 'relative',
  content: 'overflow-hidden',
  contentInner: 'flex',
  horizontalContent: '-ml-4',
  verticalContent: '-mt-4 flex-col',
  item: 'min-w-0 shrink-0 grow-0 basis-full',
  horizontalItem: 'pl-4',
  verticalItem: 'pt-4',
  navButton: 'absolute h-8 w-8 rounded-full',
  horizontalPrev: '-left-12 top-1/2 -translate-y-1/2',
  horizontalNext: '-right-12 top-1/2 -translate-y-1/2',
  verticalPrev: '-top-12 left-1/2 -translate-x-1/2 rotate-90',
  verticalNext: '-bottom-12 left-1/2 -translate-x-1/2 rotate-90',
  icon: 'h-4 w-4',
  srOnly: 'sr-only'
};

// 네비게이션 버튼 위치 계산 함수
export const getNavButtonPosition = (direction, orientation) => {
  const isHorizontal = orientation === "horizontal";
  const isPrev = direction === "prev";
  
  if (isPrev) {
    return isHorizontal ? CAROUSEL_STYLES.horizontalPrev : CAROUSEL_STYLES.verticalPrev;
  }
  return isHorizontal ? CAROUSEL_STYLES.horizontalNext : CAROUSEL_STYLES.verticalNext;
};

// 콘텐츠 스타일 계산 함수
export const getContentStyle = (orientation, className) => {
  return cn(
    CAROUSEL_STYLES.contentInner,
    orientation === "horizontal" ? CAROUSEL_STYLES.horizontalContent : CAROUSEL_STYLES.verticalContent,
    className
  );
};

// 아이템 스타일 계산 함수
export const getItemStyle = (orientation, className) => {
  return cn(
    CAROUSEL_STYLES.item,
    orientation === "horizontal" ? CAROUSEL_STYLES.horizontalItem : CAROUSEL_STYLES.verticalItem,
    className
  );
};
