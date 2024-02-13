import { useCallback, useRef, useState } from "react";
import type {
  Quaternion as RapierQuaternion,
  Vector3 as RapierVector3,
} from "@dimforge/rapier3d-compat";

import type { HandBoneNames } from "../index.js";

export const findCommonJoint = (
  boneName1: HandBoneNames,
  boneName2: HandBoneNames,
): XRHandJoint | null => {
  const startNameWords = boneName1.split("--");
  const endNameWords = boneName2.split("--");

  for (const word of startNameWords) {
    // if (word === "wrist") continue;
    if (word === endNameWords[0] || word === endNameWords[1]) {
      return word as Exclude<XRHandJoint, "wrist">;
    }
  }

  return null;
};

interface AdjacentBones {
  firstBoneName: HandBoneNames;
  secondBoneName: HandBoneNames;
}

export const lerpRapierVectors = (
  v1: RapierVector3,
  v2: RapierVector3,
  alpha: number,
) => {
  return {
    x: v1.x + (v2.x - v1.x) * alpha,
    y: v1.y + (v2.y - v1.y) * alpha,
    z: v1.z + (v2.z - v1.z) * alpha,
  };
};

export function useConst<T>(initialValue: T | (() => T)): T {
  const ref = useRef<{ value: T }>();
  if (ref.current === undefined) {
    ref.current = {
      value:
        typeof initialValue === "function"
          ? (initialValue as () => T)()
          : initialValue,
    };
  }
  return ref.current.value;
}

export function useForceUpdate() {
  const [, setTick] = useState(0);
  const update = useCallback(() => {
    setTick((tick) => tick + 1);
  }, []);
  return update;
}

/**
 *
 * @param jointName All XRHandJoint except "wrist". This is because the wrist joint only has one adjacent bone.
 * @returns An object which contains the bone information (BoneInfo) of the two adjacent bones.
 */
export const findAdjacentBones = (
  jointName: Exclude<XRHandJoint, "wrist">,
): AdjacentBones => {
  switch (jointName) {
    case "thumb-metacarpal":
      return {
        firstBoneName: "wrist--thumb-metacarpal",
        secondBoneName: "thumb-metacarpal--thumb-phalanx-proximal",
      };
    case "thumb-phalanx-proximal":
      return {
        firstBoneName: "thumb-metacarpal--thumb-phalanx-proximal",
        secondBoneName: "thumb-phalanx-proximal--thumb-phalanx-distal",
      };
    case "thumb-phalanx-distal":
      return {
        firstBoneName: "thumb-phalanx-proximal--thumb-phalanx-distal",
        secondBoneName: "thumb-phalanx-distal--thumb-tip",
      };
    case "index-finger-metacarpal":
      return {
        firstBoneName: "wrist--index-finger-metacarpal",
        secondBoneName:
          "index-finger-metacarpal--index-finger-phalanx-proximal",
      };
    case "index-finger-phalanx-proximal":
      return {
        firstBoneName: "index-finger-metacarpal--index-finger-phalanx-proximal",
        secondBoneName:
          "index-finger-phalanx-proximal--index-finger-phalanx-intermediate",
      };
    case "index-finger-phalanx-intermediate":
      return {
        firstBoneName:
          "index-finger-phalanx-proximal--index-finger-phalanx-intermediate",
        secondBoneName:
          "index-finger-phalanx-intermediate--index-finger-phalanx-distal",
      };
    case "index-finger-phalanx-distal":
      return {
        firstBoneName:
          "index-finger-phalanx-intermediate--index-finger-phalanx-distal",
        secondBoneName: "index-finger-phalanx-distal--index-finger-tip",
      };
    case "middle-finger-metacarpal":
      return {
        firstBoneName: "wrist--middle-finger-metacarpal",
        secondBoneName:
          "middle-finger-metacarpal--middle-finger-phalanx-proximal",
      };
    case "middle-finger-phalanx-proximal":
      return {
        firstBoneName:
          "middle-finger-metacarpal--middle-finger-phalanx-proximal",
        secondBoneName:
          "middle-finger-phalanx-proximal--middle-finger-phalanx-intermediate",
      };
    case "middle-finger-phalanx-intermediate":
      return {
        firstBoneName:
          "middle-finger-phalanx-proximal--middle-finger-phalanx-intermediate",
        secondBoneName:
          "middle-finger-phalanx-intermediate--middle-finger-phalanx-distal",
      };
    case "middle-finger-phalanx-distal":
      return {
        firstBoneName:
          "middle-finger-phalanx-intermediate--middle-finger-phalanx-distal",
        secondBoneName: "middle-finger-phalanx-distal--middle-finger-tip",
      };
    case "ring-finger-metacarpal":
      return {
        firstBoneName: "wrist--ring-finger-metacarpal",
        secondBoneName: "ring-finger-metacarpal--ring-finger-phalanx-proximal",
      };
    case "ring-finger-phalanx-proximal":
      return {
        firstBoneName: "ring-finger-metacarpal--ring-finger-phalanx-proximal",
        secondBoneName:
          "ring-finger-phalanx-proximal--ring-finger-phalanx-intermediate",
      };
    case "ring-finger-phalanx-intermediate":
      return {
        firstBoneName:
          "ring-finger-phalanx-proximal--ring-finger-phalanx-intermediate",
        secondBoneName:
          "ring-finger-phalanx-intermediate--ring-finger-phalanx-distal",
      };
    case "ring-finger-phalanx-distal":
      return {
        firstBoneName:
          "ring-finger-phalanx-intermediate--ring-finger-phalanx-distal",
        secondBoneName: "ring-finger-phalanx-distal--ring-finger-tip",
      };
    case "pinky-finger-metacarpal":
      return {
        firstBoneName: "wrist--pinky-finger-metacarpal",
        secondBoneName:
          "pinky-finger-metacarpal--pinky-finger-phalanx-proximal",
      };
    case "pinky-finger-phalanx-proximal":
      return {
        firstBoneName: "pinky-finger-metacarpal--pinky-finger-phalanx-proximal",
        secondBoneName:
          "pinky-finger-phalanx-proximal--pinky-finger-phalanx-intermediate",
      };
    case "pinky-finger-phalanx-intermediate":
      return {
        firstBoneName:
          "pinky-finger-phalanx-proximal--pinky-finger-phalanx-intermediate",
        secondBoneName:
          "pinky-finger-phalanx-intermediate--pinky-finger-phalanx-distal",
      };
    case "pinky-finger-phalanx-distal":
      return {
        firstBoneName:
          "pinky-finger-phalanx-intermediate--pinky-finger-phalanx-distal",
        secondBoneName: "pinky-finger-phalanx-distal--pinky-finger-tip",
      };
    default:
      throw new Error(`Unknown joint name: ${jointName}`);
  }
};
