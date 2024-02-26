import { type UUID } from "crypto";
import React from "react";
import RAPIER, { type World } from "@dimforge/rapier3d-compat";
import type {
  RapierCollider,
  RapierRigidBody,
  Vector3Object,
} from "@react-three/rapier";
import { interactionGroups } from "@react-three/rapier";
import type {
  ColliderStateMap,
  RigidBodyStateMap,
} from "@react-three/rapier/dist/declarations/src/components/Physics.js";
import * as THREE from "three";
import { Quaternion, Vector3 } from "three";

import { JointType } from "../hooks/useHandHooks.js";
import {
  _direction,
  // _object,
  _position,
  _quaternion,
  _quaternion2,
  _vector,
} from "../utils/reserveThreeValues.js";
import { isTipJointName } from "./index.js";

const ORIGIN = new Vector3(0, 0, 0);

const AXIS_VECTORS = {
  x: new Vector3(1, 0, 0),
  y: new Vector3(0, 1, 0),
  z: new Vector3(0, 0, 1),
};

const BONE_ROTATION_QUATERNION = new Quaternion().setFromAxisAngle(
  AXIS_VECTORS.x,
  -Math.PI / 2,
);

// const BONE_ROTATION_QUATERNION = new Quaternion().setFromAxisAngle(
//   AXIS_VECTORS.x,
//   Math.PI / 2,
// );

export const jointTypeMappings = new Map<XRHandJoint, JointType>([
  // Wrist and thumb joints
  ["wrist", JointType.Revolute],
  ["thumb-metacarpal", JointType.Revolute],
  ["thumb-phalanx-proximal", JointType.Revolute],
  ["thumb-phalanx-distal", JointType.Revolute],
  ["thumb-tip", JointType.Fixed],

  // Index finger joints
  ["index-finger-metacarpal", JointType.Revolute],
  ["index-finger-phalanx-proximal", JointType.Fixed],
  ["index-finger-phalanx-intermediate", JointType.Revolute],
  ["index-finger-phalanx-distal", JointType.Revolute],
  ["index-finger-tip", JointType.Fixed],

  // Middle finger joints
  ["middle-finger-metacarpal", JointType.Revolute],
  ["middle-finger-phalanx-proximal", JointType.Fixed],
  ["middle-finger-phalanx-intermediate", JointType.Revolute],
  ["middle-finger-phalanx-distal", JointType.Revolute],
  ["middle-finger-tip", JointType.Fixed],

  // Ring finger joints
  ["ring-finger-metacarpal", JointType.Revolute],
  ["ring-finger-phalanx-proximal", JointType.Fixed],
  ["ring-finger-phalanx-intermediate", JointType.Revolute],
  ["ring-finger-phalanx-distal", JointType.Revolute],
  ["ring-finger-tip", JointType.Fixed],

  // Pinky finger joints
  ["pinky-finger-metacarpal", JointType.Revolute],
  ["pinky-finger-phalanx-proximal", JointType.Fixed],
  ["pinky-finger-phalanx-intermediate", JointType.Revolute],
  ["pinky-finger-phalanx-distal", JointType.Revolute],
  ["pinky-finger-tip", JointType.Fixed],
]);

export interface Vector4Object {
  x: number;
  y: number;
  z: number;
  w: number;
}

interface TrueHandOptions {
  handedness: XRHandedness;
  rapierWorld: World;
  colliderStates: ColliderStateMap;
  rigidBodyStates: RigidBodyStateMap;
  withSensor?: boolean;
}

type PalmSensorJointNames = Extract<
  XRHandJoint,
  | "wrist"
  | "thumb-phalanx-proximal"
  | "index-finger-phalanx-proximal"
  | "pinky-finger-phalanx-proximal"
>;

const PalmSensorJointNamesArr: XRHandJoint[] = [
  "wrist",
  "thumb-phalanx-proximal",
  "index-finger-phalanx-proximal",
  "pinky-finger-phalanx-proximal",
];

export function isPalmJointName(
  name: XRHandJoint,
): name is PalmSensorJointNames {
  return PalmSensorJointNamesArr.includes(name);
}

export function isFingerBoneName(name: HandBoneNames): name is FingerBoneNames {
  return fingerBoneNamesArr.includes(name as FingerBoneNames);
}

export function isFingerJointName(name: XRHandJoint): name is FingerJoints {
  return fingerJointNames.includes(name as FingerJoints);
}

interface PalmProperties {
  joint: JointInfo;
  sensor?: React.RefObject<RapierCollider>;
}

export type PalmJointMap = Map<PalmSensorJointNames, PalmProperties>;
[3, 8, 15];

export enum HandBoneNamesEnum {
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

export type HandBoneNames = keyof typeof HandBoneNamesEnum;

export const boneNames: HandBoneNames[] = [
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
];

export enum XRHandJointEnum {
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

const jointNames: XRHandJoint[] = [
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
];

type FixedHandJoints =
  | "index-finger-metacarpal"
  | "index-finger-phalanx-proximal"
  | "middle-finger-metacarpal"
  | "middle-finger-phalanx-proximal"
  | "ring-finger-metacarpal"
  | "ring-finger-phalanx-proximal"
  | "pinky-finger-metacarpal"
  | "pinky-finger-phalanx-proximal";

export type FixedHandJointsArr = [
  "index-finger-metacarpal",
  "index-finger-phalanx-proximal",
  "middle-finger-metacarpal",
  "middle-finger-phalanx-proximal",
  "ring-finger-metacarpal",
  "ring-finger-phalanx-proximal",
  "pinky-finger-metacarpal",
  "pinky-finger-phalanx-proximal",
];

const fixedHandJoints: FixedHandJoints[] = [
  "index-finger-metacarpal",
  "index-finger-phalanx-proximal",
  "middle-finger-metacarpal",
  "middle-finger-phalanx-proximal",
  "ring-finger-metacarpal",
  "ring-finger-phalanx-proximal",
  "pinky-finger-metacarpal",
  "pinky-finger-phalanx-proximal",
];

export type FixedHandBones =
  | "wrist--thumb-metacarpal"
  | "wrist--index-finger-metacarpal"
  | "index-finger-metacarpal--index-finger-phalanx-proximal"
  | "wrist--middle-finger-metacarpal"
  | "middle-finger-metacarpal--middle-finger-phalanx-proximal"
  | "wrist--ring-finger-metacarpal"
  | "ring-finger-metacarpal--ring-finger-phalanx-proximal"
  | "wrist--pinky-finger-metacarpal"
  | "pinky-finger-metacarpal--pinky-finger-phalanx-proximal";

export type FixedHandBonesArr = [
  "wrist--thumb-metacarpal",
  "wrist--index-finger-metacarpal",
  "index-finger-metacarpal--index-finger-phalanx-proximal",
  "wrist--middle-finger-metacarpal",
  "middle-finger-metacarpal--middle-finger-phalanx-proximal",
  "wrist--ring-finger-metacarpal",
  "ring-finger-metacarpal--ring-finger-phalanx-proximal",
  "wrist--pinky-finger-metacarpal",
  "pinky-finger-metacarpal--pinky-finger-phalanx-proximal",
];

export const fixedHandBones: FixedHandBonesArr = [
  "wrist--thumb-metacarpal",
  "wrist--index-finger-metacarpal",
  "index-finger-metacarpal--index-finger-phalanx-proximal",
  "wrist--middle-finger-metacarpal",
  "middle-finger-metacarpal--middle-finger-phalanx-proximal",
  "wrist--ring-finger-metacarpal",
  "ring-finger-metacarpal--ring-finger-phalanx-proximal",
  "wrist--pinky-finger-metacarpal",
  "pinky-finger-metacarpal--pinky-finger-phalanx-proximal",
];

interface UpdateBonesOnFrameOptions {
  updateRapier?: boolean;
  updateSensor?: boolean;
  withNewFingers?: boolean;
}

interface TransformProperties {
  position: THREE.Vector3;
  orientation: THREE.Quaternion;
}

interface JointProperties {
  position: THREE.Vector3;
  orientation: THREE.Quaternion;
}

interface JointInfo {
  name: XRHandJoint;
  transform: JointProperties;
  readonly isTipJoint: boolean;
  attachedRapierJoints: AttachedRapierJoints;
  handedness?: "left" | "right";
}

export interface AttachedRapierJoints {
  spring?: RAPIER.ImpulseJoint;
  generic?: RAPIER.ImpulseJoint;
  top?: RAPIER.ImpulseJoint;
  bottom?: RAPIER.ImpulseJoint;
}

type BoneGeometry = "box" | "cylinder";

interface RapierBoneInfo {
  rigidBody: RAPIER.RigidBody;
  bottomRbJoint: RAPIER.RigidBody;
  topRbJoint: RAPIER.RigidBody;
  transform?: TransformProperties;
  connectedImpulseJoints: AttachedRapierJoints;
  three: {
    args: {
      width?: number;
      height?: number;
      depth?: number;
      radiusTop?: number;
      radiusBottom?: number;
      heightSegments?: number;
      radialSegments?: number;
    };
    type: BoneGeometry;
    bone?: THREE.Mesh;
  };
}

export interface BoneInfo {
  isTipBone: boolean;
  joints: {
    top: JointInfo;
    bottom: JointInfo;
  };
  kinematic: RapierBoneInfo;
  dynamic: RapierBoneInfo;
}

export interface OldBoneInfo {
  name: HandBoneNames;
  id: UUID;
  startJoint: JointInfo;
  endJoint: JointInfo;
  transform: TransformProperties;
  boxArgs: {
    width: number;
    height?: number;
    depth: number;
  };
  rigidBodyInfo: RAPIER.RigidBody | null;
  connectedImpulseJoints: AttachedRapierJoints;
  isTipBone: boolean;
}

type WristToMetacarpalBones =
  | "wrist--thumb-metacarpal"
  | "wrist--index-finger-metacarpal"
  | "wrist--middle-finger-metacarpal"
  | "wrist--ring-finger-metacarpal"
  | "wrist--pinky-finger-metacarpal";

type WristBones = Extract<HandBoneNames, WristToMetacarpalBones>;

type WristAttachedRapierJoints = Map<
  WristBones,
  React.RefObject<RAPIER.ImpulseJoint>
>;

export interface NewtonBoneProps {
  width: number;
  height?: number;
  depth: number;
}

export interface Wrist {
  name: "wrist";
  transform: JointProperties;
  rigidBodies: {
    trueWrist: React.RefObject<RapierRigidBody>;
    kinematicWrist: React.RefObject<RapierRigidBody>;
  };
  attachedRapierJoints: WristAttachedRapierJoints;
}

export interface RigidBodyBoneData {
  rigidBody: RAPIER.RigidBody;
  object3d?: THREE.Object3D;
  transform?: RapierTransformProperties;
}

export interface RapierTransformProperties {
  position: THREE.Vector3;
  orientation: THREE.Quaternion;
}

export interface JointData {
  dynamic: RigidBodyBoneData;
  kinematic: RigidBodyBoneData;
}

export interface BoneImpulseJoints {
  top: RAPIER.ImpulseJoint;
  bottom: RAPIER.ImpulseJoint;
  boneToBone?: RAPIER.ImpulseJoint;
}

type XRFingerJoints =
  | "thumb-phalanx-distal"
  | "thumb-tip"
  | "index-finger-phalanx-proximal"
  | "index-finger-phalanx-intermediate"
  | "index-finger-phalanx-distal"
  | "index-finger-tip"
  | "middle-finger-phalanx-proximal"
  | "middle-finger-phalanx-intermediate"
  | "middle-finger-phalanx-distal"
  | "middle-finger-tip"
  | "ring-finger-phalanx-proximal"
  | "ring-finger-phalanx-intermediate"
  | "ring-finger-phalanx-distal"
  | "ring-finger-tip"
  | "pinky-finger-phalanx-proximal"
  | "pinky-finger-phalanx-intermediate"
  | "pinky-finger-phalanx-distal"
  | "pinky-finger-tip";

type FingerJoints = Extract<XRHandJoint, XRFingerJoints>;

const fingerJointNames: FingerJoints[] = [
  "thumb-phalanx-distal",
  "thumb-tip",
  "index-finger-phalanx-proximal",
  "index-finger-phalanx-intermediate",
  "index-finger-phalanx-distal",
  "index-finger-tip",
  "middle-finger-phalanx-proximal",
  "middle-finger-phalanx-intermediate",
  "middle-finger-phalanx-distal",
  "middle-finger-tip",
  "ring-finger-phalanx-proximal",
  "ring-finger-phalanx-intermediate",
  "ring-finger-phalanx-distal",
  "ring-finger-tip",
  "pinky-finger-phalanx-proximal",
  "pinky-finger-phalanx-intermediate",
  "pinky-finger-phalanx-distal",
  "pinky-finger-tip",
];

export type FingerBoneNames =
  | "thumb-phalanx-proximal--thumb-phalanx-distal"
  | "thumb-phalanx-distal--thumb-tip"
  | "index-finger-phalanx-proximal--index-finger-phalanx-intermediate"
  | "index-finger-phalanx-intermediate--index-finger-phalanx-distal"
  | "index-finger-phalanx-distal--index-finger-tip"
  | "middle-finger-phalanx-proximal--middle-finger-phalanx-intermediate"
  | "middle-finger-phalanx-intermediate--middle-finger-phalanx-distal"
  | "middle-finger-phalanx-distal--middle-finger-tip"
  | "ring-finger-phalanx-proximal--ring-finger-phalanx-intermediate"
  | "ring-finger-phalanx-intermediate--ring-finger-phalanx-distal"
  | "ring-finger-phalanx-distal--ring-finger-tip"
  | "pinky-finger-phalanx-proximal--pinky-finger-phalanx-intermediate"
  | "pinky-finger-phalanx-intermediate--pinky-finger-phalanx-distal"
  | "pinky-finger-phalanx-distal--pinky-finger-tip";

export type FingerBoneNamesArr = [
  "thumb-phalanx-proximal--thumb-phalanx-distal",
  "thumb-phalanx-distal--thumb-tip",
  "index-finger-phalanx-proximal--index-finger-phalanx-intermediate",
  "index-finger-phalanx-intermediate--index-finger-phalanx-distal",
  "index-finger-phalanx-distal--index-finger-tip",
  "middle-finger-phalanx-proximal--middle-finger-phalanx-intermediate",
  "middle-finger-phalanx-intermediate--middle-finger-phalanx-distal",
  "middle-finger-phalanx-distal--middle-finger-tip",
  "ring-finger-phalanx-proximal--ring-finger-phalanx-intermediate",
  "ring-finger-phalanx-intermediate--ring-finger-phalanx-distal",
  "ring-finger-phalanx-distal--ring-finger-tip",
  "pinky-finger-phalanx-proximal--pinky-finger-phalanx-intermediate",
  "pinky-finger-phalanx-intermediate--pinky-finger-phalanx-distal",
  "pinky-finger-phalanx-distal--pinky-finger-tip",
];

const fingerBoneNamesArr: FingerBoneNames[] = [
  "thumb-phalanx-proximal--thumb-phalanx-distal",
  "thumb-phalanx-distal--thumb-tip",
  "index-finger-phalanx-proximal--index-finger-phalanx-intermediate",
  "index-finger-phalanx-intermediate--index-finger-phalanx-distal",
  "index-finger-phalanx-distal--index-finger-tip",
  "middle-finger-phalanx-proximal--middle-finger-phalanx-intermediate",
  "middle-finger-phalanx-intermediate--middle-finger-phalanx-distal",
  "middle-finger-phalanx-distal--middle-finger-tip",
  "ring-finger-phalanx-proximal--ring-finger-phalanx-intermediate",
  "ring-finger-phalanx-intermediate--ring-finger-phalanx-distal",
  "ring-finger-phalanx-distal--ring-finger-tip",
  "pinky-finger-phalanx-proximal--pinky-finger-phalanx-intermediate",
  "pinky-finger-phalanx-intermediate--pinky-finger-phalanx-distal",
  "pinky-finger-phalanx-distal--pinky-finger-tip",
];

/**
 * This is where all of the magic happens
 *
 * @todo link wrists to each other
 * @todo make sure bones do not seperate when in contact with other objects
 * @todo add hand sensors
 * @todo enable grabbing and releasing of objects
 * @todo add additional props to the hand, allowing for more customizabilty and control for the user
 */
export default class Newton {
  handedness: XRHandedness;
  intializedHand: boolean;
  visible: boolean;
  wrist: Wrist;

