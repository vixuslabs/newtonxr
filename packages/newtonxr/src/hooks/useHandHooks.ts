import { useNewton, type HandProperties } from "../index.js";
import type { BoneInfo, HandBoneNames } from "../index.js";
import { findAdjacentBones } from "../utils/utils.js";

// export function useHands(): [HandProperties | null, HandProperties | null];

/**
 * @params `asMap` Default `true` - If false, the .
 *
 * @returns An array containing the properties of the left and right hands, respectfully, or the properties of a single hand.
 */
export function useHands():
  | [HandProperties | null, HandProperties | null]
  | [HandProperties | null] {
  const hands = useNewton().hands;

  return [hands.left, hands.right];
}

/**
 * Custom hook that returns the properties of the hand data stored within the newtonxr [store](../core/store.ts).
 *
 * @param handedness The handedness of the hand.
 * @returns An array of the properties of a single hand or null if the hand does not exist. If "none" is passed, the hook will return null as well.
 */
export function useOneHand(handedness: XRHandedness): [HandProperties | null] {
  const hands = useNewton().hands;

  if (handedness === "none") return [null];

  return handedness === "left" ? [hands.left] : [hands.right];
}

export enum JointType {
  Fixed = "fixed",
  Spherical = "spherical",
  Revolute = "revolute",
  Prismatic = "prismatic",
}

export enum JointOrder {
  "wrist",
  "thumb-metacarpal",
  "thumb-phalanx-proximal",
  "thumb-phalanx-distal",
  "thumb-tip",
  "index-finger-metacarpal",
  "index-finger-phalanx-proximal",
  "index-finger-phalanx-intermediate",
  "index-finger-phalanx-distal",
  "index-finger-tip",
  "middle-finger-metacarpal",
  "middle-finger-phalanx-proximal",
  "middle-finger-phalanx-intermediate",
  "middle-finger-phalanx-distal",
  "middle-finger-tip",
  "ring-finger-metacarpal",
  "ring-finger-phalanx-proximal",
  "ring-finger-phalanx-intermediate",
  "ring-finger-phalanx-distal",
  "ring-finger-tip",
  "pinky-finger-metacarpal",
  "pinky-finger-phalanx-proximal",
  "pinky-finger-phalanx-intermediate",
  "pinky-finger-phalanx-distal",
  "pinky-finger-tip",
}

export enum BoneOrder {
  "wrist--thumb-metacarpal",
  "thumb-metacarpal--thumb-phalanx-proximal",
  "thumb-phalanx-proximal--thumb-phalanx-distal",
  "thumb-phalanx-distal--thumb-tip",
  "wrist--index-finger-metacarpal",
  "index-finger-metacarpal--index-finger-phalanx-proximal",
  "index-finger-phalanx-proximal--index-finger-phalanx-intermediate",
  "index-finger-phalanx-intermediate--index-finger-phalanx-distal",
  "index-finger-phalanx-distal--index-finger-tip",
  "wrist--middle-finger-metacarpal",
  "middle-finger-metacarpal--middle-finger-phalanx-proximal",
  "middle-finger-phalanx-proximal--middle-finger-phalanx-intermediate",
  "middle-finger-phalanx-intermediate--middle-finger-phalanx-distal",
  "middle-finger-phalanx-distal--middle-finger-tip",
  "wrist--ring-finger-metacarpal",
  "ring-finger-metacarpal--ring-finger-phalanx-proximal",
  "ring-finger-phalanx-proximal--ring-finger-phalanx-intermediate",
  "ring-finger-phalanx-intermediate--ring-finger-phalanx-distal",
  "ring-finger-phalanx-distal--ring-finger-tip",
  "wrist--pinky-finger-metacarpal",
  "pinky-finger-metacarpal--pinky-finger-phalanx-proximal",
  "pinky-finger-phalanx-proximal--pinky-finger-phalanx-intermediate",
  "pinky-finger-phalanx-intermediate--pinky-finger-phalanx-distal",
  "pinky-finger-phalanx-distal--pinky-finger-tip",
}

