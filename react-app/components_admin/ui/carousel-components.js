import { memo } from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components_admin/ui/button';
import { CAROUSEL_STYLES, getNavButtonPosition } from './carousel-styles';

// 메모화된 아이콘 컴포넌트
export const CarouselIcon = memo(({ direction }) => {
  const IconComponent = direction === 'prev' ? ArrowLeft : ArrowRight;
  return <IconComponent className={CAROUSEL_STYLES.icon} />;
});
CarouselIcon.displayName = 'CarouselIcon';

// 메모화된 스크린 리더 텍스트
export const CarouselSrText = memo(({ direction }) => (
  <span className={CAROUSEL_STYLES.srOnly}>
    {direction === 'prev' ? 'Previous' : 'Next'} slide
  </span>
));
CarouselSrText.displayName = 'CarouselSrText';

// 네비게이션 버튼 컴포넌트 (메모화)
export const CarouselNavButton = memo(({ 
  direction, 
  className, 
  variant = "outline", 
  size = "icon",
  orientation,
  canScroll,
  onScroll,
  ...props 
}, ref) => {
  const positionClass = getNavButtonPosition(direction, orientation);
  
  return (
    <Button
      ref={ref}
      variant={variant}
      size={size}
      className={cn(CAROUSEL_STYLES.navButton, positionClass, className)}
      disabled={!canScroll}
      onClick={onScroll}
      {...props}
    >
      <CarouselIcon direction={direction} />
      <CarouselSrText direction={direction} />
    </Button>
  );
});
CarouselNavButton.displayName = 'CarouselNavButton';