  handGroup: THREE.Group;
  boneProps: Map<HandBoneNames, NewtonBoneProps>;
  jointData: Map<XRHandJoint, JointData>;
  boneData: Map<HandBoneNames, BoneInfo>;
  impulseJoints: Map<HandBoneNames | XRHandJoint, RAPIER.ImpulseJoint>;
  // fingerImpulseJoints: Map<FingerBoneNames, RAPIER.RevoluteImpulseJoint>;
  rigidBodyStates: RigidBodyStateMap;
  colliderStates: ColliderStateMap;

  xrJoints: Map<XRHandJoint, JointInfo>;
  sensorJoints: Map<PalmSensorJointNames, PalmProperties> | undefined;
  palmSensor: RAPIER.Collider | null;
  rapierWorld: World;

  private updateCallback?: () => void;

  constructor({
    handedness,
    rapierWorld,
    withSensor = true,
    colliderStates,
    rigidBodyStates,
  }: TrueHandOptions) {
    this.rapierWorld = rapierWorld;
    this.handedness = handedness;
    this.visible = false;
    this.intializedHand = false;
    this.xrJoints = new Map<XRHandJoint, JointInfo>();

    this.wrist = {
      name: "wrist",
      transform: {
        position: new Vector3(),
        orientation: new Quaternion(),
      },
      rigidBodies: {
        trueWrist: React.createRef<RapierRigidBody>(),
        kinematicWrist: React.createRef<RapierRigidBody>(),
      },
      attachedRapierJoints: new Map() as WristAttachedRapierJoints,
    };

    this.palmSensor = null;
    this.handGroup = new THREE.Group();
    this.boneProps = new Map<HandBoneNames, NewtonBoneProps>();
    this.jointData = new Map<XRHandJoint, JointData>();
    this.boneData = new Map<HandBoneNames, BoneInfo>();
    this.impulseJoints = new Map<
      HandBoneNames | XRHandJoint,
      RAPIER.ImpulseJoint
    >();
    // this.boneImpulseJoints = new Map<HandBoneNames, BoneImpulseJoints>();
    this.rigidBodyStates = rigidBodyStates;
    this.colliderStates = colliderStates;
    // this.kinematicBones = new Map<HandBoneNames, BoneInfo>();
    // this.trueBones = new Map<HandBoneNames, BoneInfo>();

    this.sensorJoints = withSensor
      ? new Map<PalmSensorJointNames, PalmProperties>()
      : undefined;

    this.initHand();
  }

  readonly trueHandJointRadius = 0.001;

  setVisibility(visible: boolean) {
    this.visible = visible;
  }

  setInitializedHand(initialized: boolean) {
    this.intializedHand = initialized;
  }

  initHand() {
    if (this.intializedHand) {
      console.log("Hand already initialized");
      return;
    }

    boneNames.forEach((boneName) => {
      const [startJointName, endJointName] = boneName.split(
        "--",
      )! as XRHandJoint[];

      if (!startJointName || !endJointName) {
        throw new Error(`Invalid bone name: ${boneName}`);
      }

      const startJoint: JointInfo = {
        name: startJointName,
        transform: {
          position: new Vector3(),
          orientation: new Quaternion(),
        },
        attachedRapierJoints: {},
        isTipJoint: isTipJointName(startJointName),
      };

      if (isPalmJointName(startJointName) && this.sensorJoints) {
        this.sensorJoints.set(startJointName, {
          joint: startJoint,
          sensor: React.createRef<RapierCollider>(),
        });
      }

      const endJoint: JointInfo = {
        name: endJointName,
        transform: {
          position: new Vector3(),
          orientation: new Quaternion(),
        },
        attachedRapierJoints: {},
        isTipJoint: isTipJointName(endJointName),
      };

      const existingStartJointInfo = this.xrJoints.get(startJointName);
      const existingEndJointInfo = this.xrJoints.get(endJointName);
      // const existingStartJointInfo = this.xrJoints.get(startJointName);
      // const existingEndJointInfo = this.xrJoints.get(endJointName);

      !existingStartJointInfo && this.xrJoints.set(startJointName, startJoint);
      !existingEndJointInfo && this.xrJoints.set(endJointName, endJoint);

      this.boneProps.set(boneName, {
        width: 0.006,
        depth: 0.004,
      });
    });

    this.setInitializedHand(true);
    this.setVisibility(true);
  }

  updateHandOnFrame(
    hand: XRHand,
    frame: XRFrame,
    referenceSpace: XRReferenceSpace,
    options: UpdateBonesOnFrameOptions = {
      updateRapier: true,
      updateSensor: true,
      withNewFingers: true,
    },
  ) {
    if (!this.visible) {
      console.warn("updateHandOnFrame - Hand not visible");
      return;
    }
    if (!this.intializedHand) {
      console.warn("updateHandOnFrame - Hand not initialized, init now");
      this.initHand();
      return;
    }

    for (const jointSpace of hand.values()) {
      const xrJoint = this.xrJoints.get(jointSpace.jointName);

      if (!xrJoint) {
        // console.log(
        //   `Joint ${jointSpace.jointName} not found in this.xrJoints, setting now`,
        // );
        const newJoint: JointInfo = {
          name: jointSpace.jointName,
          transform: {
            position: new Vector3(),
            orientation: new Quaternion(),
          },
          attachedRapierJoints: {},
          isTipJoint: isTipJointName(jointSpace.jointName),
        };

        this.xrJoints.set(jointSpace.jointName, newJoint);
        continue;
      }

      const startJointPose = frame.getJointPose?.(jointSpace, referenceSpace);

      if (!startJointPose) {
        console.warn(
          `Joint pose for ${jointSpace.jointName} not found in frame.getJointPose`,
        );
        continue;
      }

      this.updateTransformProperties(
        jointSpace.jointName,
        startJointPose.transform.position,
        startJointPose.transform.orientation,
      );
    }

    if (this.boneData.size === 0) {
      console.log("updateHandOnFrame - Creating bones now");
      this.setBoneHeights();
      this.buildHand();

      // this.testBuildHand();
      // this.testLinkBones();

      // this.configureFingers();
      this.linkHands();

      this.linkBones();
      // this.createPalmSensor();
      this.notifyUpdate();
    }

    if (options.updateRapier) {
      this.updateHands(options.withNewFingers ?? false);
    }

    if (options.updateSensor) {
      // this.updateSensor();
    }

    // this.notifyUpdate();
  }

  private setBoneHeights() {
    boneNames.forEach((boneName) => {
      const boneProps = this.boneProps.get(boneName);

      if (!boneProps) {
        console.warn(`buildHand: Bone ${boneName} not found in this.boneProps`);
        return;
      }

      const [startJointName, endJointName] = boneName.split(
        "--",
      ) as XRHandJoint[];

      if (!startJointName || !endJointName) {
        throw new Error(`Invalid bone name: ${boneName}`);
      }

      const bottomJoint = this.xrJoints.get(startJointName);
      const topJoint = this.xrJoints.get(endJointName);

      if (!bottomJoint || !topJoint) {
        console.warn(
          `buildHand: Dynamic joints ${startJointName} and ${endJointName} not found for bone ${boneName}`,
        );
        return;
      }

      const bottomJointTranslation = bottomJoint.transform.position;
      const topJointTranslation = topJoint.transform.position;

      const height = this.calculateHeightForBone(
        bottomJointTranslation,
        topJointTranslation,
      );

      boneProps.height = height;
    });
  }

