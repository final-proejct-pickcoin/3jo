"use client";

import { createContext, useContext, forwardRef, useState, useEffect } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { cn } from "@/lib/utils";
import { CAROUSEL_STYLES, getContentStyle, getItemStyle } from './carousel-styles';
import { CarouselNavButton } from './carousel-components';
import { useCarouselLogic, useCarouselContextValue } from './carousel-hooks';

const CarouselContext = createContext(null);

const useCarousel = () => {
  const context = useContext(CarouselContext);
  if (!context) {
    throw new Error("useCarousel must be used within a <Carousel />");
  }
  return context;
};

const Carousel = forwardRef(({
  orientation = "horizontal",
  opts,
  setApi,
  plugins,
  className,
  children,
  ...props
}, ref) => {
  const [carouselRef, api] = useEmblaCarousel({
    ...opts,
    axis: orientation === "horizontal" ? "x" : "y"
  }, plugins);
  
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);
  
  const { scrollPrev, scrollNext, handleKeyDown, onSelect } = useCarouselLogic(api, setApi);
  
  const contextValue = useCarouselContextValue(
    carouselRef,
    api,
    opts,
    orientation,
    scrollPrev,
    scrollNext,
    canScrollPrev,
    canScrollNext
  );
  
  useEffect(() => {
    if (api && setApi) setApi(api);
  }, [api, setApi]);
  
  useEffect(() => {
    if (!api) return;
    
    const handleSelect = () => onSelect(api, setCanScrollPrev, setCanScrollNext);
    handleSelect();
    
    api.on("reInit", handleSelect).on("select", handleSelect);
    return () => api?.off("select", handleSelect);
  }, [api, onSelect]);
  
  return (
    <CarouselContext.Provider value={contextValue}>
      <div
        ref={ref}
        onKeyDownCapture={handleKeyDown}
        className={cn(CAROUSEL_STYLES.container, className)}
        role="region"
        aria-roledescription="carousel"
        {...props}
      >
        {children}
      </div>
    </CarouselContext.Provider>
  );
});
Carousel.displayName = "Carousel";

const CarouselContent = forwardRef(({ className, ...props }, ref) => {
  const { carouselRef, orientation } = useCarousel();
  
  return (
    <div ref={carouselRef} className={CAROUSEL_STYLES.content}>
      <div
        ref={ref}
        className={getContentStyle(orientation, className)}
        {...props}
      />
    </div>
  );
});
CarouselContent.displayName = "CarouselContent";

const CarouselItem = forwardRef(({ className, ...props }, ref) => {
  const { orientation } = useCarousel();
  
  return (
    <div
      ref={ref}
      role="group"
      aria-roledescription="slide"
      className={getItemStyle(orientation, className)}
      {...props}
    />
  );
});
CarouselItem.displayName = "CarouselItem";

const CarouselPrevious = forwardRef((props, ref) => {
  const { orientation, scrollPrev, canScrollPrev } = useCarousel();
  
  return (
    <CarouselNavButton
      ref={ref}
      direction="prev"
      orientation={orientation}
      canScroll={canScrollPrev}
      onScroll={scrollPrev}
      {...props}
    />
  );
});
CarouselPrevious.displayName = "CarouselPrevious";

const CarouselNext = forwardRef((props, ref) => {
  const { orientation, scrollNext, canScrollNext } = useCarousel();
  
  return (
    <CarouselNavButton
      ref={ref}
      direction="next"
      orientation={orientation}
      canScroll={canScrollNext}
      onScroll={scrollNext}
      {...props}
    />
  );
});
CarouselNext.displayName = "CarouselNext";

export {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
};
