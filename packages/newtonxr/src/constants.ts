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