  /**
   * Link the wrists together via a spring and cartesian joint
   * - the problem is cartesian joints are not yet supported in rapier, so we will have to make it with a generic joint. That makes it so we will not have access to motor.
   * - another temp solution is to connect the wrists via a revolute joint as well as a spring joint
   *    - the revolute joint would give the TrueHand the ability to rotate around the wrist, meaning that the TrueHand can naturally react to objects below/above it. This would also allow us to put constraints and limits on the rotation of the TrueHand
   *
   * Link finger joints to each other via cartesian joints as well
   * - allows for the orientation of the joints on the TrueHand to always be the same as the XRHand
   *
   *
   */
  private linkHands() {
    // Linking Wrists
    const wrist = this.jointData.get("wrist");

    if (!wrist) {
      console.warn("linkHands: Wrist not found in this.jointData");
      return;
    }

    const { dynamic, kinematic } = wrist;

    const wristDynamicRb = dynamic.rigidBody;
    const wristKinematicRb = kinematic.rigidBody;

    console.log("wristDynamicRb.translation()", wristDynamicRb.translation());
    console.log(
      "wristKinematicRb.translation()",
      wristKinematicRb.translation(),
    );

    const dynamicWristPositon = wrist.dynamic.transform?.position;
    const kinematicWristPosition = wrist.kinematic.transform?.position;

    if (!kinematicWristPosition || !dynamicWristPositon) {
      console.warn("linkHands: Wrist position not found");
      return;
    }

    console.log("dynamicWristPositon", dynamicWristPositon);
    console.log("kinematicWristPosition", kinematicWristPosition);

    /**
     * Connecting the TrueHand's Fixed Hand Bones to the wrist via fixed joints
     * - must be done after init and bones are created
     *
     */
    boneNames.forEach((boneName) => {
      const bone = this.boneData.get(boneName);

      if (!bone) {
        console.warn(
          `linkHands: Bone ${boneName} not found in this.boneData inside fixedHandJoints.forEach`,
        );
        return;
      }

      const dynamicBone = bone.dynamic;

      const dynamicBoneRb = dynamicBone.rigidBody;

      const bonePosition = bone.dynamic.transform?.position;
      const wristPosition = wrist.dynamic.transform?.position;

      console.log("bonePosition", bonePosition);
      console.log("wristPosition", wristPosition);

      if (!bonePosition || !wristPosition) {
        console.warn(
          `linkHands: Bone ${boneName} or Wrist position not found in this.boneData inside fixedHandJoints.forEach`,
        );
        return;
      }

      const fixedJointDesc = RAPIER.JointData.fixed(
        ORIGIN,
        {
          x: 0,
          y: 0,
          z: 0,
          w: 1,
        },
        ORIGIN,
        {
          x: 0,
          y: 0,
          z: 0,
          w: 1,
        },
      );

      const fixedJoint = this.rapierWorld.createImpulseJoint(
        fixedJointDesc,
        wristDynamicRb,
        dynamicBoneRb,
        true,
      );

      console.log("fixedJoint", fixedJoint);
    });

    const cartesianAxisMask =
      RAPIER.JointAxesMask.AngX |
      RAPIER.JointAxesMask.AngY |
      RAPIER.JointAxesMask.AngZ;

    const FixedAxisMask =
      RAPIER.JointAxesMask.AngX |
      RAPIER.JointAxesMask.AngY |
      RAPIER.JointAxesMask.AngZ |
      RAPIER.JointAxesMask.X |
      RAPIER.JointAxesMask.Y |
      RAPIER.JointAxesMask.Z;

    /**
     * Connecting the TrueHand's Finger Joints to the
     * KinematicHand's finger joints via cartesian joints
     * - locked orientation, but free to move
     * - allows the TrueHand Finger Joints to always be in the same
     * orientation as the XRHand
     */
    jointNames.forEach((jointName) => {
      const joint = this.jointData.get(jointName);

      if (!joint) {
        console.warn(
          `linkHands: Joint ${jointName} not found in this.jointData`,
        );
        return;
      }

      const { dynamic, kinematic } = joint;

      const dynamicRb = dynamic.rigidBody;
      const kinematicRb = kinematic.rigidBody;

      const cartesianJointDesc = RAPIER.JointData.generic(
        ORIGIN,
        ORIGIN,
        AXIS_VECTORS.x,
        cartesianAxisMask,
        // FixedAxisMask,
      );

      const cartesianJoint = this.rapierWorld.createImpulseJoint(
        cartesianJointDesc,
        kinematicRb,
        dynamicRb,
        true,
      );

      this.impulseJoints.set(jointName, cartesianJoint);
    });
  }

  private testLinkHands() {
    // Linking Wrists
    const wrist = this.jointData.get("wrist");

    if (!wrist) {
      console.warn("linkHands: Wrist not found in this.jointData");
      return;
    }

    const { dynamic, kinematic } = wrist;

    const wristDynamicRb = dynamic.rigidBody;
    const wristKinematicRb = kinematic.rigidBody;

    console.log("wristDynamicRb.translation()", wristDynamicRb.translation());
    console.log(
      "wristKinematicRb.translation()",
      wristKinematicRb.translation(),
    );

    const dynamicWristPositon = wrist.dynamic.transform?.position;
    const kinematicWristPosition = wrist.kinematic.transform?.position;

    if (!kinematicWristPosition || !dynamicWristPositon) {
      console.warn("linkHands: Wrist position not found");
      return;
    }

    console.log("dynamicWristPositon", dynamicWristPositon);
    console.log("kinematicWristPosition", kinematicWristPosition);

    /**
     * Connecting the TrueHand's Fixed Hand Bones to the wrist via fixed joints
     * - must be done after init and bones are created
     *
     */
    fixedHandBones.forEach((boneName) => {
      const bone = this.boneData.get(boneName);

      if (!bone) {
        console.warn(
          `linkHands: Bone ${boneName} not found in this.boneData inside fixedHandJoints.forEach`,
        );
        return;
      }

      const dynamicBone = bone.dynamic;

      const dynamicBoneRb = dynamicBone.rigidBody;

      const bonePosition = bone.dynamic.transform?.position;
      const wristPosition = wrist.dynamic.transform?.position;

      console.log("bonePosition", bonePosition);
      console.log("wristPosition", wristPosition);

      if (!bonePosition || !wristPosition) {
        console.warn(
          `linkHands: Bone ${boneName} or Wrist position not found in this.boneData inside fixedHandJoints.forEach`,
        );
        return;
      }

      const fixedJointDesc = RAPIER.JointData.fixed(
        ORIGIN,
        {
          x: 0,
          y: 0,
          z: 0,
          w: 1,
        },
        ORIGIN,
        {
          x: 0,
          y: 0,
          z: 0,
          w: 1,
        },
      );

      const fixedJoint = this.rapierWorld.createImpulseJoint(
        fixedJointDesc,
        wristDynamicRb,
        dynamicBoneRb,
        true,
      );

      console.log("fixedJoint", fixedJoint);
    });

    const cartesianAxisMask =
      RAPIER.JointAxesMask.AngX |
      RAPIER.JointAxesMask.AngY |
      RAPIER.JointAxesMask.AngZ;

    const FixedAxisMask =
      RAPIER.JointAxesMask.AngX |
      RAPIER.JointAxesMask.AngY |
      RAPIER.JointAxesMask.AngZ |
      RAPIER.JointAxesMask.X |
      RAPIER.JointAxesMask.Y |
      RAPIER.JointAxesMask.Z;

    /**
     * Connecting the TrueHand's Finger Joints to the
     * KinematicHand's finger joints via cartesian joints
     * - locked orientation, but free to move
     * - allows the TrueHand Finger Joints to always be in the same
     * orientation as the XRHand
     */
    fingerJointNames.forEach((jointName) => {
      const joint = this.jointData.get(jointName);

      if (!joint) {
        console.warn(
          `linkHands: Joint ${jointName} not found in this.jointData`,
        );
        return;
      }

      const { dynamic, kinematic } = joint;

      const dynamicRb = dynamic.rigidBody;
      const kinematicRb = kinematic.rigidBody;

      const cartesianJointDesc = RAPIER.JointData.generic(
        ORIGIN,
        ORIGIN,
        AXIS_VECTORS.x,
        cartesianAxisMask,
        // FixedAxisMask,
      );

      const cartesianJoint = this.rapierWorld.createImpulseJoint(
        cartesianJointDesc,
        kinematicRb,
        dynamicRb,
        true,
      );

      this.impulseJoints.set(jointName, cartesianJoint);
    });
  }

  /**
   * The finger joints are the proximal, intermediate, and distal joints of the fingers
   * Starting at the proximal joint, the proximal-intermediate bone will be connected to the bottom joint via a revolute joint (or a spherical joint if we can apply a motor to it). Their will be limits to the angle at which to bone can rotate. How the bone rotates will be determined by the orientation of the proximal joint (which is the XRHand joint due to it being connected via a cartesian joint). The bone will be connected to the joint above it (in this example, the intermediate joint) via a revolute joint (or fixed joint?) as well. The intermediate joint's translation will always be determined by the proxmial-intermediate bone's translation, which is determined by the proximal joint's orientation (its position is connected via a fixed joint to the TrueHand Wrist joint).
   *
   * The finger joints and bones will be connected in the following way.
   * - Bottom Joint to Bone: Revolute joint
   */
  private configureFingers() {
    fingerBoneNamesArr.forEach((boneName) => {
      const bone = this.boneData.get(boneName);

      if (!bone) {
        console.warn(
          `createFingerBones: Bone ${boneName} not found in this.boneName`,
        );
        return;
      }

      const boneHeight = bone.dynamic.three.args.height;

      if (!boneHeight) {
        console.warn(
          `createFingerBones: Bone height not found for bone ${boneName}`,
        );
        return;
      }

      const boneRb = bone.dynamic.rigidBody;
      // const bottomJointRb = bottomJoint.dynamic.rigidBody;
      // const topJointRb = topJoint.dynamic.rigidBody;
      const bottomJointRb = bone.dynamic.bottomRbJoint;
      const topJointRb = bone.dynamic.topRbJoint;

      const bottomRevoluteJointDesc = RAPIER.JointData.revolute(
        {
          x: 0,
          y: this.trueHandJointRadius,
          z: 0,
        },
        {
          x: 0,
          y: -boneHeight / 2,
          z: 0,
        },
        AXIS_VECTORS.x,
      );

      const bottomRevoluteJoint_Impulse = this.rapierWorld.createImpulseJoint(
        bottomRevoluteJointDesc,
        bottomJointRb,
        boneRb,
        true,
      );

      const bottomRevoluteJoint =
        bottomRevoluteJoint_Impulse as RAPIER.RevoluteImpulseJoint;

      bottomRevoluteJoint.configureMotorPosition(0, 1.0e2, 150);

      bottomRevoluteJoint.setLimits(0, Math.PI / 4);

      // const sphericalJointDesc = RAPIER.JointData.spherical(
      //   {
      //     x: 0,
      //     y: boneHeight / 2,
      //     z: 0,
      //   },
      //   {
      //     x: 0,
      //     y: -this.trueHandJointRadius,
      //     z: 0,
      //   },
      // );

      // const sphericalJoint_Impulse = this.rapierWorld.createImpulseJoint(
      //   sphericalJointDesc,
      //   boneRb,
      //   topJointRb,
      //   true,
      // );

      // const sphericalJoint =
      //   sphericalJoint_Impulse as RAPIER.RevoluteImpulseJoint;

      // sphericalJoint.setLimits(0, 0);
    });
  }

