"use client";

import { useNewton } from "../state.js";

/**
 * Custom hook to manage objects held in the XR environment.
 * This hook provides functionalities to set and clear objects held in either the left or right hand,
 * and returns the current state of objects held in each hand.
 */
export const useHeldObjects = (handedness: "left" | "right" | "none") => {
  // Extracts the current held objects and the setter function from the Zustand store.
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

  if (handedness === "left") {
    return {
      heldObject: heldObjects.left,
      setHeldObject: setLeftHandObject,
      clearHeldObject: clearLeftHandObject,
    };
  } else if (handedness === "right") {
    return {
      heldObject: heldObjects.right,
      setHeldObject: setRightHandObject,
      clearHeldObject: clearRightHandObject,
    };
  } else {
    return {
      heldObject: null,
      setHeldObject: () => {},
      clearHeldObject: () => {},
    };
  }
  // return {
  //   leftObject: heldObjects.left,
  //   rightObject: heldObjects.right,
  //   setLeftHandObject,
  //   setRightHandObject,
  //   clearLeftHandObject,
  //   clearRightHandObject,
  // };
};
