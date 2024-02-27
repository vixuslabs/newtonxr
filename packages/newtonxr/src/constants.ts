import { XRHandJointEnum } from "./core/TrueHandClass.js";
/**
 * organizing collision groups
 * @note interaction groups go from 0 to 15
 */
export const collisionGroups = {
  hands: 0,
  "left-hand": 1,
  "right-hand": 2,
  controllers: 3,
  "left-controller": 4,
  "right-controller": 5,
  "tracked-planes": 6,
  "tracked-meshes": 7,
  objects: 8,
};

export enum CollisionGroups {
  Hands = 0,
  LeftHand = 1,
  RightHand = 2,
  Controllers = 3,
  LeftController = 4,
  RightController = 5,
  TrackedPlanes = 6,
  TrackedMeshes = 7,
  Objects = 8,
}

export const jointConnectionsNumbers: Record<number, number[]> = {
  0: [1, 5, 10, 15, 20], // wrist connections to thumb and fingers
  1: [2], // thumb metacarpal to proximal phalanx
  2: [3], // thumb proximal phalanx to distal phalanx
  3: [4], // thumb distal phalanx to tip
  5: [6], // index metacarpal to proximal phalanx
  6: [7], // index proximal phalanx to intermediate phalanx
  7: [8], // index intermediate phalanx to distal phalanx
  8: [9], // index distal phalanx to tip
  10: [11], // middle metacarpal to proximal phalanx
  11: [12], // middle proximal phalanx to intermediate phalanx
  12: [13], // middle intermediate phalanx to distal phalanx
  13: [14], // middle distal phalanx to tip
  15: [16], // ring metacarpal to proximal phalanx
  16: [17], // ring proximal phalanx to intermediate phalanx
  17: [18], // ring intermediate phalanx to distal phalanx
  18: [19], // ring distal phalanx to tip
  20: [21], // pinky metacarpal to proximal phalanx
  21: [22], // pinky proximal phalanx to intermediate phalanx
  22: [23], // pinky intermediate phalanx to distal phalanx
  23: [24], // pinky distal phalanx to tip
  // The tips of the fingers do not connect to anything further
  4: [],
  9: [],
  14: [],
  19: [],
  24: [],
};

export const jointConnections: {
  [key in XRHandJointEnum]: XRHandJoint[];
} = {
  [XRHandJointEnum.wrist]: [
    "thumb-metacarpal",
    "index-finger-metacarpal",
    "middle-finger-metacarpal",
    "ring-finger-metacarpal",
    "pinky-finger-metacarpal",
  ],
  [XRHandJointEnum["thumb-metacarpal"]]: ["thumb-phalanx-proximal"],
  [XRHandJointEnum["thumb-phalanx-proximal"]]: ["thumb-phalanx-distal"],
  [XRHandJointEnum["thumb-phalanx-distal"]]: ["thumb-tip"],
  [XRHandJointEnum["index-finger-metacarpal"]]: [
    "index-finger-phalanx-proximal",
  ],
  [XRHandJointEnum["index-finger-phalanx-proximal"]]: [
    "index-finger-phalanx-intermediate",
  ],
  [XRHandJointEnum["index-finger-phalanx-intermediate"]]: [
    "index-finger-phalanx-distal",
  ],
  [XRHandJointEnum["index-finger-phalanx-distal"]]: ["index-finger-tip"],
  [XRHandJointEnum["middle-finger-metacarpal"]]: [
    "middle-finger-phalanx-proximal",
  ],
  [XRHandJointEnum["middle-finger-phalanx-proximal"]]: [
    "middle-finger-phalanx-intermediate",
  ],
  [XRHandJointEnum["middle-finger-phalanx-intermediate"]]: [
    "middle-finger-phalanx-distal",
  ],
  [XRHandJointEnum["middle-finger-phalanx-distal"]]: ["middle-finger-tip"],
  [XRHandJointEnum["ring-finger-metacarpal"]]: ["ring-finger-phalanx-proximal"],
  [XRHandJointEnum["ring-finger-phalanx-proximal"]]: [
    "ring-finger-phalanx-intermediate",
  ],
  [XRHandJointEnum["ring-finger-phalanx-intermediate"]]: [
    "ring-finger-phalanx-distal",
  ],
  [XRHandJointEnum["ring-finger-phalanx-distal"]]: ["ring-finger-tip"],
  [XRHandJointEnum["pinky-finger-metacarpal"]]: [
    "pinky-finger-phalanx-proximal",
  ],
  [XRHandJointEnum["pinky-finger-phalanx-proximal"]]: [
    "pinky-finger-phalanx-intermediate",
  ],
  [XRHandJointEnum["pinky-finger-phalanx-intermediate"]]: [
    "pinky-finger-phalanx-distal",
  ],
  [XRHandJointEnum["pinky-finger-phalanx-distal"]]: ["pinky-finger-tip"],
  // The tips of the fingers do not connect to anything further
  [XRHandJointEnum["thumb-tip"]]: [],
  [XRHandJointEnum["index-finger-tip"]]: [],
  [XRHandJointEnum["middle-finger-tip"]]: [],
  [XRHandJointEnum["ring-finger-tip"]]: [],
  [XRHandJointEnum["pinky-finger-tip"]]: [],
};
