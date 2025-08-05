"use client";

import { memo } from "react";
import * as CollapsiblePrimitive from "@radix-ui/react-collapsible";

// Destructuring으로 간결하게
const { Root, Trigger, Content } = CollapsiblePrimitive;

// 메모화된 컴포넌트들을 한 번에 생성
const createMemoComponent = (Component, displayName) => {
  const MemoComponent = memo(Component);
  MemoComponent.displayName = displayName;
  return MemoComponent;
};

// 최적화된 컴포넌트 생성
export const Collapsible = createMemoComponent(Root, "Collapsible");
export const CollapsibleTrigger = createMemoComponent(Trigger, "CollapsibleTrigger");
export const CollapsibleContent = createMemoComponent(Content, "CollapsibleContent");