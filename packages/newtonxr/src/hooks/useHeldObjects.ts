import { useNewton } from "../core/store.js";

interface HeldObject {
  heldObject: string | null;
  setHeldObject: ((objectUUID: string, zPosition?: number) => void) | null;
  clearHeldObject: (() => void) | null;
}

/**
 * Custom hook to manage objects held in the XR environment.
 * Returns an array where the first element is the left hand and the second is the right hand.
 * If handedness is specified, returns an array with a single HeldObject for the specified hand.
 * @param handedness parameter to specify which hand's state to return. Ideally just pass in the `inputSource.handedness` property of the XRInputSource.
 * @returns An array containing the state(s) of the requested hand(s).
 */

export function useHeldObjects(
  handedness: "left" | "right" | "none",
): HeldObject {
  const { heldObjects, setHeldObject, setInteractionPoint } = useNewton();

  /**
   * Sets the specified object as being held in the left hand.
   * @param objectUUID - The THREE.Object3D's UUID to be held in the left hand.
   * @param zPosition - The z-position of the object relative to the inputSource.
   */
  const setLeftHandObject = (objectUUID: string, zPosition?: number) => {
    setHeldObject("left", objectUUID);

    if (zPosition) {
      setInteractionPoint("left", {
        zPosition,
        heldObjectId: objectUUID,
      });
    }
  };

  /**
   * Sets the specified object as being held in the right hand.
   * @param objectUUID - The THREE.Object3D's UUID to be held in the right hand.
   * @param zPosition - The z-position of the object relative to the inputSource.
   */
  const setRightHandObject = (objectUUID: string, zPosition?: number) => {
    setHeldObject("right", objectUUID);

    if (zPosition) {
      setInteractionPoint("right", {
        zPosition,
        heldObjectId: objectUUID,
      });
    }
  };

  const clearLeftHandObject = () => {
    setHeldObject("left", null);
    setInteractionPoint("left", null);
  };

  const clearRightHandObject = () => {
    setHeldObject("right", null);
    setInteractionPoint("right", null);
  };

  switch (handedness) {
    case "left":
      return {
        heldObject: heldObjects.left,
        setHeldObject: setLeftHandObject, // Define this function as before
        clearHeldObject: clearLeftHandObject, // Define this function as before
      };
    case "right":
      return {
        heldObject: heldObjects.right,
        setHeldObject: setRightHandObject, // Define this function as before
        clearHeldObject: clearRightHandObject, // Define this function as before
      };
    case "none":
      // Return an object with null properties if no hand is tracked
      return {
        heldObject: null,
        setHeldObject: null,
        clearHeldObject: null,
      };
    default:
      throw new Error(`Invalid handedness`);
  }
}
