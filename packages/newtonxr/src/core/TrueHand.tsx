import React, { useEffect, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { useRapier } from "@react-three/rapier";

import { useForceUpdate } from "../utils/utils.js";
import TrueHandClass from "./TrueHandClass.js";
import type { HandProperties } from "./TrueHandClass.js";

type OptionalHandProperties = Partial<HandProperties>;

interface TrueHandProps extends OptionalHandProperties {
  inputSource: XRInputSource;
  XRHand: XRHand;
  withNewFingers?: boolean;
  bonesVisible?: boolean;
  boneShape?: "cylinder" | "cuboid" | "capsule";
  id?: number;
}

/**
 * Your hand integrated into the rapier.js physics engine, hand information provided by the [WebXR Device API](https://developer.mozilla.org/en-US/docs/Web/API/WebXR_Device_API).
 *
 * @param XRHand - The XRHand data.
 * @param inputSource - [XRInputSource](https://immersive-web.github.io/webxr/#xrinputsource-interface).
 * @param bonesVisible - Show Three.js rendering of hand. Defaults to false. Currently Inactive
 * @param boneShape - Each finger's collider shape. Defaults to "capsule". Currently Inactive
 * @param id - The id of the hand. Can be retrieved from the inputSource
 * @param withNewFingers - Whether to use experimental fingers, which are revolute joints around the x-axis and has their position change based on motor configuration internally. Defaults to false.
 * @param props - Optional properties for the bones. Includes:
 * - `tipFingersFriction`: `number` (default: `5`)
 * -- "The friction coefficient. Must be greater or equal to 0. This is generally smaller than 1. The higher the coefficient, the stronger friction forces will be for contacts with the collider being built."
 *
 * - `fingersFriction`: `number` (default: `2`)
 * -- Same as **tipFingersFriction**, but for the rest of the fingers.
 *
 * - `restitution`: `number` (default: `0`)
 * -- "The restitution coefficient in [0, 1]. A value of 0 (the default) means no bouncing behavior while 1 means perfect bouncing (though energy may still be lost due to numerical errors of the constraints solver)"".
 *
 * - `density`: `number` (default: `50`)
 *  -- "The density to set, must be greater or equal to 0. A density of 0 means that this collider will not affect the mass or angular inertia of the rigid-body it is attached to."
 *
 * @returns Currently, a primitive object with the hand group, which, in truth, could return `null`. The purpose of this component is to create and update the rigid bodies and impulse joints for the specified hand, `Three.js` meshes are not being rendered.
 *
 */
export const TrueHand = ({
  XRHand,
  inputSource,
  bonesVisible: _ = false,
  boneShape: __ = "capsule",
  id,
  withNewFingers = false,
  ...props
}: TrueHandProps) => {
  const forceUpdate = useForceUpdate();
  const { world, rigidBodyStates, colliderStates } = useRapier();

  const hand = useMemo(() => {
    console.log("TrueHand - handMemo called");
    return new TrueHandClass({
      handedness: inputSource.handedness,
      rapierWorld: world,
      rigidBodyStates,
      colliderStates,
      handProperties: {
        tipFingersFriction: props.tipFingersFriction ?? 5,
        fingersFriction: props.fingersFriction ?? 2,
        restitution: props.restitution ?? 0,
        density: props.density ?? 50,
      },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [world]);

  useEffect(() => {
    hand.setUpdateCallback(forceUpdate);
    return () => {
      hand.clearUpdateCallback();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [forceUpdate]);

  useEffect(() => {
    return () => {
      console.log("TrueHand - cleanup");
      hand.reset();
    };
  }, [hand]);

  useFrame((state, ____, xrFrame) => {
    if (!hand) {
      console.log("TrueHand - no hand");
      return;
    }

    if (!XRHand) {
      console.log("TrueHand - no XRHand");
      return;
    }

    if (!xrFrame) {
      console.log("TrueHand - no xrFrame");
      return;
    }

    const referenceSpace = state.get().gl.xr.getReferenceSpace();

    if (!referenceSpace) {
      console.log("TrueHand - no referenceSpace");
      return;
    }

    hand.updateHandOnFrame(XRHand, xrFrame, referenceSpace, {
      updateRapier: true,
      updateSensor: false,
      withNewFingers,
    });
  });

  return <primitive key={id} object={hand.handGroup} />;
};

TrueHand.displayName = "TrueHand";
