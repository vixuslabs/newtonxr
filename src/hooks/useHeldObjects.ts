"use client";

import { useNewton } from "../state.js";

/**
 * Custom hook to manage objects held in the XR environment.
 * This hook provides functionalities to set and clear objects held in either the left or right hand,
 * and returns the current state of objects held in each hand.
 */
export const useHeldObjects = (handedness: "left" | "right" | "none") => {
  // Extracts the current held objects and the setter function from the Zustand store.
  const { heldObjects, setHeldObject } = useNewton((state) => ({
    heldObjects: state.heldObjects,
    setHeldObject: state.setHeldObject, // Assuming you have a setter in your Zustand store
  }));

  /**
   * Sets the specified object as being held in the left hand.
   * @param objectUUID - The THREE.Object3D's UUID to be held in the left hand.
   */
  const setLeftHandObject = (objectUUID: string) => {
    setHeldObject("left", objectUUID);
  };

  /**
   * Sets the specified object as being held in the right hand.
   * @param objectUUID - The THREE.Object3D's UUID to be held in the right hand.
   */
  const setRightHandObject = (objectUUID: string) => {
    setHeldObject("right", objectUUID);
  };

  const clearLeftHandObject = () => {
    setHeldObject("left", null);
  };

  const clearRightHandObject = () => {
    setHeldObject("right", null);
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
