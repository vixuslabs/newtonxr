import { Quaternion, Vector3 } from "three";

import type { JointInfo } from "./index.js";

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

// export enum HandJoints {
//   "wrist" = 0,
//   "thumb-metacarpal" = 1,
//   "thumb-phalanx-proximal" = 2,
//   "thumb-phalanx-distal" = 3,
//   "thumb-tip" = 4,
//   "index-finger-metacarpal" = 5,
//   "index-finger-phalanx-proximal" = 6,
//   "index-finger-phalanx-intermediate" = 7,
//   "index-finger-phalanx-distal" = 8,
//   "index-finger-tip" = 9,
//   "middle-finger-metacarpal" = 10,
//   "middle-finger-phalanx-proximal" = 11,
//   "middle-finger-phalanx-intermediate" = 12,
//   "middle-finger-phalanx-distal" = 13,
//   "middle-finger-tip" = 14,
//   "ring-finger-metacarpal" = 15,
//   "ring-finger-phalanx-proximal" = 16,
//   "ring-finger-phalanx-intermediate" = 17,
//   "ring-finger-phalanx-distal" = 18,
//   "ring-finger-tip" = 19,
//   "pinky-finger-metacarpal" = 20,
//   "pinky-finger-phalanx-proximal" = 21,
//   "pinky-finger-phalanx-intermediate" = 22,
//   "pinky-finger-phalanx-distal" = 23,
//   "pinky-finger-tip" = 24,
// }

export enum HandJoints {
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
  [key in HandJoints]: XRHandJoint[];
} = {
  [HandJoints.wrist]: [
    "thumb-metacarpal",
    "index-finger-metacarpal",
    "middle-finger-metacarpal",
    "ring-finger-metacarpal",
    "pinky-finger-metacarpal",
  ],
  [HandJoints["thumb-metacarpal"]]: ["thumb-phalanx-proximal"],
  [HandJoints["thumb-phalanx-proximal"]]: ["thumb-phalanx-distal"],
  [HandJoints["thumb-phalanx-distal"]]: ["thumb-tip"],
  [HandJoints["index-finger-metacarpal"]]: ["index-finger-phalanx-proximal"],
  [HandJoints["index-finger-phalanx-proximal"]]: [
    "index-finger-phalanx-intermediate",
  ],
  [HandJoints["index-finger-phalanx-intermediate"]]: [
    "index-finger-phalanx-distal",
  ],
  [HandJoints["index-finger-phalanx-distal"]]: ["index-finger-tip"],
  [HandJoints["middle-finger-metacarpal"]]: ["middle-finger-phalanx-proximal"],
  [HandJoints["middle-finger-phalanx-proximal"]]: [
    "middle-finger-phalanx-intermediate",
  ],
  [HandJoints["middle-finger-phalanx-intermediate"]]: [
    "middle-finger-phalanx-distal",
  ],
  [HandJoints["middle-finger-phalanx-distal"]]: ["middle-finger-tip"],
  [HandJoints["ring-finger-metacarpal"]]: ["ring-finger-phalanx-proximal"],
  [HandJoints["ring-finger-phalanx-proximal"]]: [
    "ring-finger-phalanx-intermediate",
  ],
  [HandJoints["ring-finger-phalanx-intermediate"]]: [
    "ring-finger-phalanx-distal",
  ],
  [HandJoints["ring-finger-phalanx-distal"]]: ["ring-finger-tip"],
  [HandJoints["pinky-finger-metacarpal"]]: ["pinky-finger-phalanx-proximal"],
  [HandJoints["pinky-finger-phalanx-proximal"]]: [
    "pinky-finger-phalanx-intermediate",
  ],
  [HandJoints["pinky-finger-phalanx-intermediate"]]: [
    "pinky-finger-phalanx-distal",
  ],
  [HandJoints["pinky-finger-phalanx-distal"]]: ["pinky-finger-tip"],
  // The tips of the fingers do not connect to anything further
  [HandJoints["thumb-tip"]]: [],
  [HandJoints["index-finger-tip"]]: [],
  [HandJoints["middle-finger-tip"]]: [],
  [HandJoints["ring-finger-tip"]]: [],
  [HandJoints["pinky-finger-tip"]]: [],
};

