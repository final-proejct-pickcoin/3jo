import { useEffect, useRef } from 'react';

// useHighlightEffect: 특정 값이 변경될 때 DOM 요소에 하이라이트 효과를 주는 커스텀 훅
// 사용 예시: const ref = useHighlightEffect(value, 'highlight-class');
export function useHighlightEffect(trigger, highlightClass = 'highlight') {
  const ref = useRef(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    node.classList.add(highlightClass);
    const timeout = setTimeout(() => {
      node.classList.remove(highlightClass);
    }, 600); // 하이라이트 지속 시간(ms)
    return () => clearTimeout(timeout);
  }, [trigger, highlightClass]);

  return ref;
}
