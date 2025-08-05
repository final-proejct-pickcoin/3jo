import { useCallback, useMemo } from 'react';

// 캐러셀 로직을 위한 커스텀 훅
export const useCarouselLogic = (api, setApi) => {
  // 스크롤 함수들을 메모화
  const scrollPrev = useCallback(() => api?.scrollPrev(), [api]);
  const scrollNext = useCallback(() => api?.scrollNext(), [api]);
  
  // 키보드 핸들러를 메모화
  const handleKeyDown = useCallback((event) => {
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      scrollPrev();
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      scrollNext();
    }
  }, [scrollPrev, scrollNext]);
  
  // onSelect 콜백을 메모화
  const onSelect = useCallback((api, setCanScrollPrev, setCanScrollNext) => {
    if (!api) return;
    setCanScrollPrev(api.canScrollPrev());
    setCanScrollNext(api.canScrollNext());
  }, []);
  
  return {
    scrollPrev,
    scrollNext,
    handleKeyDown,
    onSelect
  };
};

// 캐러셀 컨텍스트 값을 메모화하는 훅
export const useCarouselContextValue = (
  carouselRef,
  api,
  opts,
  orientation,
  scrollPrev,
  scrollNext,
  canScrollPrev,
  canScrollNext
) => {
  return useMemo(() => ({
    carouselRef,
    api,
    opts,
    orientation: orientation || (opts?.axis === "y" ? "vertical" : "horizontal"),
    scrollPrev,
    scrollNext,
    canScrollPrev,
    canScrollNext,
  }), [carouselRef, api, opts, orientation, scrollPrev, scrollNext, canScrollPrev, canScrollNext]);
};