// export const defaultHandJointPositions = new Map<HandJoints, BoneInfo>([
export const defaultHandJointValues = new Map<HandJoints, JointInfo>([
  [
    HandJoints.wrist,
    {
      name: "wrist",
      properties: {
        position: new Vector3(),
        orientation: new Quaternion(),
      },
      isTipJoint: false,
    },
  ],
  [
    HandJoints["thumb-metacarpal"],
    {
      name: "thumb-metacarpal",
      properties: {
        position: new Vector3(),
        orientation: new Quaternion(),
      },
      isTipJoint: false,
    },
  ],
  [
    HandJoints["thumb-phalanx-proximal"],
    {
      name: "thumb-phalanx-proximal",
      properties: {
        position: new Vector3(),
        orientation: new Quaternion(),
      },
      isTipJoint: false,
    },
  ],
  [
    HandJoints["thumb-phalanx-distal"],
    {
      name: "thumb-phalanx-distal",
      properties: {
        position: new Vector3(),
        orientation: new Quaternion(),
      },
      isTipJoint: false,
    },
  ],
  [
    HandJoints["thumb-tip"],
    {
      name: "thumb-tip",
      properties: {
        position: new Vector3(),
        orientation: new Quaternion(),
      },
      isTipJoint: true,
    },
  ],
  [
    HandJoints["index-finger-metacarpal"],
    {
      name: "index-finger-metacarpal",
      properties: {
        position: new Vector3(),
        orientation: new Quaternion(),
      },
      isTipJoint: false,
    },
  ],
  [
    HandJoints["index-finger-phalanx-proximal"],
    {
      name: "index-finger-phalanx-proximal",
      properties: {
        position: new Vector3(),
        orientation: new Quaternion(),
      },
      isTipJoint: false,
    },
  ],
  [
    HandJoints["index-finger-phalanx-intermediate"],
    {
      name: "index-finger-phalanx-intermediate",
      properties: {
        position: new Vector3(),
        orientation: new Quaternion(),
      },
      isTipJoint: false,
    },
  ],
  [
    HandJoints["index-finger-phalanx-distal"],
    {
      name: "index-finger-phalanx-distal",
      properties: {
        position: new Vector3(),
        orientation: new Quaternion(),
      },
      isTipJoint: false,
    },
  ],
  [
    HandJoints["index-finger-tip"],
    {
      name: "index-finger-tip",
      properties: {
        position: new Vector3(),
        orientation: new Quaternion(),
      },
      isTipJoint: true,
    },
  ],
  [
    HandJoints["middle-finger-metacarpal"],
    {
      name: "middle-finger-metacarpal",
      properties: {
        position: new Vector3(),
        orientation: new Quaternion(),
      },
      isTipJoint: false,
    },
  ],
  [
    HandJoints["middle-finger-phalanx-proximal"],
    {
      name: "middle-finger-phalanx-proximal",
      properties: {
        position: new Vector3(),
        orientation: new Quaternion(),
      },
      isTipJoint: false,
    },
  ],
  [
    HandJoints["middle-finger-phalanx-intermediate"],
    {
      name: "middle-finger-phalanx-intermediate",
      properties: {
        position: new Vector3(),
        orientation: new Quaternion(),
      },
      isTipJoint: false,
    },
  ],
  [
    HandJoints["middle-finger-phalanx-distal"],
    {
      name: "middle-finger-phalanx-distal",
      properties: {
        position: new Vector3(),
        orientation: new Quaternion(),
      },
      isTipJoint: false,
    },
  ],
  [
    HandJoints["middle-finger-tip"],
    {
      name: "middle-finger-tip",
      properties: {
        position: new Vector3(),
        orientation: new Quaternion(),
      },
      isTipJoint: true,
    },
  ],
  [
    HandJoints["ring-finger-metacarpal"],
    {
      name: "ring-finger-metacarpal",
      properties: {
        position: new Vector3(),
        orientation: new Quaternion(),
      },
      isTipJoint: false,
    },
  ],
  [
    HandJoints["ring-finger-phalanx-proximal"],
    {
      name: "ring-finger-phalanx-proximal",
      properties: {
        position: new Vector3(),
        orientation: new Quaternion(),
      },
      isTipJoint: false,
    },
  ],
  [
    HandJoints["ring-finger-phalanx-intermediate"],
    {
      name: "ring-finger-phalanx-intermediate",
      properties: {
        position: new Vector3(),
        orientation: new Quaternion(),
      },
      isTipJoint: false,
    },
  ],
  [
    HandJoints["ring-finger-phalanx-distal"],
    {
      name: "ring-finger-phalanx-distal",
      properties: {
        position: new Vector3(),
        orientation: new Quaternion(),
      },
      isTipJoint: false,
    },
  ],
  [
    HandJoints["ring-finger-tip"],
    {
      name: "ring-finger-tip",
      properties: {
        position: new Vector3(),
        orientation: new Quaternion(),
      },
      isTipJoint: true,
    },
  ],
  [
    HandJoints["pinky-finger-metacarpal"],
    {
      name: "pinky-finger-metacarpal",
      properties: {
        position: new Vector3(),
        orientation: new Quaternion(),
      },
      isTipJoint: false,
    },
  ],
  [
    HandJoints["pinky-finger-phalanx-proximal"],
    {
      name: "pinky-finger-phalanx-proximal",
      properties: {
        position: new Vector3(),
        orientation: new Quaternion(),
      },
      isTipJoint: false,
    },
  ],
  [
    HandJoints["pinky-finger-phalanx-intermediate"],
    {
      name: "pinky-finger-phalanx-intermediate",
      properties: {
        position: new Vector3(),
        orientation: new Quaternion(),
      },
      isTipJoint: false,
    },
  ],
  [
    HandJoints["pinky-finger-phalanx-distal"],
    {
      name: "pinky-finger-phalanx-distal",
      properties: {
        position: new Vector3(),
        orientation: new Quaternion(),
      },
      isTipJoint: false,
    },
  ],
  [
    HandJoints["pinky-finger-tip"],
    {
      name: "pinky-finger-tip",
      properties: {
        position: new Vector3(),
        orientation: new Quaternion(),
      },
      isTipJoint: true,
    },
  ],
]);

export const joints = [
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
] as const;