  /**
   * The architecture of the hand will be the following:
   * Rigid Bodies:
   * 1. KinematicPositions RBs for the joints
   * 2. Dynamic RBs for the joints
   * 3. Dynamic RBs for the bones
   *
   * Joints:
   * 1. Impulsive joints connecting the kinematic and dynamic joint RBs
   * 2. Impulsive joints connecting the dynamic joints and bone RBs
   *
   */
  private buildHand() {
    const oQuat1 = new Quaternion(0, 0, 0);

    const originVector = new Vector3(0, 0, 0);

    jointNames.forEach((jointName) => {
      const xrJoint = this.xrJoints.get(jointName);

      if (!xrJoint) {
        console.warn(
          `buildHand: Joint ${jointName} not found in this.xrJoints`,
        );
        return;
      }

      const { position, orientation } = xrJoint.transform;

      console.log("jointName: ", jointName);

      const kinematicJointDesc = RAPIER.RigidBodyDesc.kinematicPositionBased()
        .setCanSleep(false)
        .setUserData({
          name: jointName,
          type: "kinematic",
        })
        .setTranslation(position.x, position.y, position.z)
        .setRotation(orientation);

      const kinematicJointRb =
        this.rapierWorld.createRigidBody(kinematicJointDesc);

      const kinematicJointColliderDesc = RAPIER.ColliderDesc.ball(
        this.trueHandJointRadius,
      ).setCollisionGroups(interactionGroups([], []));

      const kinematicCollider = this.rapierWorld.createCollider(
        kinematicJointColliderDesc,
        kinematicJointRb,
      );

      const dynamicJointDesc = RAPIER.RigidBodyDesc.dynamic()
        .setCanSleep(false)
        .setUserData({
          name: jointName,
          type: "dynamic",
        })
        .setGravityScale(0)
        .setTranslation(position.x, position.y, position.z)
        .setRotation(orientation);

      const dynamicJointRb = this.rapierWorld.createRigidBody(dynamicJointDesc);

      const dynamicColliderDesc = RAPIER.ColliderDesc.ball(
        this.trueHandJointRadius,
      ).setCollisionGroups(interactionGroups([], []));

      const dynamicCollider = this.rapierWorld.createCollider(
        dynamicColliderDesc,
        dynamicJointRb,
      );

      const springJointDesc = RAPIER.JointData.spring(
        0,
        1.0e3,
        250,
        // originVector,
        // kinematicJointRb.translation(),
        originVector,
        originVector,
      );

      const springJoint = this.rapierWorld.createImpulseJoint(
        springJointDesc,
        kinematicJointRb,
        dynamicJointRb,
        true,
      );

      const AxesMask =
        RAPIER.JointAxesMask.AngX |
        RAPIER.JointAxesMask.AngY |
        RAPIER.JointAxesMask.AngZ |
        RAPIER.JointAxesMask.X |
        RAPIER.JointAxesMask.Y |
        RAPIER.JointAxesMask.Z;

      const genericJointParams = RAPIER.JointData.generic(
        {
          x: 0,
          y: 0,
          z: 0,
        },
        {
          x: 0,
          y: 0,
          z: 0,
        },
        {
          x: 1,
          y: 0,
          z: 0,
        },
        AxesMask,
      );

      this.rapierWorld.createImpulseJoint(
        genericJointParams,
        kinematicJointRb,
        dynamicJointRb,
        true,
      );

      // const fixedJointDesc = RAPIER.JointData.fixed(
      //   new RAPIER.Vector3(0, 0, 0),
      //   new RAPIER.Quaternion(0.0, 0.0, 0.0, 1.0),
      //   // kinematicJointRb.translation(),
      //   new RAPIER.Vector3(0, 0, 0),
      //   new RAPIER.Quaternion(0.0, 0.0, 0.0, 1.0),
      // );

      // const fixedImpulseJoint = this.rapierWorld.createImpulseJoint(
      //   fixedJointDesc,
      //   kinematicJointRb,
      //   dynamicJointRb,
      //   true,
      // );

      const dynamicMaterial = new THREE.MeshBasicMaterial({
        color: 0xff0000, // red
      });

      const dynamicGeometry = new THREE.SphereGeometry(
        this.trueHandJointRadius,
      );

      const dynamicObject3d = new THREE.Mesh(dynamicGeometry, dynamicMaterial);
      dynamicObject3d.position.set(position.x, position.y, position.z);
      dynamicObject3d.quaternion.set(
        orientation.x,
        orientation.y,
        orientation.z,
        orientation.w,
      );

      const kinematicMaterial = new THREE.MeshBasicMaterial({
        color: 0x00ff00, // green
      });

      const kinematicGeometry = new THREE.SphereGeometry(
        this.trueHandJointRadius,
      );

      const kinematicObject3d = new THREE.Mesh(
        kinematicGeometry,
        kinematicMaterial,
      );
      kinematicObject3d.position.set(position.x, position.y, position.z);
      kinematicObject3d.quaternion.set(
        orientation.x,
        orientation.y,
        orientation.z,
        orientation.w,
      );

      // will make dynamic in the future
      kinematicObject3d.visible = false;
      dynamicObject3d.visible = false;

      this.addToColliderState(dynamicCollider, dynamicObject3d);
      // this.addToColliderState(kinematicCollider, kinematicObject3d);

      this.jointData.set(jointName, {
        dynamic: {
          object3d: dynamicObject3d,
          rigidBody: dynamicJointRb,
          transform: xrJoint.transform,
        },
        kinematic: {
          object3d: kinematicObject3d,
          rigidBody: kinematicJointRb,
          transform: xrJoint.transform,
        },
      });
      // this.jointData.set(jointName, dynamicJointRb);
      this.impulseJoints.set(jointName, springJoint);

      this.handGroup.add(dynamicObject3d);
      this.handGroup.add(kinematicObject3d);

      this.addToRigidBodyState(dynamicJointRb, dynamicObject3d);
      this.addToRigidBodyState(kinematicJointRb, kinematicObject3d);
    });

    boneNames.forEach((boneName) => {
      console.log("boneName: ", boneName);

      const boneProps = this.boneProps.get(boneName);

      if (!boneProps) {
        console.warn(`buildHand: Bone ${boneName} not found in this.boneProps`);
        return;
      }

      const [startJointName, endJointName] = boneName.split(
        "--",
      ) as XRHandJoint[];

      if (!startJointName || !endJointName) {
        throw new Error(`Invalid bone name: ${boneName}`);
      }

      const bottomJointData = this.jointData.get(startJointName);
      const topJointData = this.jointData.get(endJointName);

      if (!bottomJointData || !topJointData) {
        console.warn(
          `buildHand: Dynamic joints ${startJointName} and ${endJointName} not found for bone ${boneName}`,
        );
        return;
      }

      const xrBottomJoint = this.xrJoints.get(startJointName);
      const xrTopJoint = this.xrJoints.get(endJointName);

      if (!xrBottomJoint || !xrTopJoint) {
        console.warn(
          `buildHand: XR joints ${startJointName} and ${endJointName} not found in xrJoints`,
        );
        return;
      }

      const bottomDynamicJoint = bottomJointData.dynamic.rigidBody;
      const topDynamicJoint = topJointData.dynamic.rigidBody;

      const bottomJointTranslation = bottomDynamicJoint.translation();
      const topJointTranslation = topDynamicJoint.translation();

      const bottomJointOrientation = bottomDynamicJoint.rotation();

      oQuat1
        .set(
          bottomJointOrientation.x,
          bottomJointOrientation.y,
          bottomJointOrientation.z,
          bottomJointOrientation.w,
        )
        .multiply(BONE_ROTATION_QUATERNION);

      const bonePosition = {
        x:
          bottomJointTranslation.x +
          (topJointTranslation.x - bottomJointTranslation.x) / 2,
        y:
          bottomJointTranslation.y +
          (topJointTranslation.y - bottomJointTranslation.y) / 2,
        z:
          bottomJointTranslation.z +
          (topJointTranslation.z - bottomJointTranslation.z) / 2,
      };

      const kinematicBoneDesc = RAPIER.RigidBodyDesc.kinematicPositionBased()
        .setCanSleep(false)
        .setUserData({
          name: boneName,
          type: "kinematic",
        })
        .setTranslation(bonePosition.x, bonePosition.y, bonePosition.z)
        .setRotation(oQuat1);

      const kinematicBoneRb =
        this.rapierWorld.createRigidBody(kinematicBoneDesc);

      // const kinematicBoneColliderDesc = RAPIER.ColliderDesc.cylinder(
      //   boneProps.height ? boneProps.height / 2 : 0.03,
      //   boneProps.width,
      // ).setCollisionGroups(interactionGroups([], []));

      // const kinematicBoneCollider = this.rapierWorld.createCollider(
      //   kinematicBoneColliderDesc,
      //   kinematicBoneRb,
      // );

      // this.add

      const dynamicBoneDesc = RAPIER.RigidBodyDesc.dynamic()
        .setGravityScale(0)
        .setCanSleep(false)
        .setUserData({
          name: boneName,
          type: "dynamic",
        })
        .setTranslation(bonePosition.x, bonePosition.y, bonePosition.z)
        .setRotation(oQuat1);

      const dynamicBoneRb = this.rapierWorld.createRigidBody(dynamicBoneDesc);

      const friction = boneName.includes("tip") ? 5 : 2;

      const boneColliderDesc = RAPIER.ColliderDesc.cylinder(
        boneProps.height ? boneProps.height / 2 : 0.03,
        boneProps.width,
      )
        .setDensity(5)
        .setFriction(friction)
        .setRestitution(0)
        .setCollisionGroups(interactionGroups([0], [7, 8]));

      const boneCollider = this.rapierWorld.createCollider(
        boneColliderDesc,
        dynamicBoneRb,
      );

      const springJointDesc = RAPIER.JointData.spring(
        0,
        1.0e4,
        122,
        ORIGIN,
        ORIGIN,
      );

      const springJoint = this.rapierWorld.createImpulseJoint(
        springJointDesc,
        kinematicBoneRb,
        dynamicBoneRb,
        true,
      );

      const AxesMask =
        RAPIER.JointAxesMask.AngX |
        RAPIER.JointAxesMask.AngY |
        RAPIER.JointAxesMask.AngZ |
        RAPIER.JointAxesMask.X |
        RAPIER.JointAxesMask.Y |
        RAPIER.JointAxesMask.Z;

      const genericJointParams = RAPIER.JointData.generic(
        {
          x: 0,
          y: 0,
          z: 0,
        },
        {
          x: 0,
          y: 0,
          z: 0,
        },
        {
          x: 1,
          y: 0,
          z: 0,
        },
        AxesMask,
      );

      const genericImpulseJoint = this.rapierWorld.createImpulseJoint(
        genericJointParams,
        kinematicBoneRb,
        dynamicBoneRb,
        true,
      );

      const material = new THREE.MeshBasicMaterial({
        color: 0xffffff, // white
        opacity: 0.5,
        transparent: true,
      });

      const geometry = new THREE.CylinderGeometry(
        boneProps.width,
        boneProps.width,
        boneProps.height ? boneProps.height : 0.03,
      );

      const object3d = new THREE.Mesh(geometry, material);

      object3d.position.set(bonePosition.x, bonePosition.y, bonePosition.z);
      object3d.quaternion.set(oQuat1.x, oQuat1.y, oQuat1.z, oQuat1.w);

      this.addToRigidBodyState(dynamicBoneRb, object3d);
      this.addToRigidBodyState(kinematicBoneRb, object3d);
      this.addToColliderState(boneCollider, object3d);
      // this.addToColliderState(kinematicBoneCollider, object3d);

      object3d.visible = false;

      this.handGroup.add(object3d);

      this.boneData.set(boneName, {
        isTipBone: boneName.includes("tip"),
        joints: {
          top: xrTopJoint,
          bottom: xrBottomJoint,
        },
        dynamic: {
          rigidBody: dynamicBoneRb,
          bottomRbJoint: bottomJointData.dynamic.rigidBody,
          topRbJoint: topJointData.dynamic.rigidBody,
          transform: {
            position: new Vector3(
              bonePosition.x,
              bonePosition.y,
              bonePosition.z,
            ),
            orientation: oQuat1.clone(),
          },
          connectedImpulseJoints: {
            spring: springJoint,
            generic: genericImpulseJoint,
          },
          three: {
            bone: object3d,
            type: "cylinder",
            args: {
              width: boneProps.width,
              height: boneProps.height ? boneProps.height : 0.03,
              depth: boneProps.width,
            },
          },
        },
        kinematic: {
          rigidBody: kinematicBoneRb,
          bottomRbJoint: bottomJointData.kinematic.rigidBody,
          topRbJoint: topJointData.kinematic.rigidBody,
          transform: {
            position: new Vector3(
              bonePosition.x,
              bonePosition.y,
              bonePosition.z,
            ),
            orientation: oQuat1,
          },
          connectedImpulseJoints: {},
          three: {
            bone: object3d,
            type: "cylinder",
            args: {
              width: boneProps.width,
              height: boneProps.height ? boneProps.height : 0.03,
              depth: boneProps.width,
            },
          },
        },
      });

      console.log("this.handGroup: ", this.handGroup);
    });
  }

