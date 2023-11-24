"use client";

import { useNewton } from "../state.js";

import type { XRController } from "../state.js";

// Function overloads
export function useControllersState(): [
  XRController | null,
  XRController | null,
];
export function useControllersState(
  handedness: "left" | "right" | "none",
): [XRController | null];

/**
 * Custom hook to get the state of XR controllers.
 * By default, it returns both controllers, but you can specify "left" or "right" to get only one.
 *
 * @param handedness Optional parameter to specify which controller's state to return.
 * @returns An array containing the state(s) of the requested controller(s).
 */
export function useControllersState(
  handedness?: XRHandedness,
): [XRController | null, XRController | null] | [XRController | null] {
  const controllers = useNewton().controllers;

  if (handedness === "left") {
    return [controllers.left];
  } else if (handedness === "right") {
    return [controllers.right];
  }

  return [controllers.left, controllers.right];
}