export const jointTypeMappings = new Map<XRHandJoint, JointType>([
  // Wrist and thumb joints
  ["wrist", JointType.Spherical],
  ["thumb-metacarpal", JointType.Spherical],
  ["thumb-phalanx-proximal", JointType.Spherical],
  ["thumb-phalanx-distal", JointType.Revolute],
  ["thumb-tip", JointType.Fixed],

  // Index finger joints
  ["index-finger-metacarpal", JointType.Spherical],
  ["index-finger-phalanx-proximal", JointType.Spherical],
  ["index-finger-phalanx-intermediate", JointType.Revolute],
  ["index-finger-phalanx-distal", JointType.Revolute],
  ["index-finger-tip", JointType.Fixed],

  // Middle finger joints
  ["middle-finger-metacarpal", JointType.Spherical],
  ["middle-finger-phalanx-proximal", JointType.Spherical],
  ["middle-finger-phalanx-intermediate", JointType.Revolute],
  ["middle-finger-phalanx-distal", JointType.Revolute],
  ["middle-finger-tip", JointType.Fixed],

  // Ring finger joints
  ["ring-finger-metacarpal", JointType.Spherical],
  ["ring-finger-phalanx-proximal", JointType.Spherical],
  ["ring-finger-phalanx-intermediate", JointType.Revolute],
  ["ring-finger-phalanx-distal", JointType.Revolute],
  ["ring-finger-tip", JointType.Fixed],

  // Pinky finger joints
  ["pinky-finger-metacarpal", JointType.Spherical],
  ["pinky-finger-phalanx-proximal", JointType.Spherical],
  ["pinky-finger-phalanx-intermediate", JointType.Revolute],
  ["pinky-finger-phalanx-distal", JointType.Revolute],
  ["pinky-finger-tip", JointType.Fixed],
]);

// interface AdjacentBonesInfo {
//   firstBone: BoneInfo;
//   secondBone: BoneInfo;
// }
type AdjacentBonesInfo = [firstBoneName: BoneInfo, secondBoneName: BoneInfo];

/**
 * A hook that returns the adjacent bones of a given joint.
 * @param jointName All XRHandJoint except "wrist". This is because the wrist joint only has one adjacent bone. All for `null` due to initial render and when the joint is not found.
 * @param handedness The handedness of the hand.
 * @returns
 */
export function useBonesFromJoint(
  jointName: XRHandJoint | null,
  handedness: XRHandedness,
): [firstBoneName: BoneInfo | null, secondBoneName: BoneInfo | null] {
  const [hand] = useOneHand(handedness);

  if (!hand) return [null, null];

  if (!jointName) {
    console.log("JointName is null, returning null");
    return [null, null];
  }

  if (jointName === "wrist") {
    console.log("useBonesFromJoint: JointName is wrist, returning null");
    return [null, null];
  }

  const bones = findAdjacentBones(jointName);

  if (!bones.firstBoneName || !bones.secondBoneName) {
    console.log("Bones not found, returning null");
    return [null, null];
  }

  const startBone = hand.bones.get(bones.firstBoneName);
  const endBone = hand.bones.get(bones.secondBoneName);

  if (!startBone || !endBone) return [null, null];

  return [startBone, endBone];
}

export function useBones(handedness: XRHandedness): (BoneInfo | undefined)[] {
  const [hand] = useOneHand(handedness);

  if (!hand) return [];

  const boneOrder: HandBoneNames[] = [
    "wrist--thumb-metacarpal",
    "thumb-metacarpal--thumb-phalanx-proximal",
    "thumb-phalanx-proximal--thumb-phalanx-distal",
    "thumb-phalanx-distal--thumb-tip",
    "wrist--index-finger-metacarpal",
    "index-finger-metacarpal--index-finger-phalanx-proximal",
    "index-finger-phalanx-proximal--index-finger-phalanx-intermediate",
    "index-finger-phalanx-intermediate--index-finger-phalanx-distal",
    "index-finger-phalanx-distal--index-finger-tip",
    "wrist--middle-finger-metacarpal",
    "middle-finger-metacarpal--middle-finger-phalanx-proximal",
    "middle-finger-phalanx-proximal--middle-finger-phalanx-intermediate",
    "middle-finger-phalanx-intermediate--middle-finger-phalanx-distal",
    "middle-finger-phalanx-distal--middle-finger-tip",
    "wrist--ring-finger-metacarpal",
    "ring-finger-metacarpal--ring-finger-phalanx-proximal",
    "ring-finger-phalanx-proximal--ring-finger-phalanx-intermediate",
    "ring-finger-phalanx-intermediate--ring-finger-phalanx-distal",
    "ring-finger-phalanx-distal--ring-finger-tip",
    "wrist--pinky-finger-metacarpal",
    "pinky-finger-metacarpal--pinky-finger-phalanx-proximal",
    "pinky-finger-phalanx-proximal--pinky-finger-phalanx-intermediate",
    "pinky-finger-phalanx-intermediate--pinky-finger-phalanx-distal",
    "pinky-finger-phalanx-distal--pinky-finger-tip",
    "wrist--thumb-metacarpal",
  ];

  let complete = true;

  const orderedBones = boneOrder.map((_bone) => {
    const bone = hand.bones.get(_bone)!;

    if (!bone) {
      console.warn(`Bone ${_bone} not found, forcing returning for testing`);
      complete = false;
      return undefined;
    }

    return bone;
  });

  if (!complete) return [];

  return orderedBones as BoneInfo[];
}