  private testBuildHand() {
    const oQuat1 = new Quaternion(0, 0, 0);

    const originVector = new Vector3(0, 0, 0);

    jointNames.forEach((jointName) => {
      const xrJoint = this.xrJoints.get(jointName);

      if (!xrJoint) {
        console.warn(
          `buildHand: Joint ${jointName} not found in this.xrJoints`,
        );
        return;
      }

      const { position, orientation } = xrJoint.transform;

      console.log("jointName: ", jointName);

      const kinematicJointDesc = RAPIER.RigidBodyDesc.kinematicPositionBased()
        .setCanSleep(false)
        .setUserData({
          name: jointName,
          type: "kinematic",
        })
        .setTranslation(position.x, position.y, position.z)
        .setRotation(orientation);

      const kinematicJointRb =
        this.rapierWorld.createRigidBody(kinematicJointDesc);

      // const kinematicJointColliderDesc = RAPIER.ColliderDesc.ball(
      //   this.trueHandJointRadius,
      // ).setCollisionGroups(interactionGroups([], []));

      // const kinematicCollider = this.rapierWorld.createCollider(
      //   kinematicJointColliderDesc,
      //   kinematicJointRb,
      // );

      const dynamicJointDesc = RAPIER.RigidBodyDesc.dynamic()
        .setCanSleep(false)
        .setUserData({
          name: jointName,
          type: "dynamic",
        })
        .setGravityScale(0)
        .setTranslation(position.x, position.y, position.z)
        .setRotation(orientation);

      const dynamicJointRb = this.rapierWorld.createRigidBody(dynamicJointDesc);

      const dynamicColliderDesc = RAPIER.ColliderDesc.ball(
        this.trueHandJointRadius,
      ).setCollisionGroups(interactionGroups([], []));

      const dynamicCollider = this.rapierWorld.createCollider(
        dynamicColliderDesc,
        dynamicJointRb,
      );

      let springJoint: RAPIER.ImpulseJoint | undefined;

      if (!isFingerJointName(jointName)) {
        const springJointDesc = RAPIER.JointData.spring(
          0,
          1.0e4,
          122,
          ORIGIN,
          ORIGIN,
        );

        springJoint = this.rapierWorld.createImpulseJoint(
          springJointDesc,
          kinematicJointRb,
          dynamicJointRb,
          true,
        );
      }

      let axesMask: RAPIER.JointAxesMask;

      if (isFingerJointName(jointName)) {
        axesMask =
          RAPIER.JointAxesMask.AngX |
          RAPIER.JointAxesMask.AngY |
          RAPIER.JointAxesMask.AngZ;
        // axesMask =
        //   RAPIER.JointAxesMask.AngX |
        //   RAPIER.JointAxesMask.AngY |
        //   RAPIER.JointAxesMask.AngZ |
        //   RAPIER.JointAxesMask.X |
        //   RAPIER.JointAxesMask.Y |
        //   RAPIER.JointAxesMask.Z;
      } else {
        axesMask =
          RAPIER.JointAxesMask.AngX |
          RAPIER.JointAxesMask.AngY |
          RAPIER.JointAxesMask.AngZ |
          RAPIER.JointAxesMask.X |
          RAPIER.JointAxesMask.Y |
          RAPIER.JointAxesMask.Z;
      }

      const genericJointParams = RAPIER.JointData.generic(
        {
          x: 0,
          y: 0,
          z: 0,
        },
        {
          x: 0,
          y: 0,
          z: 0,
        },
        {
          x: 1,
          y: 0,
          z: 0,
        },
        axesMask,
      );

      this.rapierWorld.createImpulseJoint(
        genericJointParams,
        kinematicJointRb,
        dynamicJointRb,
        true,
      );

      // const genericJointParams = RAPIER.JointData.generic(
      //   {
      //     x: 0,
      //     y: 0,
      //     z: 0,
      //   },
      //   {
      //     x: 0,
      //     y: 0,
      //     z: 0,
      //   },
      //   {
      //     x: 1,
      //     y: 0,
      //     z: 0,
      //   },
      //   axesMask,
      // );

      // this.rapierWorld.createImpulseJoint(
      //   genericJointParams,
      //   kinematicJointRb,
      //   dynamicJointRb,
      //   true,
      // );

      const dynamicMaterial = new THREE.MeshBasicMaterial({
        color: 0xff0000, // red
      });

      const dynamicGeometry = new THREE.SphereGeometry(
        this.trueHandJointRadius,
      );

      const dynamicObject3d = new THREE.Mesh(dynamicGeometry, dynamicMaterial);
      dynamicObject3d.position.set(position.x, position.y, position.z);
      dynamicObject3d.quaternion.set(
        orientation.x,
        orientation.y,
        orientation.z,
        orientation.w,
      );

      const kinematicMaterial = new THREE.MeshBasicMaterial({
        color: 0x00ff00, // green
      });

      const kinematicGeometry = new THREE.SphereGeometry(
        this.trueHandJointRadius,
      );

      const kinematicObject3d = new THREE.Mesh(
        kinematicGeometry,
        kinematicMaterial,
      );
      kinematicObject3d.position.set(position.x, position.y, position.z);
      kinematicObject3d.quaternion.set(
        orientation.x,
        orientation.y,
        orientation.z,
        orientation.w,
      );

      // will make dynamic in the future
      kinematicObject3d.visible = false;
      dynamicObject3d.visible = false;

      this.addToColliderState(dynamicCollider, dynamicObject3d);
      // this.addToColliderState(kinematicCollider, kinematicObject3d);

      this.jointData.set(jointName, {
        dynamic: {
          object3d: dynamicObject3d,
          rigidBody: dynamicJointRb,
          transform: xrJoint.transform,
        },
        kinematic: {
          object3d: kinematicObject3d,
          rigidBody: kinematicJointRb,
          transform: xrJoint.transform,
        },
      });
      // this.jointData.set(jointName, dynamicJointRb);
      springJoint && this.impulseJoints.set(jointName, springJoint);

      this.handGroup.add(dynamicObject3d);
      this.handGroup.add(kinematicObject3d);

      this.addToRigidBodyState(dynamicJointRb, dynamicObject3d);
      this.addToRigidBodyState(kinematicJointRb, kinematicObject3d);
    });

    boneNames.forEach((boneName) => {
      console.log("boneName: ", boneName);

      const boneProps = this.boneProps.get(boneName);

      if (!boneProps) {
        console.warn(`buildHand: Bone ${boneName} not found in this.boneProps`);
        return;
      }

      const [startJointName, endJointName] = boneName.split(
        "--",
      ) as XRHandJoint[];

      if (!startJointName || !endJointName) {
        throw new Error(`Invalid bone name: ${boneName}`);
      }

      const bottomJointData = this.jointData.get(startJointName);
      const topJointData = this.jointData.get(endJointName);

      if (!bottomJointData || !topJointData) {
        console.warn(
          `buildHand: Dynamic joints ${startJointName} and ${endJointName} not found for bone ${boneName}`,
        );
        return;
      }

      const xrBottomJoint = this.xrJoints.get(startJointName);
      const xrTopJoint = this.xrJoints.get(endJointName);

      if (!xrBottomJoint || !xrTopJoint) {
        console.warn(
          `buildHand: XR joints ${startJointName} and ${endJointName} not found in xrJoints`,
        );
        return;
      }

      const bottomDynamicJoint = bottomJointData.dynamic.rigidBody;
      const topDynamicJoint = topJointData.dynamic.rigidBody;

      const bottomJointTranslation = bottomDynamicJoint.translation();
      const topJointTranslation = topDynamicJoint.translation();

      const bottomJointOrientation = bottomDynamicJoint.rotation();

      oQuat1
        .set(
          bottomJointOrientation.x,
          bottomJointOrientation.y,
          bottomJointOrientation.z,
          bottomJointOrientation.w,
        )
        .multiply(BONE_ROTATION_QUATERNION);

      const bonePosition = {
        x:
          bottomJointTranslation.x +
          (topJointTranslation.x - bottomJointTranslation.x) / 2,
        y:
          bottomJointTranslation.y +
          (topJointTranslation.y - bottomJointTranslation.y) / 2,
        z:
          bottomJointTranslation.z +
          (topJointTranslation.z - bottomJointTranslation.z) / 2,
      };

      const kinematicBoneDesc = RAPIER.RigidBodyDesc.kinematicPositionBased()
        .setCanSleep(false)
        .setUserData({
          name: boneName,
          type: "kinematic",
        })
        .setTranslation(bonePosition.x, bonePosition.y, bonePosition.z)
        .setRotation(oQuat1);

      const kinematicBoneRb =
        this.rapierWorld.createRigidBody(kinematicBoneDesc);

      const kinematicBoneColliderDesc = RAPIER.ColliderDesc.cylinder(
        boneProps.height ? boneProps.height / 2 : 0.03,
        boneProps.width,
      ).setCollisionGroups(interactionGroups([], []));

      const kinematicBoneCollider = this.rapierWorld.createCollider(
        kinematicBoneColliderDesc,
        kinematicBoneRb,
      );

      // this.add

      const dynamicBoneDesc = RAPIER.RigidBodyDesc.dynamic()
        .setGravityScale(0)
        .setCanSleep(false)
        .setUserData({
          name: boneName,
          type: "dynamic",
        })
        .setTranslation(bonePosition.x, bonePosition.y, bonePosition.z)
        .setRotation(oQuat1);

      const dynamicBoneRb = this.rapierWorld.createRigidBody(dynamicBoneDesc);

      const friction = boneName.includes("tip") ? 5 : 2;

      const boneColliderDesc = RAPIER.ColliderDesc.capsule(
        boneProps.height ? boneProps.height / 2 : 0.03,
        boneProps.width,
      )
        .setDensity(50)
        .setFriction(friction)
        .setRestitution(0)
        .setCollisionGroups(interactionGroups([0], [7, 8]));

      const boneCollider = this.rapierWorld.createCollider(
        boneColliderDesc,
        dynamicBoneRb,
      );

      let springJoint: RAPIER.ImpulseJoint | undefined;

      if (!isFingerBoneName(boneName)) {
        const springJointDesc = RAPIER.JointData.spring(
          0,
          1.0e4,
          122,
          ORIGIN,
          ORIGIN,
        );

        springJoint = this.rapierWorld.createImpulseJoint(
          springJointDesc,
          kinematicBoneRb,
          dynamicBoneRb,
          true,
        );
      }

      let axesMask: RAPIER.JointAxesMask;

      let genericImpulseJoint: RAPIER.ImpulseJoint | undefined;

      if (isFingerBoneName(boneName)) {
        axesMask =
          RAPIER.JointAxesMask.AngX |
          RAPIER.JointAxesMask.AngY |
          RAPIER.JointAxesMask.AngZ;
      } else {
        axesMask =
          RAPIER.JointAxesMask.AngX |
          RAPIER.JointAxesMask.AngY |
          RAPIER.JointAxesMask.AngZ |
          RAPIER.JointAxesMask.X |
          RAPIER.JointAxesMask.Y |
          RAPIER.JointAxesMask.Z;

        const genericJointParams = RAPIER.JointData.generic(
          {
            x: 0,
            y: 0,
            z: 0,
          },
          {
            x: 0,
            y: 0,
            z: 0,
          },
          {
            x: 1,
            y: 0,
            z: 0,
          },
          axesMask,
        );

        genericImpulseJoint = this.rapierWorld.createImpulseJoint(
          genericJointParams,
          kinematicBoneRb,
          dynamicBoneRb,
          true,
        );
      }

      // const AxesMask =
      //   RAPIER.JointAxesMask.AngX |
      //   RAPIER.JointAxesMask.AngY |
      //   RAPIER.JointAxesMask.AngZ |
      //   RAPIER.JointAxesMask.X |
      //   RAPIER.JointAxesMask.Y |
      //   RAPIER.JointAxesMask.Z;

      // const genericJointParams = RAPIER.JointData.generic(
      //   {
      //     x: 0,
      //     y: 0,
      //     z: 0,
      //   },
      //   {
      //     x: 0,
      //     y: 0,
      //     z: 0,
      //   },
      //   {
      //     x: 1,
      //     y: 0,
      //     z: 0,
      //   },
      //   axesMask,
      // );

      // const genericImpulseJoint = this.rapierWorld.createImpulseJoint(
      //   genericJointParams,
      //   kinematicBoneRb,
      //   dynamicBoneRb,
      //   true,
      // );

      const material = new THREE.MeshBasicMaterial({
        color: 0xffffff, // white
        opacity: 0.5,
        transparent: true,
      });

      const geometry = new THREE.CylinderGeometry(
        boneProps.width,
        boneProps.width,
        boneProps.height ? boneProps.height : 0.03,
      );

      const object3d = new THREE.Mesh(geometry, material);

      object3d.position.set(bonePosition.x, bonePosition.y, bonePosition.z);
      object3d.quaternion.set(oQuat1.x, oQuat1.y, oQuat1.z, oQuat1.w);

      this.addToRigidBodyState(dynamicBoneRb, object3d);
      this.addToRigidBodyState(kinematicBoneRb, object3d);
      this.addToColliderState(boneCollider, object3d);
      // this.addToColliderState(kinematicBoneCollider, object3d);

      object3d.visible = false;

      this.handGroup.add(object3d);

      this.boneData.set(boneName, {
        isTipBone: boneName.includes("tip"),
        joints: {
          top: xrTopJoint,
          bottom: xrBottomJoint,
        },
        dynamic: {
          rigidBody: dynamicBoneRb,
          bottomRbJoint: bottomJointData.dynamic.rigidBody,
          topRbJoint: topJointData.dynamic.rigidBody,
          transform: {
            position: new Vector3(
              bonePosition.x,
              bonePosition.y,
              bonePosition.z,
            ),
            orientation: oQuat1.clone(),
          },
          connectedImpulseJoints: {
            spring: springJoint,
            generic: genericImpulseJoint,
          },
          three: {
            bone: object3d,
            type: "cylinder",
            args: {
              width: boneProps.width,
              height: boneProps.height ? boneProps.height : 0.03,
              depth: boneProps.width,
            },
          },
        },
        kinematic: {
          rigidBody: kinematicBoneRb,
          bottomRbJoint: bottomJointData.kinematic.rigidBody,
          topRbJoint: topJointData.kinematic.rigidBody,
          transform: {
            position: new Vector3(
              bonePosition.x,
              bonePosition.y,
              bonePosition.z,
            ),
            orientation: oQuat1,
          },
          connectedImpulseJoints: {},
          three: {
            bone: object3d,
            type: "cylinder",
            args: {
              width: boneProps.width,
              height: boneProps.height ? boneProps.height : 0.03,
              depth: boneProps.width,
            },
          },
        },
      });

      console.log("this.handGroup: ", this.handGroup);
    });
  }

