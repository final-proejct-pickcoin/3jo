"use client";

import { useState, useEffect } from "react";

// 상수 정의
const TOAST_CONFIG = {
  LIMIT: 1,
  REMOVE_DELAY: 1000000
};

const ACTION_TYPES = {
  ADD_TOAST: "ADD_TOAST",
  UPDATE_TOAST: "UPDATE_TOAST",
  DISMISS_TOAST: "DISMISS_TOAST",
  REMOVE_TOAST: "REMOVE_TOAST"
};

// 유틸리티
let count = 0;
const genId = () => (++count % Number.MAX_SAFE_INTEGER).toString();

// 상태 관리
const toastTimeouts = new Map();
const listeners = [];
let memoryState = { toasts: [] };

const dispatch = (action) => {
  memoryState = reducer(memoryState, action);
  listeners.forEach(listener => listener(memoryState));
};

const addToRemoveQueue = (toastId) => {
  if (toastTimeouts.has(toastId)) return;
  
  const timeout = setTimeout(() => {
    toastTimeouts.delete(toastId);
    dispatch({ type: ACTION_TYPES.REMOVE_TOAST, toastId });
  }, TOAST_CONFIG.REMOVE_DELAY);
  
  toastTimeouts.set(toastId, timeout);
};
// 리듀서 함수
export const reducer = (state, action) => {
  const { type, toastId } = action;
  
  switch (type) {
    case ACTION_TYPES.ADD_TOAST:
      return {
        ...state,
        toasts: [action.toast, ...state.toasts].slice(0, TOAST_CONFIG.LIMIT)
      };
      
    case ACTION_TYPES.UPDATE_TOAST:
      return {
        ...state,
        toasts: state.toasts.map(toast => 
          toast.id === action.toast.id ? { ...toast, ...action.toast } : toast
        )
      };
      
    case ACTION_TYPES.DISMISS_TOAST: {
      // 제거 큐에 추가
      if (toastId) {
        addToRemoveQueue(toastId);
      } else {
        state.toasts.forEach(toast => addToRemoveQueue(toast.id));
      }
      
      return {
        ...state,
        toasts: state.toasts.map(toast => 
          toastId === undefined || toast.id === toastId
            ? { ...toast, open: false } 
            : toast
        )
      };
    }
    
    case ACTION_TYPES.REMOVE_TOAST:
      return toastId === undefined
        ? { ...state, toasts: [] }
        : { ...state, toasts: state.toasts.filter(toast => toast.id !== toastId) };
        
    default:
      return state;
  }
};

// 토스트 생성 함수
const toast = (props) => {
  const id = genId();
  
  // 공통 dispatch 헬퍼
  const createAction = (type, payload = {}) => ({
    type,
    ...(type === ACTION_TYPES.UPDATE_TOAST && { toast: { ...payload, id } }),
    ...(type === ACTION_TYPES.DISMISS_TOAST && { toastId: id }),
    ...payload
  });
  
  const update = (updateProps) => dispatch(createAction(ACTION_TYPES.UPDATE_TOAST, updateProps));
  const dismiss = () => dispatch(createAction(ACTION_TYPES.DISMISS_TOAST));
  
  dispatch({
    type: ACTION_TYPES.ADD_TOAST,
    toast: {
      ...props,
      id,
      open: true,
      onOpenChange: (open) => !open && dismiss()
    }
  });
  
  return { id, dismiss, update };
};

// 커스텀 훅
const useToast = () => {
  const [state, setState] = useState(memoryState);
  
  useEffect(() => {
    listeners.push(setState);
    return () => {
      const index = listeners.indexOf(setState);
      if (index > -1) listeners.splice(index, 1);
    };
  }, []);
  
  const dismiss = (toastId) => dispatch({
    type: ACTION_TYPES.DISMISS_TOAST,
    toastId
  });
  
  return { ...state, toast, dismiss };
};

export { useToast, toast };