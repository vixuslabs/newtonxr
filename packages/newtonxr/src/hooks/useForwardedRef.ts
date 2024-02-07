import { type ForwardedRef, type MutableRefObject, useRef } from "react";

/**
 * Using the `useForwardedRef` created within react-three/rapier
 */
export const useForwardedRef = <T>(
  forwardedRef: ForwardedRef<T>,
  defaultValue: T | null = null,
): MutableRefObject<T> => {
  const innerRef = useRef<T>(defaultValue);

  // Update the forwarded ref when the inner ref changes
  if (forwardedRef && typeof forwardedRef !== "function") {
    if (!forwardedRef.current) {
      forwardedRef.current = innerRef.current;
    }
    return forwardedRef as MutableRefObject<T>;
  }

  return innerRef as MutableRefObject<T>;
};