  private linkBones() {
    for (const boneName of boneNames) {
      const [bottomJointName, topJointName] = boneName.split(
        "--",
      ) as XRHandJoint[];

      if (!bottomJointName || !topJointName) {
        throw new Error(`Invalid bone name: ${boneName}`);
      }

      const bottomJointType = jointTypeMappings.get(bottomJointName);
      const topJointType = jointTypeMappings.get(topJointName);

      if (!bottomJointType || !topJointType) {
        console.warn(
          `linkBones: Joint types not found for ${bottomJointName}: ${bottomJointType} and ${topJointName}: ${topJointType} `,
        );
        return;
      }

      const bottomJoint = this.jointData.get(bottomJointName);
      const topJoint = this.jointData.get(topJointName);
      const bone = this.boneData.get(boneName);

      if (!bottomJoint || !topJoint || !bone) {
        console.warn(
          `linkBones: Dynamic joints ${bottomJointName} and ${topJointName} not found for bone ${boneName} at this.jointData`,
        );
        return;
      }

      const bottomJointRb = bottomJoint.dynamic.rigidBody;
      const topJointRb = topJoint.dynamic.rigidBody;
      const boneRb = bone.dynamic.rigidBody;
      const boneHeight = this.boneProps.get(boneName)!.height!;

      let topImpulseJoint: RAPIER.ImpulseJoint | undefined = undefined;
      let bottomImpulseJoint: RAPIER.ImpulseJoint | undefined = undefined;

      if (bottomJointName === "wrist") {
        const jointData = RAPIER.JointData.spherical(ORIGIN, {
          x: 0,
          y: boneHeight / 2 - this.trueHandJointRadius,
          z: 0,
        });

        jointData.stiffness = 1.0e5;
        jointData.damping = 150;

        const impulseJoint = this.rapierWorld.createImpulseJoint(
          jointData,
          bottomJointRb,
          boneRb,
          true,
        );

        bottomImpulseJoint = impulseJoint;
      }

      if (
        bottomImpulseJoint &&
        topImpulseJoint &&
        bottomJointName === "wrist"
      ) {
        bone.dynamic.connectedImpulseJoints.top = topImpulseJoint;
        bone.dynamic.connectedImpulseJoints.bottom = bottomImpulseJoint;
        return;
      }

      const jointLength = 0.001;

      switch (bottomJointType) {
        case JointType.Spherical: {
          const jointData = RAPIER.JointData.spherical(ORIGIN, {
            x: 0,
            y: -boneHeight / 2 - this.trueHandJointRadius,
            z: 0,
          });

          jointData.stiffness = 1.0e6;
          jointData.damping = 150;
          jointData.length = jointLength;

          console.log("jointData: ", jointData);

          const impulseJoint = this.rapierWorld.createImpulseJoint(
            jointData,
            bottomJointRb,
            boneRb,
            true,
          );

          // bone.attachedRapierJoints.bottom = bottomJoint;

          bottomImpulseJoint = impulseJoint;

          break;
        }
        case JointType.Revolute: {
          const jointData = RAPIER.JointData.revolute(
            ORIGIN,
            {
              x: 0,
              y: -boneHeight / 2 - this.trueHandJointRadius,
              z: 0,
            },
            {
              x: 1,
              y: 0,
              z: 0,
            },
          );

          jointData.stiffness = 1.0e6;
          jointData.damping = 150;
          jointData.length = jointLength;

          console.log("jointData: ", jointData);

          const impulseJoint = this.rapierWorld.createImpulseJoint(
            jointData,
            bottomJointRb,
            boneRb,
            true,
          );

          bottomImpulseJoint = impulseJoint;

          break;
        }
      }

      switch (topJointType) {
        case JointType.Spherical: {
          const jointData = RAPIER.JointData.spherical(
            // Bone
            {
              x: 0,
              y: boneHeight / 2 + this.trueHandJointRadius,
              z: 0,
            },
            // Joint
            ORIGIN,
          );

          jointData.stiffness = 1.0e6;
          jointData.damping = 150;
          jointData.length = jointLength;

          console.log("jointData: ", jointData);

          const impulseJoint = this.rapierWorld.createImpulseJoint(
            jointData,
            boneRb,
            topJointRb,
            true,
          );

          topImpulseJoint = impulseJoint;

          break;
        }
        case JointType.Revolute: {
          const jointData = RAPIER.JointData.revolute(
            ORIGIN,
            {
              x: 0,
              y: -boneHeight / 2 - this.trueHandJointRadius,
              z: 0,
            },
            {
              x: 1,
              y: 0,
              z: 0,
            },
          );

          jointData.stiffness = 1.0e6;
          jointData.damping = 150;
          jointData.length = jointLength;

          console.log("jointData: ", jointData);

          const impulseJoint = this.rapierWorld.createImpulseJoint(
            jointData,
            bottomJointRb,
            boneRb,
            true,
          );

          topImpulseJoint = impulseJoint;

          break;
        }
        case JointType.Fixed: {
          const jointData = RAPIER.JointData.fixed(
            // Bone
            {
              x: 0,
              // y: bone.boxArgs.height / 2,
              y: boneHeight / 2 + this.trueHandJointRadius,
              z: 0,
            },
            {
              x: 0,
              y: 0,
              z: 0,
              w: 1,
            },
            // Rigid Body Joint

            {
              x: 0,
              // y: -nextBone.boxArgs.height / 2,
              y: 0,
              z: 0,
            },
            // Joint
            {
              x: 0,
              y: 0,
              z: 0,
              w: 1,
            },
          );

          jointData.stiffness = 1.0e6;
          jointData.damping = 150;
          jointData.length = jointLength;

          console.log("jointData: ", jointData);

          const impulseJoint = this.rapierWorld.createImpulseJoint(
            jointData,
            boneRb,
            topJointRb,
            true,
          );

          topImpulseJoint = impulseJoint;

          break;
        }
      }

      /**
       * TESTING
       * Going to set rope joints between each bone and their respective connecting joints. I am doing this because right now, the bones move too much and are not constrained enough. Hopefully, the rope joints will keep the bones connected to the joints and not allow them to move too much.
       */

      // const jointData = RAPIER.JointData.rope(jointLength, ORIGIN, ORIGIN);

      // this.rapierWorld.createImpulseJoint(
      //   jointData,
      //   bottomJointRb,
      //   boneRb,
      //   true,
      // );

      // this.rapierWorld.createImpulseJoint(jointData, boneRb, topJointRb, true);

      if (bottomImpulseJoint && topImpulseJoint) {
        bone.dynamic.connectedImpulseJoints.top = topImpulseJoint;
        bone.dynamic.connectedImpulseJoints.bottom = bottomImpulseJoint;
      } else {
        console.warn(
          `linkBones: Impulse joints not created for bone ${boneName}. bottomJointName: ${bottomJointName}, topJointName: ${topJointName}`,
        );
      }
    }
  }

