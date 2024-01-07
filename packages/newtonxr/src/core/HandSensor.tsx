import React, { forwardRef, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import {
  ConeCollider,
  CylinderCollider,
  type RapierCollider,
} from "@react-three/rapier";
import { Vector3 } from "three";
import { useShallow } from "zustand/react/shallow";

import { useNewton } from "./index.js";
import type { JointInfo } from "./PhysHand.js";

export type PalmJointNames =
  | "wrist"
  | "thumb-phalanx-proximal"
  | "index-finger-phalanx-proximal"
  | "pinky-finger-phalanx-proximal";

export type PalmJointMap = Map<PalmJointNames, JointInfo>;

export interface PalmProperties {
  joints: PalmJointMap;
  position: THREE.Vector3;
  orientation: THREE.Quaternion;
  direction: THREE.Vector3;
  sensor?: RapierCollider;
  handedness?: "left" | "right";
}

interface HandSensorProps {
  handedness: "left" | "right";
  type?: "cylinder" | "cone";
  children?: React.ReactNode;
}

/**
 * Calculates the sensor properties based on the palm properties and dummy values.
 * @param palm The palm properties.
 * @param sensorHeight The height of the sensor.
 * @param upwardVector Upward direction.
 * @param ref Optional reference to a React ref object.
 */
export function calculateSensorProperties(
  palm: PalmProperties,
  sensorHalfheight: number,
  upwardVector: THREE.Vector3,
  ref?: React.RefObject<RapierCollider>,
): void {
  palm.position.set(0, 0, 0);

  Array.from(palm.joints.values()).map((joint) => {
    palm.position.add(joint.properties.position);
  });

  palm.position.divideScalar(palm.joints.size);

  const wristJoint = palm.joints.get("wrist");

  if (!wristJoint) return;

  const middleFingerMetacarpal = palm.joints.get(
    "index-finger-phalanx-proximal",
  );

  if (!middleFingerMetacarpal) return;

  palm.orientation.copy(wristJoint.properties.orientation);

  // palm.direction
  //   .subVectors(
  //     middleFingerMetacarpal.properties.position,
  //     wristJoint.properties.position,
  //   )
  //   .normalize();

  if (ref) {
    // upwardVector.multiplyScalar(sensorHalfheight);
    // palm.position.add(upwardVector);

    ref.current?.setTranslation(palm.position);
    ref.current?.setRotation(palm.orientation);

    // palm.position.sub(upwardVector);
  }
}

export const HandSensor = forwardRef<RapierCollider, HandSensorProps>(
  ({ handedness, type = "cylinder", children }, ref) => {
    const sensorRef = useRef<RapierCollider>(null);
    const upwardDirection = useRef<THREE.Vector3>(new Vector3(0, 1, 0)).current;

    const palm = useNewton(
      useShallow((state) => state.hands[handedness]?.palm),
    );
    useFrame(() => {
      if (!palm) return;

      // need to fix this so either sensorRef is only used if ref is null
      calculateSensorProperties(palm, 0.04, upwardDirection, sensorRef);
    });

    return (
      <>
        {type === "cylinder" ? (
          <CylinderCollider args={[0.04, 0.04]} ref={ref ?? sensorRef} />
        ) : (
          <ConeCollider args={[0.04, 0.04]} ref={ref ?? sensorRef} />
        )}

        <>{children}</>
      </>
    );
  },
);

HandSensor.displayName = "HandSensor";
