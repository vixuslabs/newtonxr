import { useNewton, type HandProperties } from "../index.js";

// export function useHands(): [HandProperties | null, HandProperties | null];

/**
 * Custom hook that returns the properties of the hand data stored within the newtonxr [store](../core/store.ts).
 *
 * @param handedness Optional. The handedness of the hand. If not specified, both hands will be returned.
 * @returns An array containing the properties of the left and right hands, respectfully, or the properties of a single hand.
 */
export function useHands(
  handedness?: XRHandedness,
): (HandProperties | undefined)[] {
  const hands = useNewton().hands;

  if (handedness === "left") {
    return [hands.left ?? undefined];
  } else if (handedness === "right") {
    return [hands.right ?? undefined];
  } else if (handedness === "none") {
    return [undefined];
  }

  return [hands.left ?? undefined, hands.right ?? undefined];
}