  private testLinkBones() {
    for (const boneName of boneNames) {
      const [bottomJointName, topJointName] = boneName.split(
        "--",
      ) as XRHandJoint[];

      if (!bottomJointName || !topJointName) {
        throw new Error(`Invalid bone name: ${boneName}`);
      }

      const bottomJointType = jointTypeMappings.get(bottomJointName);
      const topJointType = jointTypeMappings.get(topJointName);

      if (!bottomJointType || !topJointType) {
        console.warn(
          `linkBones: Joint types not found for ${bottomJointName}: ${bottomJointType} and ${topJointName}: ${topJointType} `,
        );
        return;
      }

      const bottomJoint = this.jointData.get(bottomJointName);
      const topJoint = this.jointData.get(topJointName);
      const bone = this.boneData.get(boneName);

      if (!bottomJoint || !topJoint || !bone) {
        console.warn(
          `linkBones: Dynamic joints ${bottomJointName} and ${topJointName} not found for bone ${boneName} at this.jointData`,
        );
        return;
      }

      const bottomJointRb = bottomJoint.dynamic.rigidBody;
      const topJointRb = topJoint.dynamic.rigidBody;
      const boneRb = bone.dynamic.rigidBody;

      const boneHeight = this.boneProps.get(boneName)!.height!;

      if (isFingerBoneName(boneName)) {
        let bottomBone: BoneInfo | undefined;
        let bottomBoneName: HandBoneNames | undefined;
        // let bottomJointType: RAPIER.JointType = RAPIER.JointType.Revolute;
        // Referring to how far back the bone can go
        let maxLimit = 0;
        // Referring to how far forward the bone can go
        const minLimit: number = -Math.PI / 2;
        console.log("---INDSIDE---");

        switch (boneName) {
          // THUMB
          case "thumb-phalanx-proximal--thumb-phalanx-distal":
            bottomBone = this.boneData.get(
              "thumb-metacarpal--thumb-phalanx-proximal",
            );
            bottomBoneName = "thumb-metacarpal--thumb-phalanx-proximal";
            maxLimit = Math.PI / 6;
            break;
          case "thumb-phalanx-distal--thumb-tip":
            bottomBone = this.boneData.get(
              "thumb-phalanx-proximal--thumb-phalanx-distal",
            );
            bottomBoneName = "thumb-phalanx-proximal--thumb-phalanx-distal";
            break;
          // INDEX FINGER
          case "index-finger-phalanx-proximal--index-finger-phalanx-intermediate":
            bottomBone = this.boneData.get(
              "index-finger-metacarpal--index-finger-phalanx-proximal",
            );
            // bottomJointType = RAPIER.JointType.Spherical;
            bottomBoneName =
              "index-finger-metacarpal--index-finger-phalanx-proximal";
            maxLimit = Math.PI / 6;
            break;
          case "index-finger-phalanx-intermediate--index-finger-phalanx-distal":
            bottomBone = this.boneData.get(
              "index-finger-phalanx-proximal--index-finger-phalanx-intermediate",
            );
            bottomBoneName =
              "index-finger-phalanx-proximal--index-finger-phalanx-intermediate";
            break;
          case "index-finger-phalanx-distal--index-finger-tip":
            bottomBone = this.boneData.get(
              "index-finger-phalanx-intermediate--index-finger-phalanx-distal",
            );
            bottomBoneName =
              "index-finger-phalanx-intermediate--index-finger-phalanx-distal";
            break;
          // MIDDLE FINGER
          case "middle-finger-phalanx-proximal--middle-finger-phalanx-intermediate":
            bottomBone = this.boneData.get(
              "middle-finger-metacarpal--middle-finger-phalanx-proximal",
            );
            bottomBoneName =
              "middle-finger-metacarpal--middle-finger-phalanx-proximal";
            maxLimit = Math.PI / 6;

            break;
          case "middle-finger-phalanx-intermediate--middle-finger-phalanx-distal":
            bottomBone = this.boneData.get(
              "middle-finger-phalanx-proximal--middle-finger-phalanx-intermediate",
            );
            bottomBoneName =
              "middle-finger-phalanx-proximal--middle-finger-phalanx-intermediate";
            break;
          case "middle-finger-phalanx-distal--middle-finger-tip":
            bottomBone = this.boneData.get(
              "middle-finger-phalanx-intermediate--middle-finger-phalanx-distal",
            );
            bottomBoneName =
              "middle-finger-phalanx-intermediate--middle-finger-phalanx-distal";
            break;
          // RING FINGER
          case "ring-finger-phalanx-proximal--ring-finger-phalanx-intermediate":
            bottomBone = this.boneData.get(
              "ring-finger-metacarpal--ring-finger-phalanx-proximal",
            );
            bottomBoneName =
              "ring-finger-metacarpal--ring-finger-phalanx-proximal";
            maxLimit = Math.PI / 6;

            break;
          case "ring-finger-phalanx-intermediate--ring-finger-phalanx-distal":
            bottomBone = this.boneData.get(
              "ring-finger-phalanx-proximal--ring-finger-phalanx-intermediate",
            );
            bottomBoneName =
              "ring-finger-phalanx-proximal--ring-finger-phalanx-intermediate";
            break;
          case "ring-finger-phalanx-distal--ring-finger-tip":
            bottomBone = this.boneData.get(
              "ring-finger-phalanx-intermediate--ring-finger-phalanx-distal",
            );
            bottomBoneName =
              "ring-finger-phalanx-intermediate--ring-finger-phalanx-distal";
            break;
          // PINKY FINGER
          case "pinky-finger-phalanx-proximal--pinky-finger-phalanx-intermediate":
            bottomBone = this.boneData.get(
              "pinky-finger-metacarpal--pinky-finger-phalanx-proximal",
            );
            bottomBoneName =
              "pinky-finger-metacarpal--pinky-finger-phalanx-proximal";
            maxLimit = Math.PI / 6;
            break;
          case "pinky-finger-phalanx-intermediate--pinky-finger-phalanx-distal":
            bottomBone = this.boneData.get(
              "pinky-finger-phalanx-proximal--pinky-finger-phalanx-intermediate",
            );
            bottomBoneName =
              "pinky-finger-phalanx-proximal--pinky-finger-phalanx-intermediate";
            break;
          case "pinky-finger-phalanx-distal--pinky-finger-tip":
            bottomBone = this.boneData.get(
              "pinky-finger-phalanx-intermediate--pinky-finger-phalanx-distal",
            );
            bottomBoneName =
              "pinky-finger-phalanx-intermediate--pinky-finger-phalanx-distal";
            break;
        }

        if (!bottomBone || !bottomBoneName) {
          console.warn(
            `testLinkBones: bottomBone not found for boneName ${boneName}`,
          );
          return;
        }

        const bottomBoneRb = bottomBone.dynamic.rigidBody;

        const bottomBoneHeight = this.boneProps.get(bottomBoneName)?.height;

        if (!bottomBoneHeight) {
          console.warn(
            `testLinkBones: bottomBoneHeight not found for bottomBoneName ${bottomBoneName}`,
          );
          return;
        }

        if (bottomJointType === RAPIER.JointType.Revolute) {
          const revoluteJointData = RAPIER.JointData.revolute(
            new RAPIER.Vector3(0, bottomBoneHeight / 2, 0),
            new RAPIER.Vector3(0, -boneHeight / 2, 0),
            new RAPIER.Vector3(1, 0, 0),
          );

          const revoluteJoint = this.rapierWorld.createImpulseJoint(
            revoluteJointData,
            bottomBoneRb,
            boneRb,
            true,
          ) as RAPIER.RevoluteImpulseJoint;
          // revoluteJoint.setLimits(0, 0);
          revoluteJoint.setLimits(minLimit, maxLimit);
          // revoluteJoint.configureMotorModel(RAPIER.MotorModel.ForceBased);

          bone.dynamic.connectedImpulseJoints.bottom = revoluteJoint;
        } else {
          /**
           * Spherical joints currently dont have motor configuration,
           * so revolute will have to do
           */
          // const sphericalJointData = RAPIER.JointData.generic(
          //   new RAPIER.Vector3(0, bottomBoneHeight / 2, 0),
          //   new RAPIER.Vector3(0, -boneHeight / 2, 0),
          //   new RAPIER.Vector3(1, 0, 0),
          // );
          // const sphericalJoint = this.rapierWorld.createImpulseJoint(
          //   sphericalJointData,
          //   bottomBoneRb,
          //   boneRb,
          //   true,
          // ) as RAPIER.RevoluteImpulseJoint;
          // sphericalJoint.setLimits(minLimit, maxLimit);
        }
      }
    }
  }

  private updateHands(withNewFingers: boolean) {
    console.log("updateHands - Updating hands now");

    jointNames.forEach((jointName) => {
      const xrJoint = this.xrJoints.get(jointName);

      if (!xrJoint) {
        console.warn(
          `updateHands: Joint ${jointName} not found in this.xrJoints`,
        );
        return;
      }
      const jointObj = this.jointData.get(jointName);

      if (!jointObj) {
        console.warn(
          `updateHands: Joint ${jointName} not found in this.jointData`,
        );
        return;
      }

      const { kinematic } = jointObj;

      const { position, orientation } = xrJoint.transform;

      kinematic.rigidBody.setNextKinematicTranslation(position);
      kinematic.rigidBody.setNextKinematicRotation(orientation);
    });

    boneNames.forEach((boneName) => {
      const bone = this.boneData.get(boneName);

      if (!bone) {
        console.warn(
          `updateHands: Bone ${boneName} not found in this.boneData`,
        );
        return;
      }

      const [startJointName, endJointName] = boneName.split(
        "--",
      ) as XRHandJoint[];

      if (!startJointName || !endJointName) {
        throw new Error(`Invalid bone name: ${boneName}`);
      }

      const xrBottomJoint = this.xrJoints.get(startJointName);
      const xrTopJoint = this.xrJoints.get(endJointName);

      if (!xrBottomJoint || !xrTopJoint) {
        console.warn(
          `updateHands: XR joints ${startJointName} and ${endJointName} not found for bone ${boneName} at this.jointData`,
        );
        return;
      }

      const kinematicBoneRb = bone.kinematic.rigidBody;

      const transform = bone.kinematic.transform;

      if (!transform) {
        console.warn(
          `updateHands: Transform for bone ${boneName} not found in this.boneData`,
        );
        return;
      }

      // const { position: xrbonePosition, orientation: xrBoneOrientation } =
      //   transform;

      const xrBonePosition = transform.position;
      const xrBoneOrientation = transform.orientation;

      const bottomJointPosition = xrBottomJoint.transform.position;
      const topJointPosition = xrTopJoint.transform.position;

      const bottomJointOrientation = xrBottomJoint.transform.orientation;
      const topJointOrientation = xrTopJoint.transform.orientation;

      // xrBoneOrientation
      //   .slerpQuaternions(bottomJointOrientation, topJointOrientation, 0.5)
      //   .multiply(BONE_ROTATION_QUATERNION);

      // transform.position.lerpVectors(bottomJointPosition, topJointPosition, 0.5);

      // transform.orientation.copy(bottomJointOrientation);

      // transform.orientation.multiply(BONE_ROTATION_QUATERNION);

      xrBonePosition.lerpVectors(bottomJointPosition, topJointPosition, 0.5);

      xrBoneOrientation.copy(bottomJointOrientation);

      xrBoneOrientation.multiply(BONE_ROTATION_QUATERNION);

      if (isFingerBoneName(boneName) && withNewFingers) {
        const revoluteJoint = bone.dynamic.connectedImpulseJoints
          .bottom as RAPIER.RevoluteImpulseJoint;

        if (!revoluteJoint) {
          console.warn(
            `updateHands: Revolute joint not found for bone ${boneName}`,
          );
          return;
        }

        const topJoint = this.jointData.get(endJointName);
        const bottomJoint = this.jointData.get(startJointName);

        if (!topJoint || !bottomJoint) {
          console.warn(
            `updateHands: Top or bottom kinematic joint not found for bone ${boneName}`,
          );
          return;
        }

        const kinematicBoneRb = bone.kinematic.rigidBody;

        // sort of works, but when it contact with any object it goes a bit crazy
        // dynamicBoneRb.setRotation(boneOrientation, true);

        /**
         * To properly set the the the target position for the revolute joint, we need to either:
         * a) use the position of the topKinematicJoint and bottomKinematicJoint
         * b) use the orientation of the corresponding kinematic bone rigid body
         */

        let connectedBoneRb = revoluteJoint.body1();

        const connectedBoneName = (
          connectedBoneRb.userData as {
            name: string;
          }
        ).name as HandBoneNames;

        const connectedBone = this.boneData.get(connectedBoneName);

        if (!connectedBone) {
          console.warn(
            `updateHands: Connected bone rigid body not found for bone ${boneName}`,
          );
          return;
        }
        connectedBoneRb = connectedBone.kinematic.rigidBody;

        const connectedBoneTransform = connectedBone.kinematic.transform;

        if (!connectedBoneTransform) {
          console.warn(
            `updateHands: Connected bone Transform not found for bone ${boneName}. Using Rigid Body position and orientation instead`,
          );
          return;
        }

        const connectedBoneQuaternion = connectedBoneTransform.orientation;

        console.log("connectedBoneQuaternion", connectedBoneQuaternion);
        console.log("xrBoneOrientation", xrBoneOrientation);

        const kinematicBoneQuaternionRaw = kinematicBoneRb.rotation();

        const connectedBoneQuaternionRaw = connectedBoneRb.rotation();

        console.log("kinematicBoneQuaternionRaw", kinematicBoneQuaternionRaw);
        console.log("connectedBoneQuaternionRaw", connectedBoneQuaternionRaw);

        const kinematicBoneQuat = _quaternion
          .set(
            kinematicBoneQuaternionRaw.x,
            kinematicBoneQuaternionRaw.y,
            kinematicBoneQuaternionRaw.z,
            kinematicBoneQuaternionRaw.w,
          )
          .normalize();

        const connectedBoneQuat = _quaternion2
          .set(
            connectedBoneQuaternionRaw.x,
            connectedBoneQuaternionRaw.y,
            connectedBoneQuaternionRaw.z,
            connectedBoneQuaternionRaw.w,
          )
          .normalize();

        const dotProduct = connectedBoneQuat.dot(kinematicBoneQuat);
        // const dotProduct = kinematicBoneQuat.dot(connectedBoneQuat);

        // const angle = -2 * Math.acos(dotProduct);
        const angle = -2 * Math.acos(dotProduct);

        revoluteJoint.configureMotorPosition(angle, 1.0e5, 500);
      }

      kinematicBoneRb.setNextKinematicTranslation(xrBonePosition);
      kinematicBoneRb.setNextKinematicRotation(xrBoneOrientation);
    });
  }

  private updateTransformProperties(
    jointName: XRHandJoint,
    position: Vector3Object,
    orientation: Vector4Object,
    updateBones = false,
  ) {
    const xrJoint = this.xrJoints.get(jointName);

    if (jointName === "wrist") {
      this.wrist.transform.position.set(position.x, position.y, position.z);
      this.wrist.transform.orientation.set(
        orientation.x,
        orientation.y,
        orientation.z,
        orientation.w,
      );
    }

    if (xrJoint) {
      xrJoint.transform.position.set(position.x, position.y, position.z);
      xrJoint.transform.orientation.set(
        orientation.x,
        orientation.y,
        orientation.z,
        orientation.w,
      );
    }

    if (updateBones) {
      // boneNames.forEach( () => {
      //   const boneName
      // })
    }
  }

  private linkWrists(): boolean {
    // const trueWristRb = this.wrist.rigidBodies.trueWrist.current;
    // const kinematicWristRb = this.wrist.rigidBodies.kinematicWrist.current;

    const trueWristRb = this.jointData.get("wrist")?.dynamic.rigidBody;
    const kinematicWristRb = this.jointData.get("wrist")?.kinematic.rigidBody;

    if (!kinematicWristRb) {
      console.error("linkWrists: kinematicWristRb not found");
      return false;
    }

    if (!trueWristRb) {
      console.error("linkWrists: trueWristRb is undefined");
      return false;
    }

    // const kinematicWristPosition = kinematicWristRb.translation();

    const AxesMask =
      RAPIER.JointAxesMask.AngX |
      RAPIER.JointAxesMask.AngY |
      RAPIER.JointAxesMask.AngZ |
      RAPIER.JointAxesMask.X |
      RAPIER.JointAxesMask.Y |
      RAPIER.JointAxesMask.Z;

    // const AxesMask =
    //   RAPIER.JointAxesMask.AngX |
    //   RAPIER.JointAxesMask.AngY |
    //   RAPIER.JointAxesMask.AngZ;

    const genericJointParams = RAPIER.JointData.generic(
      {
        x: 0,
        y: 0,
        z: 0,
      },
      {
        x: 0,
        y: 0,
        z: 0,
      },
      {
        x: 1,
        y: 0,
        z: 0,
      },
      AxesMask,
    );

    this.rapierWorld.createImpulseJoint(
      genericJointParams,
      kinematicWristRb,
      trueWristRb,
      true,
    );

    const KWPosition = kinematicWristRb.translation();

    const springJointParams = RAPIER.JointData.spring(
      0,
      1.0e4,
      150,
      {
        x: 0,
        y: 0,
        z: 0,
      },
      {
        x: KWPosition.x,
        y: KWPosition.y,
        z: KWPosition.z,
      },
    );

    this.rapierWorld.createImpulseJoint(
      springJointParams,
      kinematicWristRb,
      trueWristRb,
      true,
    );

    // kinematicWrist.attachedRapierJoints.spring = joint;
    // kinematicWrist.attachedRapierJoints.generic = joint2;

    // trueWrist.attachedRapierJoints.spring = joint;
    // trueWrist.attachedRapierJoints.generic = joint2;

    return true;
  }

  private calculateHeightForBone(
    jointOne: THREE.Vector3,
    jointTwo: THREE.Vector3,
  ) {
    return jointOne.distanceTo(jointTwo);
  }

  private createPalmSensor() {
    const palmJointPositions: THREE.Vector3[] = [];

    const palmJointOrientation: THREE.Quaternion[] = [];

    _vector.set(0, 0, 0);

    PalmSensorJointNamesArr.forEach((palmJointName, i) => {
      const jointData = this.jointData.get(palmJointName);
      const xrJointData = this.xrJoints.get(palmJointName);
      if (!jointData) {
        console.warn(
          `createPalmSensor: Joint ${palmJointName} not found in jointData`,
        );
        return;
      }

      if (!jointData.dynamic.transform) {
        console.warn(
          `createPalmSensor: Joint ${palmJointName} dynamic transform not found`,
        );
        return;
      }
      const jointPosition = jointData.dynamic.transform.position;
      const jointOrientation = jointData.dynamic.transform.orientation;

      palmJointOrientation.push(jointOrientation);

      palmJointPositions.push(jointPosition);
    });

    const palmCenterPosition = new THREE.Vector3();
    const palmCenterOrientation = new THREE.Quaternion();

    palmJointPositions.forEach((position) => {
      palmCenterPosition.add(position);
    });

    palmJointOrientation.forEach((orientation) => {
      palmCenterOrientation.slerp(orientation, 0.5);
    });

    palmCenterPosition.divideScalar(palmJointPositions.length);

    const handForwardDirection = new THREE.Vector3(0, 0, -1);
    handForwardDirection.applyQuaternion(palmCenterOrientation);

    _vector.set(
      palmCenterPosition.x,
      palmCenterPosition.y,
      palmCenterPosition.z,
    );

    _vector.addScaledVector(handForwardDirection, 0.05);

    const palmSensorDesc = RAPIER.ColliderDesc.ball(0.05)
      .setCollisionGroups(interactionGroups([], []))
      .setTranslation(_vector.x, _vector.y, _vector.z);

    const palmSensorCollider = this.rapierWorld.createCollider(palmSensorDesc);

    const colliderObject = new THREE.Object3D();

    this.addToColliderState(palmSensorCollider, colliderObject);

    this.palmSensor = palmSensorCollider;

    console.log(palmSensorCollider);

    // this.addToColliderState(palmSensorCollider, _vector);
  }

  private updateSensor() {
    if (!this.sensorJoints) {
      return;
    }

    if (!this.palmSensor) {
      console.warn("updateSensor: Palm sensor not found");
      return;
    }

    const palmJointPositions: THREE.Vector3[] = [];

    const palmJointOrientation: THREE.Quaternion[] = [];

    _vector.set(0, 0, 0);

    PalmSensorJointNamesArr.forEach((palmJointName, i) => {
      const jointData = this.jointData.get(palmJointName);
      const xrJointData = this.xrJoints.get(palmJointName);
      if (!jointData) {
        console.warn(
          `updateSensor: Joint ${palmJointName} not found in jointData`,
        );
        return;
      }

      if (!jointData.dynamic.transform) {
        console.warn(
          `updateSensor: Joint ${palmJointName} dynamic transform not found`,
        );
        return;
      }

      const jointPosition = jointData.dynamic.transform.position;
      const jointOrientation = jointData.dynamic.transform.orientation;

      palmJointPositions.push(jointPosition);
      palmJointOrientation.push(jointOrientation);
    });

    const palmCenterPosition = new THREE.Vector3();
    const palmCenterOrientation = new THREE.Quaternion();

    palmJointPositions.forEach((position) => {
      palmCenterPosition.add(position);
    });
    palmCenterPosition.divideScalar(palmJointPositions.length);

    palmJointOrientation.forEach((orientation) => {
      palmCenterOrientation.slerp(orientation, 1 / palmJointOrientation.length);
    });

    const handForwardDirection = new THREE.Vector3(0, 0, -1);

    handForwardDirection.applyQuaternion(palmCenterOrientation);

    palmCenterPosition.addScaledVector(handForwardDirection, 0.05);

    this.palmSensor.setTranslation(palmCenterPosition);
  }

  private addToRigidBodyState(
    rigidBody: RAPIER.RigidBody,
    object3d: THREE.Object3D,
  ) {
    //
    object3d.updateWorldMatrix(true, false);

    console.log("object3d", object3d);

    // const invertedWorldMatrix = object3d.parent!.matrixWorld.clone().invert();

    const rbState = {
      object: object3d,
      rigidBody,
      invertedWorldMatrix: object3d.matrix.clone().invert(),
      setMatrix: (matrix: THREE.Matrix4) => object3d.matrix.copy(matrix),
      getMatrix: (matrix: THREE.Matrix4) => matrix.copy(object3d.matrix),
      scale: object3d.getWorldScale(_vector),
      isSleeping: rigidBody.isSleeping(),
      meshType: "mesh" as const,
    };

    this.rigidBodyStates.set(rigidBody.handle, rbState);
  }

  private addToColliderState(
    collider: RAPIER.Collider,
    object3d: THREE.Object3D,
  ) {
    const colliderState = {
      object: object3d,
      collider,
    };

    this.colliderStates.set(collider.handle, colliderState);
  }

  public setUpdateCallback(callback: () => void): void {
    this.updateCallback = callback;
  }

  public clearUpdateCallback(): void {
    this.updateCallback = undefined;
  }

  private notifyUpdate(): void {
    if (this.updateCallback) {
      console.log("--------- Notifying update ------------");
      this.updateCallback();
    }
  }

  reset() {
    this.impulseJoints.forEach((joint) => {
      this.rapierWorld.removeImpulseJoint(joint, false);
    });
    this.impulseJoints.clear();

    this.boneData.forEach(({ dynamic, kinematic }) => {
      this.rapierWorld.removeRigidBody(dynamic.rigidBody);
      this.rapierWorld.removeRigidBody(kinematic.rigidBody);
      this.rigidBodyStates.delete(dynamic.rigidBody.handle);
      this.rigidBodyStates.delete(kinematic.rigidBody.handle);
    });
    this.boneData.clear();

    this.jointData.forEach(({ dynamic, kinematic }) => {
      this.rapierWorld.removeRigidBody(dynamic.rigidBody);
      this.rigidBodyStates.delete(dynamic.rigidBody.handle);
      this.rapierWorld.removeRigidBody(kinematic.rigidBody);
      this.rigidBodyStates.delete(kinematic.rigidBody.handle);
    });
    this.jointData.clear();

    this.xrJoints.clear();
    this.visible = false;
    this.intializedHand = false;
  }
}
