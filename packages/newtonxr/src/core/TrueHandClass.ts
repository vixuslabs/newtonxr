import type { UUID } from "crypto";
import React from "react";
import RAPIER, { ImpulseJoint, type World } from "@dimforge/rapier3d-compat";
// import { JointData } from "@dimforge/rapier3d-compat";
// import type { Vector3 as Vector3Like } from "@react-three/fiber";
import type {
  RapierCollider,
  RapierContext,
  RapierRigidBody,
  Vector3Object,
} from "@react-three/rapier";
import { interactionGroups, WorldStepCallback } from "@react-three/rapier";
import type {
  ColliderStateMap,
  RigidBodyStateMap,
} from "@react-three/rapier/dist/declarations/src/components/Physics.js";
// import { quat, vec3 } from "@react-three/rapier";
import { Bone, Quaternion, Vector3 } from "three";
import * as THREE from "three";
import { XRHandModel } from "three/examples/jsm/Addons.js";
import { cos } from "three/examples/jsm/nodes/Nodes.js";

import { BoneOrder, JointOrder, JointType } from "../hooks/useHandHooks.js";
import {
  _direction,
  _position,
  _quaternion,
  // _object,
  // _position,
  _vector,
} from "../utils/reserveThreeValues.js";
import { isTipJointName } from "./index.js";

const AxisVectors = {
  x: new Vector3(1, 0, 0),
  y: new Vector3(0, 1, 0),
  z: new Vector3(0, 0, 1),
};

const BONE_ROTATION_QUATERNION = new Quaternion().setFromAxisAngle(
  AxisVectors.x,
  -Math.PI / 2,
);

const ORIGIN = new Vector3(0, 0, 0);

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

type PalmJointNames = Extract<
  XRHandJoint,
  | "wrist"
  | "thumb-phalanx-proximal"
  | "index-finger-phalanx-proximal"
  | "pinky-finger-phalanx-proximal"
>;

const palmJointNamesArr: XRHandJoint[] = [
  "wrist",
  "thumb-phalanx-proximal",
  "index-finger-phalanx-proximal",
  "pinky-finger-phalanx-proximal",
];

export function isPalmJointName(name: XRHandJoint): name is PalmJointNames {
  return palmJointNamesArr.includes(name);
}

interface PalmProperties {
  joint: JointInfo;
  sensor?: React.RefObject<RapierCollider>;
}

type PalmJointMap = Map<PalmJointNames, PalmProperties>;
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

enum JointNamesEnum {
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

interface UpdateBonesOnFrameOptions {
  updateRapier?: boolean;
  updateSensor?: boolean;
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

interface TrueHandJointInfo extends JointInfo {
  rigidBody: React.RefObject<RapierRigidBody>;
  jointRefs: {
    bottom: React.RefObject<RAPIER.ImpulseJoint>;
    top: React.RefObject<RAPIER.ImpulseJoint>;
  };
}

interface KinematicJointInfo extends JointInfo {
  rigidBody: React.RefObject<RapierRigidBody>;
  rapierJoint: React.RefObject<RAPIER.ImpulseJoint>;
}

export interface AttachedRapierJoints {
  spring?: RAPIER.ImpulseJoint;
  generic?: RAPIER.ImpulseJoint;
  top?: RAPIER.ImpulseJoint;
  bottom?: RAPIER.ImpulseJoint;
}

export interface BoneInfo {
  name: HandBoneNames;
  id: UUID;
  startJoint: JointInfo;
  endJoint: JointInfo;
  transform: TransformProperties;
  refs: {
    trueBoneRef: React.RefObject<RapierRigidBody>;
    kinematicBoneRef: React.RefObject<RapierRigidBody>;
    trueBoneColliderRef?: React.RefObject<RapierCollider>;
  };
  boxArgs: {
    width: number;
    height?: number;
    depth: number;
  };
  isTipBone: boolean;
  attachedRapierJoints: AttachedRapierJoints;
}

interface KinematicBoneInfo extends BoneInfo {
  startJoint: KinematicJointInfo;
  endJoint: KinematicJointInfo;
}

export type FingerNames = "thumb" | "index" | "middle" | "ring" | "pinky";

interface CompleteFinger {
  bones: BoneInfo[];
  // fingerRigidBody: React.RefObject<RapierRigidBody>;
  fingerRefs: {
    trueFinger: React.RefObject<RapierRigidBody>;
    kinematicFinger: React.RefObject<RapierRigidBody>;
  };
  boneRefs: {
    trueBoneRef: React.RefObject<RapierRigidBody>;
    kinematicBoneRef: React.RefObject<RapierRigidBody>;
  };
}

export const fingerOrder: FingerNames[] = [
  "thumb",
  "index",
  "middle",
  "ring",
  "pinky",
];

interface kinematicHand {
  joints: KinematicJointInfo[];
  bones: BoneInfo[];
}

// export type CompleteFingerBones = Record<Fingers, CompleteFinger>;
export type CompleteFingerBones = [FingerNames, CompleteFinger][];

export interface TrueHandClassProps {
  handedness: XRHandedness;
  intializedHand: boolean;
  visible: boolean;
  handsLinked: boolean;
  kinematicBones: BoneInfo[];
  dynamicBones: BoneInfo[];
  xrJoints: Map<XRHandJoint, JointInfo>;
  rapier: World;
  initHand: () => void;
  updateBone: (name: HandBoneNames, bone: BoneInfo) => void;
  updateHandOnFrame: (
    hand: XRHand,
    frame: XRFrame,
    referenceSpace: XRReferenceSpace,
    options?: UpdateBonesOnFrameOptions,
  ) => void;
  getBone: (name: HandBoneNames) => BoneInfo;
  setVisibility: (visible: boolean) => void;
}

export interface TrueHand {
  ready: boolean;
  handsLinked: boolean;
  joints: [XRHandJoint, TrueHandJointInfo][];
  bones: BoneInfo[];
}

export interface KinematicHand {
  ready: boolean;
  handsLinked: boolean;
  joints: [XRHandJoint, KinematicJointInfo][];
  bones: BoneInfo[];
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

interface JointRigidBodyTypes {
  dynamic: RAPIER.RigidBody;
  kinematic: RAPIER.RigidBody;
}

export interface RigidBodyBoneData {
  rigidBody: RAPIER.RigidBody;
  object3d?: THREE.Object3D;
  transform?: RapierTransformProperties;
}

// export interface RapierTransformProperties {
//   position: RAPIER.Vector3;
//   orientation: RAPIER.Quaternion;
// }

export interface RapierTransformProperties {
  position: THREE.Vector3;
  orientation: THREE.Quaternion;
}

interface BoneData {
  dynamic: RigidBodyBoneData;
  kinematic: RigidBodyBoneData;
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
  handsLinked: boolean;
  ligamentsCreated: boolean;
  handsBuilt: boolean;
  wrist: Wrist;
  trueHand: TrueHand;
  kinematicHand: KinematicHand;

  handGroup: THREE.Group;
  boneProps: Map<HandBoneNames, NewtonBoneProps>;
  // rigidBodies: [handle: number, rigidBody: RapierRigidBody][];
  jointData: Map<XRHandJoint, JointData>;
  boneData: Map<HandBoneNames, BoneData>;
  // impulseJoints: [handle: number, impulseJoint: ImpulseJoint][];
  impulseJoints: Map<HandBoneNames | XRHandJoint, RAPIER.ImpulseJoint>;
  boneImpulseJoints: Map<HandBoneNames, BoneImpulseJoints>;
  rigidBodyStates: RigidBodyStateMap;
  colliderStates: ColliderStateMap;

  completeFingers: BoneInfo[][];
  completeFingerBones: CompleteFingerBones;
  xrJoints: Map<XRHandJoint, JointInfo>;
  sensorJoints: Map<PalmJointNames, PalmProperties> | undefined;
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
    this.handsLinked = false;
    this.intializedHand = false;
    this.ligamentsCreated = false;
    this.handsBuilt = false;
    // this.kinematicWrist = React.createRef<RapierRigidBody>();
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
    this.kinematicHand = {
      ready: false,
      handsLinked: false,
      joints: [],
      bones: [],
    };
    this.trueHand = {
      ready: false,
      handsLinked: false,
      joints: [],
      bones: [],
    };

    this.handGroup = new THREE.Group();
    this.boneProps = new Map<HandBoneNames, NewtonBoneProps>();
    // this.rigidBodies = [];
    this.jointData = new Map<XRHandJoint, JointData>();
    this.boneData = new Map<HandBoneNames, BoneData>();
    // this.impulseJoints = [];
    this.impulseJoints = new Map<
      HandBoneNames | XRHandJoint,
      RAPIER.ImpulseJoint
    >();
    this.boneImpulseJoints = new Map<HandBoneNames, BoneImpulseJoints>();
    this.rigidBodyStates = rigidBodyStates;
    this.colliderStates = colliderStates;

    this.completeFingers = [];
    this.completeFingerBones = [
      [
        "thumb",
        {
          bones: [],
          boneRefs: {
            trueBoneRef: React.createRef<RapierRigidBody>(),
            kinematicBoneRef: React.createRef<RapierRigidBody>(),
          },
          fingerRefs: {
            trueFinger: React.createRef<RapierRigidBody>(),
            kinematicFinger: React.createRef<RapierRigidBody>(),
          },
        },
      ],
      [
        "index",
        {
          bones: [],
          boneRefs: {
            trueBoneRef: React.createRef<RapierRigidBody>(),
            kinematicBoneRef: React.createRef<RapierRigidBody>(),
          },
          fingerRefs: {
            trueFinger: React.createRef<RapierRigidBody>(),
            kinematicFinger: React.createRef<RapierRigidBody>(),
          },
        },
      ],
      [
        "middle",
        {
          bones: [],
          boneRefs: {
            trueBoneRef: React.createRef<RapierRigidBody>(),
            kinematicBoneRef: React.createRef<RapierRigidBody>(),
          },
          fingerRefs: {
            trueFinger: React.createRef<RapierRigidBody>(),
            kinematicFinger: React.createRef<RapierRigidBody>(),
          },
        },
      ],
      [
        "ring",
        {
          bones: [],
          boneRefs: {
            trueBoneRef: React.createRef<RapierRigidBody>(),
            kinematicBoneRef: React.createRef<RapierRigidBody>(),
          },
          fingerRefs: {
            trueFinger: React.createRef<RapierRigidBody>(),
            kinematicFinger: React.createRef<RapierRigidBody>(),
          },
        },
      ],
      [
        "pinky",
        {
          bones: [],
          boneRefs: {
            trueBoneRef: React.createRef<RapierRigidBody>(),
            kinematicBoneRef: React.createRef<RapierRigidBody>(),
          },
          fingerRefs: {
            trueFinger: React.createRef<RapierRigidBody>(),
            kinematicFinger: React.createRef<RapierRigidBody>(),
          },
        },
      ],
    ];
    this.sensorJoints = withSensor
      ? new Map<PalmJointNames, PalmProperties>()
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

    // let fingersArr: BoneInfo[] = [];

    boneNames.forEach((boneName, i) => {
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

      const bone: BoneInfo = {
        name: boneName,
        id: crypto.randomUUID(),
        startJoint: existingStartJointInfo ?? startJoint,
        endJoint: existingEndJointInfo ?? endJoint,
        transform: {
          position: new Vector3(),
          orientation: new Quaternion(),
        },
        boxArgs: {
          width: 0.008,
          depth: 0.004,
        },
        isTipBone: isTipJointName(endJointName),
        refs: {
          trueBoneRef: React.createRef<RapierRigidBody>(),
          kinematicBoneRef: React.createRef<RapierRigidBody>(),
          trueBoneColliderRef: React.createRef<RapierCollider>(),
        },
        attachedRapierJoints: {},
      };
      this.trueHand.bones.push(bone);

      this.boneProps.set(boneName, {
        width: 0.004,
        depth: 0.004,
      });

      if (startJointName !== "wrist" || i === 0) {
        const trueJointInfo: TrueHandJointInfo = {
          ...(existingStartJointInfo ?? startJoint),
          rigidBody: React.createRef<RapierRigidBody>(),
          jointRefs: {
            bottom: React.createRef<RAPIER.ImpulseJoint>(),
            top: React.createRef<RAPIER.ImpulseJoint>(),
          },
        };

        const kinematicJointInfo: KinematicJointInfo = {
          ...(existingStartJointInfo ?? startJoint),
          rigidBody: React.createRef<RapierRigidBody>(),
          rapierJoint: React.createRef<RAPIER.ImpulseJoint>(),
        };

        this.trueHand.joints.push([startJointName, trueJointInfo]);
        this.kinematicHand.joints.push([startJointName, kinematicJointInfo]);
      }

      if (isTipJointName(endJointName)) {
        const newTrueHandJointInfo: TrueHandJointInfo = {
          ...(existingEndJointInfo ?? endJoint),
          rigidBody: React.createRef<RapierRigidBody>(),
          jointRefs: {
            bottom: React.createRef<RAPIER.ImpulseJoint>(),
            top: React.createRef<RAPIER.ImpulseJoint>(),
          },
        };

        const newKinematicJointInfo: KinematicJointInfo = {
          ...(existingEndJointInfo ?? endJoint),
          rigidBody: React.createRef<RapierRigidBody>(),
          rapierJoint: React.createRef<RAPIER.ImpulseJoint>(),
        };

        this.trueHand.joints.push([endJointName, newTrueHandJointInfo]);
        this.kinematicHand.joints.push([endJointName, newKinematicJointInfo]);
      }
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
    },
  ) {
    if (!this.visible) {
      console.log("updateHandOnFrame - Hand not visible");
      return;
    }
    if (!this.intializedHand) {
      console.log("updateHandOnFrame - Hand not initialized, init now");
      this.initHand();
      return;
    }

    for (const jointSpace of hand.values()) {
      const xrJoint = this.xrJoints.get(jointSpace.jointName);

      if (!xrJoint) {
        console.debug(
          `Joint ${jointSpace.jointName} not found in this.xrJoints, setting now`,
        );
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
        false,
      );
    }

    if (this.boneData.size === 0) {
      console.log("updateHandOnFrame - Creating bones now");
      this.setBoneHeights();
      this.buildHand();
      this.linkBones();

      this.notifyUpdate();
    }

    console.log("updateHandOnFrame - Updating bones now");
    console.log();
    // console.log("this.trueHand", this.trueHand);

    if (options.updateRapier) {
      // this.updateRapierBones();
      // this.updateKinematicHand(false, true);
      // this.updateKinematicHand(true, false);
      this.updateHands();
      this.notifyUpdate();
    }

    if (!this.handsBuilt) {
      // console.log("updateHandOnFrame - Creating ligaments now");
      // this.createBoneLinks();

      // this.updateKinematicHand(false, true);
      // this.updateKinematicHand(true, false);
      // this.buildTrueHand();
      // this.buildTrueHandNoJoints();

      if (this.kinematicHand.ready && this.trueHand.ready) {
        this.handsBuilt = true;
      }
      //testing
      // this.handsBuilt = true;
      // this.notifyUpdate();
    }

    if (!this.handsLinked) {
      // console.log("updateHandOnFrame - Linking bones now");
      // this.linkWrists();
      // this.synchronizeHands(false, true);
      // this.synchronizeHands(true, false, false);
      // this.updateKinematicHand(false, true);
      // this.updateKinematicHand(true, false);

      // if (this.trueHand.handsLinked && this.kinematicHand.handsLinked) {
      if (this.trueHand.handsLinked) {
        this.handsLinked = true;
      }
      // testing
      // this.handsLinked = true;
      // this.notifyUpdate();
    }

    // this.notifyUpdate();
  }

  private setBoneHeights() {
    boneNames.forEach((boneName, i) => {
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
    const dynamicRbTracker = new Map<XRHandJoint, RapierRigidBody>();

    const pVector1 = new Vector3(0, 0, 0);
    const pVector2 = new Vector3(0, 0, 0);
    const oQuat1 = new Quaternion(0, 0, 0);
    const oQuat2 = new Quaternion(0, 0, 0);

    const originVector = new Vector3(0, 0, 0);

    jointNames.forEach((jointName, i) => {
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

      const dynamicJointDesc = RAPIER.RigidBodyDesc.dynamic()
        .setCanSleep(false)
        .setUserData({
          name: jointName,
          type: "dynamic",
        })
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

      const fixedJointDesc = RAPIER.JointData.fixed(
        new RAPIER.Vector3(0, 0, 0),
        new RAPIER.Quaternion(0.0, 0.0, 0.0, 1.0),
        // kinematicJointRb.translation(),
        new RAPIER.Vector3(0, 0, 0),
        new RAPIER.Quaternion(0.0, 0.0, 0.0, 1.0),
      );

      const fixedImpulseJoint = this.rapierWorld.createImpulseJoint(
        fixedJointDesc,
        kinematicJointRb,
        dynamicJointRb,
        true,
      );

      dynamicRbTracker.set(jointName, dynamicJointRb);

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

      this.jointData.set(jointName, {
        dynamic: {
          object3d: dynamicObject3d,
          rigidBody: dynamicJointRb,
        },
        kinematic: {
          object3d: kinematicObject3d,
          rigidBody: kinematicJointRb,
        },
      });
      // this.jointData.set(jointName, dynamicJointRb);
      this.impulseJoints.set(jointName, springJoint);

      this.handGroup.add(dynamicObject3d);
      this.handGroup.add(kinematicObject3d);

      this.addToRigidBodyState(dynamicJointRb, dynamicObject3d);
      this.addToRigidBodyState(kinematicJointRb, kinematicObject3d);

      // this.addToColliderState(dynamicCollider, dynamicObject3d);
    });

    boneNames.forEach((boneName, i) => {
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

      const bottomJoint = dynamicRbTracker.get(startJointName);
      const topJoint = dynamicRbTracker.get(endJointName);

      if (!bottomJoint || !topJoint) {
        console.warn(
          `buildHand: Dynamic joints ${startJointName} and ${endJointName} not found for bone ${boneName}`,
        );
        return;
      }

      const bottomJointTranslation = bottomJoint.translation();
      const topJointTranslation = topJoint.translation();

      const bottomJointOrientation = bottomJoint.rotation();

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

      const dynamicBoneDesc = RAPIER.RigidBodyDesc.dynamic()
        .setGravityScale(0)
        .setCanSleep(false)
        .setUserData({
          name: boneName,
          type: "dynamic",
        })
        .setAngvel(new RAPIER.Vector3(0, 0, 0))
        .setLinvel(0, 0, 0)
        .setTranslation(bonePosition.x, bonePosition.y, bonePosition.z)
        .setRotation(oQuat1);

      const dynamicBoneRb = this.rapierWorld.createRigidBody(dynamicBoneDesc);

      const boneColliderDesc = RAPIER.ColliderDesc.cylinder(
        boneProps.height ? boneProps.height / 2 : 0.03,
        boneProps.width,
      )
        .setDensity(50)
        .setFriction(2)
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
      this.addToColliderState(boneCollider, object3d);

      object3d.visible = false;

      this.handGroup.add(object3d);

      this.boneData.set(boneName, {
        dynamic: {
          object3d,
          rigidBody: dynamicBoneRb,
        },
        kinematic: {
          rigidBody: kinematicBoneRb,
          transform: {
            position: object3d.clone().position,
            orientation: object3d.clone().quaternion,
          },
        },
      });
    });

    console.log("this.handGroup: ", this.handGroup);
  }

  private linkBones() {
    const stiffness = 1.0e5;
    const damping = 150;

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

      // if (bottomJointName === "wrist") {
      //   console.log("bottomJointPosition: ", bottomJointPosition);
      //   console.log("topJointPosition: ", topJointPosition);
      //   console.log("bonePosition: ", bonePosition);

      //   const jointData = RAPIER.JointData.spherical(ORIGIN, {
      //     x: 0,
      //     y: boneHeight / 2 - this.trueHandJointRadius,
      //     z: 0,
      //   });

      //   jointData.stiffness = stiffness;
      //   jointData.damping = damping;

      //   const impulseJoint = this.rapierWorld.createImpulseJoint(
      //     jointData,
      //     bottomJointRb,
      //     boneRb,
      //     true,
      //   );

      //   bottomImpulseJoint = impulseJoint;

      //   // this.impulseJoints.set(bottomJointName, topImpulseJoint);

      //   // this.boneImpulseJoints.set(boneName, {
      //   //   top: joint,
      //   //   bottom: joint,
      //   // });
      // }

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
        this.boneImpulseJoints.set(boneName, {
          bottom: bottomImpulseJoint,
          top: topImpulseJoint,
        });
      } else {
        console.warn(
          `linkBones: Impulse joints not created for bone ${boneName}. bottomJointName: ${bottomJointName}, topJointName: ${topJointName}`,
        );
      }
    }
  }

  private updateHands() {
    console.log("updateHands - Updating hands now");

    jointNames.forEach((jointName, i) => {
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

      // dynamic.rigidBody.setTranslation(position, true);
      // dynamic.rigidBody.setRotation(orientation, true);

      kinematic.rigidBody.setNextKinematicTranslation(position);
      kinematic.rigidBody.setNextKinematicRotation(orientation);
    });

    boneNames.forEach((boneName, i) => {
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

      const { position: bonePosition, orientation: boneOrientation } =
        transform;

      const bottomJointPosition = xrBottomJoint.transform.position;
      const topJointPosition = xrTopJoint.transform.position;

      const bottomJointOrientation = xrBottomJoint.transform.orientation;
      const topJointOrientation = xrTopJoint.transform.orientation;

      bonePosition.lerpVectors(bottomJointPosition, topJointPosition, 0.5);

      boneOrientation.copy(bottomJointOrientation);

      boneOrientation.multiply(BONE_ROTATION_QUATERNION);

      kinematicBoneRb.setNextKinematicTranslation(bonePosition);
      kinematicBoneRb.setNextKinematicRotation(boneOrientation);
    });
  }

  private updateTransformProperties(
    jointName: XRHandJoint,
    position: Vector3Object,
    orientation: Vector4Object,
    updateKinematicJoint = true,
  ) {
    const xrJoint = this.xrJoints.get(jointName);
    const trueHandJoint = this.trueHand.joints[JointOrder[jointName]];

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

    if (trueHandJoint) {
      const [, trueJoint] = trueHandJoint;

      trueJoint.transform.position.set(position.x, position.y, position.z);
      trueJoint.transform.orientation.set(
        orientation.x,
        orientation.y,
        orientation.z,
        orientation.w,
      );
    }

    if (updateKinematicJoint) {
      const kinematicJointArr =
        this.kinematicHand.joints[JointOrder[jointName]];

      if (!kinematicJointArr) {
        console.warn(
          `updateTransformProperties: Kinematic joint for ${jointName} not found in this.kinematicHand.joints`,
        );
        return;
      }

      const [, kinematicJoint] = kinematicJointArr;

      kinematicJoint.transform.position.set(position.x, position.y, position.z);
      kinematicJoint.transform.orientation.set(
        orientation.x,
        orientation.y,
        orientation.z,
        orientation.w,
      );
    }
  }

  private updateKinematicHand(updateBones: boolean, updateJoints: boolean) {
    let success = true;

    if (updateBones)
      // this.kinematicHand.bones.forEach((bone) => {
      this.trueHand.bones.forEach((bone) => {
        const startJoint = bone.startJoint;
        const endJoint = bone.endJoint;

        const startJointPosition = startJoint.transform.position;
        const endJointPosition = endJoint.transform.position;

        if (!bone.boxArgs.height) {
          bone.boxArgs.height = this.calculateHeightForBone(
            startJoint.transform.position,
            endJoint.transform.position,
          );
        }

        bone.transform.position
          // .copy(startJointPosition)
          .lerpVectors(startJointPosition, endJointPosition, 0.5);

        // bone.transform.position.

        // _direction.copy(startJointPosition).sub(endJointPosition).normalize();
        // _direction.copy(endJointPosition).sub(startJointPosition).normalize();

        const vectorIsCorrect =
          _vector.x === 0 && _vector.y === -1 && _vector.z === 0;

        // bone.transform.orientation.setFromUnitVectors(
        //   vectorIsCorrect ? _vector : _vector.set(0, -1, 0),
        //   _direction,
        // );

        // Update bone transform
        if (bone.refs.kinematicBoneRef.current) {
          // bone.refs.kinematicBoneRef.current.setNextKinematicTranslation(
          //   bone.transform.position,
          // );
          // bone.refs.kinematicBoneRef.current.setNextKinematicRotation(
          //   bone.transform.orientation,
          // );

          // console.log(
          //   "bone.transform.orientation: ",
          //   bone.transform.orientation,
          // );

          // const upQuat = new Quaternion(0, 1, 0, 1);

          const xrStartJoint = this.xrJoints.get(startJoint.name)!;
          const xrEndJoint = this.xrJoints.get(endJoint.name)!;

          // console.log(
          //   "xrJoint.transform.orientation: ",
          //   xrStartJoint.transform.orientation,
          // );

          // _quaternion.slerp()

          // console.log("--- COMPARING XRJOINT AND TRUEHAND  ---");
          // console.log("bone.name: ", bone.name);

          // console.log(
          //   "xrStartJoint.transform.orientation: ",
          //   xrStartJoint.transform.orientation,
          // );
          // console.log(
          //   "startJoint.transform.orientation: ",
          //   startJoint.transform.orientation,
          // );
          // console.log(
          //   "xrEndJoint.transform.orientation: ",
          //   xrEndJoint.transform.orientation,
          // );
          // console.log(
          //   "endJoint.transform.orientation: ",
          //   endJoint.transform.orientation,
          // );
          // console.log("---\n");

          const ogStartJointOrientation = startJoint.transform.orientation;

          // if (bone.name.includes("wrist")) {
          //   // console.log("bone.name: ", bone.name);
          //   // console.log("ogStartJointOrientation: ", ogStartJointOrientation);

          //   ogStartJointOrientation.angleTo(this.wrist.transform.orientation);
          // }

          ogStartJointOrientation.multiply(BONE_ROTATION_QUATERNION);

          // _quaternion.setFromAxisAngle(AxisVectors.x, -Math.PI / 2);
          bone.refs.kinematicBoneRef.current.setNextKinematicTranslation(
            bone.transform.position,
          );

          bone.refs.kinematicBoneRef.current.setNextKinematicRotation(
            ogStartJointOrientation,
          );
        } else {
          console.error("RapierRigidBody not found for kinematicBone: ", bone);
          success = false;
        }
      });

    if (updateJoints) {
      for (const [, joint] of this.trueHand.joints) {
        // if (name !== "wrist") continue;
        const position = joint.transform.position;
        const orientation = joint.transform.orientation;

        if (joint.rigidBody.current) {
          console.log("\n--------");
          console.log(
            "updateKinematicHand - joint.rigidBody.current.translation() ",
            joint.rigidBody.current?.translation(),
          );
          console.log(
            "updateKinematicHand - joint.rigidBody.current.rotation() ",
            joint.rigidBody.current?.rotation(),
          );

          console.log("setting to: ", position, orientation);

          console.log("---\n");

          joint.rigidBody.current.setNextKinematicTranslation(position);
          joint.rigidBody.current.setNextKinematicRotation(orientation);
        } else {
          console.error(
            "updateKinematicHand - joint.rigidBody.current not found for kinematicJoint: ",
            joint.name,
          );
          success = false;
          break;
        }
      }
    }

    if (this.wrist.rigidBodies.kinematicWrist.current) {
      this.wrist.rigidBodies.kinematicWrist.current.setNextKinematicTranslation(
        this.wrist.transform.position,
      );
      this.wrist.rigidBodies.kinematicWrist.current.setNextKinematicRotation(
        this.wrist.transform.orientation,
      );
    }

    if (success) {
      this.kinematicHand.ready = success;
    }

    return success;
  }

  private buildTrueHandNoJoints(): boolean {
    let success = true;

    let nextBone: BoneInfo | undefined;

    // for (const bone of this.trueHand.bones) {
    this.trueHand.bones.forEach((bone, i, arr) => {
      // if (!success) return;

      if (i === arr.length - 1 && bone.isTipBone) {
        console.log("Last bone already calculated, skipping");
        return;
      }

      nextBone = arr[i + 1];

      if (!nextBone) {
        console.error("Next bone not found");
        success = false;
        return;
      }

      if (!bone.boxArgs.height) {
        bone.boxArgs.height = this.calculateHeightForBone(
          bone.startJoint.transform.position,
          bone.endJoint.transform.position,
        );
      }

      if (!nextBone.boxArgs.height) {
        nextBone.boxArgs.height = this.calculateHeightForBone(
          nextBone.startJoint.transform.position,
          nextBone.endJoint.transform.position,
        );
      }

      // if (!bone.boxArgs.height) continue;

      if (!bone.refs.trueBoneRef.current) {
        console.warn(
          `buildTrueHandNoJoints - bone.refs.trueBoneRef.current not found for ${bone.name}`,
        );
        success = false;
        return;
      }

      if (!nextBone.refs.trueBoneRef.current) {
        console.error(
          `buildTrueHandNoJoints - nextBone.refs.trueBoneRef.current not found for ${nextBone.name}`,
        );
        success = false;
        return;
      }

      const boneRb = bone.refs.trueBoneRef.current;
      const nextBoneRb = nextBone.refs.trueBoneRef.current;

      // Special case for wrist
      // if (bone.startJoint.name === "wrist") {
      //   console.log("\n--- Special case for wrist ---");
      //   console.log("bone.name: ", bone.name);

      //   const wristJoint = this.trueHand.joints[JointNamesEnum.wrist];

      //   if (!wristJoint) {
      //     console.error("buildTrueHandNoJoints: Wrist joint not found");
      //     success = false;
      //     return;
      //   }

      //   const [, wrist] = wristJoint;

      //   const wristRb = wrist.rigidBody.current;

      //   if (!wristRb) {
      //     console.error("buildTrueHandNoJoints: Wrist rigid body not found");
      //     success = false;
      //     return;
      //   }

      //   // console.log("bottomXRJointName: ", bottomXRJointName);
      //   // console.log("topXRJointName: ", topXRJointName);

      //   const bottomJointData = RAPIER.JointData.spherical(
      //     {
      //       x: 0,
      //       // y: bone.boxArgs.height / 2 + this.trueHandJointRadius,
      //       y: 0,
      //       z: 0,
      //     },
      //     {
      //       x: 0,
      //       y: -bone.boxArgs.height / 2 - this.trueHandJointRadius,
      //       z: 0,
      //     },
      //   );

      //   bottomJointData.stiffness = 1.0e5;
      //   bottomJointData.damping = 1500;

      //   const bottomJoint = this.rapierWorld.createImpulseJoint(
      //     bottomJointData,
      //     wristRb,
      //     boneRb,
      //     true,
      //   );

      //   bone.attachedRapierJoints.bottom = bottomJoint;

      //   const topJointData = RAPIER.JointData.spherical(
      //     // bone
      //     {
      //       x: 0,
      //       y: bone.boxArgs.height / 2 + this.trueHandJointRadius,
      //       z: 0,
      //     },
      //     // wrist
      //     {
      //       x: 0,
      //       y: -nextBone.boxArgs.height / 2 - this.trueHandJointRadius,
      //       z: 0,
      //     },
      //   );

      //   // topJointData.stiffness = 1.0e3;
      //   // topJointData.damping = 0;

      //   const topJoint = this.rapierWorld.createImpulseJoint(
      //     topJointData,
      //     boneRb,
      //     nextBoneRb,
      //     true,
      //   );

      //   bone.attachedRapierJoints.top = topJoint;

      //   return;
      // }

      const bottomJointName = bone.endJoint.name;
      const topJointName = nextBone.startJoint.name;

      /**
       * Now that we have the RB Bone and the RB Joints above and below it, we can now create the rapier joints on them.
       * If the bottom joint is the wrist, we will create a spherical or fixed (testing for now) joint
       * otherwise, we will use the value provided from jointTypeMappings
       */
      const bottomJointType = jointTypeMappings.get(bottomJointName);
      const topJointType = jointTypeMappings.get(topJointName);

      if (!bottomJointType || !topJointType) {
        console.error(
          `Joint type not found for ${bottomJointName} or ${topJointName}`,
        );
        success = false;
        return;
      }

      // continue;

      let bottomJoint: RAPIER.ImpulseJoint | undefined;
      let topJoint: RAPIER.ImpulseJoint | undefined;

      console.log("bottomJointType", bottomJointType);
      console.log("topJointType", topJointType);

      const stiffness = 1.0e5;
      const damping = 300;

      /**
       * For the wrist bones, we are attaching it to
       * the wrist rigidBody
       */
      // if (bone.name.includes("wrist")) {
      //   // const wristRb = this.wrist.rigidBodies.trueWrist.current;
      //   const wristRb = this.wrist.rigidBodies.kinematicWrist.current;

      //   if (wristRb) {
      //     const bottomJointData = RAPIER.JointData.spherical(
      //       // wrist
      //       {
      //         x: 0,
      //         y: 0,
      //         z: 0,
      //       },
      //       // bone
      //       {
      //         x: 0,
      //         y: -bone.boxArgs.height / 2 - this.trueHandJointRadius,
      //         z: 0,
      //       },
      //     );

      //     bottomJointData.stiffness = stiffness;
      //     bottomJointData.damping = damping;

      //     bottomJoint = this.rapierWorld.createImpulseJoint(
      //       bottomJointData,
      //       wristRb,
      //       boneRb,
      //       true,
      //     );

      //     bone.attachedRapierJoints.bottom = bottomJoint;

      //     // const topJointData = RAPIER.JointData.spherical(
      //     //   {
      //     //     x: 0,
      //     //     y: bone.boxArgs.height / 2 + this.trueHandJointRadius,
      //     //     z: 0,
      //     //   },
      //     //   {
      //     //     x: 0,
      //     //     y: -nextBone.boxArgs.height / 2 - this.trueHandJointRadius,
      //     //     z: 0,
      //     //   },
      //     // );

      //     // topJointData.stiffness = stiffness;
      //     // topJointData.damping = damping;

      //     // topJoint = this.rapierWorld.createImpulseJoint(
      //     //   topJointData,
      //     //   boneRb,
      //     //   nextBoneRb,
      //     //   true,
      //     // );

      //     // bone.attachedRapierJoints.top = topJoint;
      //   } else {
      //     console.error("buildTrueHandNoJoints: Wrist rigid body not found");
      //     // success = false;
      //     // return;
      //   }
      // }

      /**
       *
       *
       * RigidBody1 is the "parent" rigid body and RigidBody2 is the "child" rigid body
       * the parent body (rb1) is the one closer to the wrist
       * the child body (rb2) is the one closer to the finger tip
       */
      // Connecting the bottom of the bone and bottom joint
      switch (bottomJointType) {
        case JointType.Spherical: {
          const jointData = RAPIER.JointData.spherical(
            {
              x: 0,
              // y: bone.boxArgs.height / 2,
              y: bone.boxArgs.height / 2 + this.trueHandJointRadius,
              z: 0,
            },
            {
              x: 0,
              // y: -nextBone.boxArgs.height / 2,
              y: -nextBone.boxArgs.height / 2 - this.trueHandJointRadius,
              z: 0,
            },
          );

          jointData.stiffness = stiffness;
          jointData.damping = damping;

          bottomJoint = this.rapierWorld.createImpulseJoint(
            jointData,
            boneRb,
            nextBoneRb,
            true,
          );

          bone.attachedRapierJoints.bottom = bottomJoint;

          break;
        }
        case JointType.Revolute: {
          const jointData = RAPIER.JointData.revolute(
            {
              x: 0,
              // y: bone.boxArgs.height / 2,
              y: bone.boxArgs.height / 2 + this.trueHandJointRadius,
              z: 0,
            },
            {
              x: 0,
              // y: -nextBone.boxArgs.height / 2,
              y: -nextBone.boxArgs.height / 2 - this.trueHandJointRadius,
              z: 0,
            },
            {
              x: 1,
              y: 0,
              z: 0,
            },
          );

          jointData.stiffness = stiffness;
          jointData.damping = damping;

          bottomJoint = this.rapierWorld.createImpulseJoint(
            jointData,
            boneRb,
            nextBoneRb,
            true,
          );

          bone.attachedRapierJoints.bottom = bottomJoint;

          break;
        }
      }
      if (!bone.name.includes("tip"))
        switch (topJointType) {
          case JointType.Spherical: {
            const jointData = RAPIER.JointData.spherical(
              {
                x: 0,
                // y: bone.boxArgs.height / 2,
                y: bone.boxArgs.height / 2 + this.trueHandJointRadius,
                z: 0,
              },
              {
                x: 0,
                // y: -nextBone.boxArgs.height / 2,
                y: -nextBone.boxArgs.height / 2 - this.trueHandJointRadius,
                z: 0,
              },
            );

            jointData.stiffness = stiffness;
            jointData.damping = damping;

            bottomJoint = this.rapierWorld.createImpulseJoint(
              jointData,
              boneRb,
              nextBoneRb,
              true,
            );

            bone.attachedRapierJoints.bottom = bottomJoint;

            break;
          }
          case JointType.Revolute: {
            const jointData = RAPIER.JointData.revolute(
              {
                x: 0,
                // y: bone.boxArgs.height / 2,
                y: bone.boxArgs.height / 2 + this.trueHandJointRadius,
                z: 0,
              },
              {
                x: 0,
                // y: -nextBone.boxArgs.height / 2,
                y: -nextBone.boxArgs.height / 2 - this.trueHandJointRadius,
                z: 0,
              },
              {
                x: 1,
                y: 0,
                z: 0,
              },
            );

            jointData.stiffness = stiffness;
            jointData.damping = damping;

            bottomJoint = this.rapierWorld.createImpulseJoint(
              jointData,
              boneRb,
              nextBoneRb,
              true,
            );

            bone.attachedRapierJoints.bottom = bottomJoint;

            break;
          }
          case JointType.Fixed: {
            const jointData = RAPIER.JointData.fixed(
              // Bone
              {
                x: 0,
                // y: bone.boxArgs.height / 2,
                y: bone.boxArgs.height / 2 + this.trueHandJointRadius,
                z: 0,
              },
              // Joint
              {
                x: 0,
                y: 0,
                z: 0,
                w: 1,
              },

              {
                x: 0,
                // y: -nextBone.boxArgs.height / 2,
                y: -nextBone.boxArgs.height / 2 - this.trueHandJointRadius,
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

            jointData.stiffness = stiffness;
            jointData.damping = damping;

            topJoint = this.rapierWorld.createImpulseJoint(
              jointData,
              boneRb,
              nextBoneRb,
              true,
            );

            bone.attachedRapierJoints.top = topJoint;

            break;
          }
        }
    });

    this.trueHand.ready = success;

    return success;
  }

  private buildTrueHand(): boolean {
    let success = true;

    // if (!this.kinematicWrist.current) {
    //   console.error("KinematicWrist not found");
    //   success = false;
    //   return success;
    // }

    // const wristRb = this.kinematicWrist.current;

    for (const bone of this.trueHand.bones) {
      if (!bone.boxArgs.height) {
        bone.boxArgs.height = this.calculateHeightForBone(
          bone.startJoint.transform.position,
          bone.endJoint.transform.position,
        );
      }

      // if (!bone.boxArgs.height) continue;

      if (!bone.refs.trueBoneRef.current) {
        console.error(
          `buildTrueHand - bone.refs.trueBoneRef.current not found for ${bone.name}`,
        );
        success = false;
        break;
      }

      const boneRb = bone.refs.trueBoneRef.current;

      const bottomXRJointName = bone.startJoint.name;
      const bottomJointIndex = JointNamesEnum[bottomXRJointName];

      const topXRJointName = bone.endJoint.name;
      const topJointIndex = JointNamesEnum[topXRJointName];

      const bottomTrueJoint = this.trueHand.joints[bottomJointIndex];
      const topTrueJoint = this.trueHand.joints[topJointIndex];

      if (!bottomTrueJoint || !topTrueJoint) {
        console.error(
          `TrueHandJointInfo not found for ${bottomXRJointName} or ${topXRJointName}`,
        );
        success = false;
        break;
      }

      const [, bottomJointInfo] = bottomTrueJoint;
      const [, topJointInfo] = topTrueJoint;

      /**
       * Now that we have the RB Bone and the RB Joints above and below it, we can now create the rapier joints on them.
       * If the bottom joint is the wrist, we will create a spherical or fixed (testing for now) joint
       * otherwise, we will use the value provided from jointTypeMappings
       */
      const bottomJointType = jointTypeMappings.get(bottomXRJointName);
      const topJointType = jointTypeMappings.get(topXRJointName);

      if (!bottomJointType || !topJointType) {
        console.error(
          `Joint type not found for ${bottomXRJointName} or ${topXRJointName}`,
        );
        success = false;
        break;
      }

      if (
        !bottomJointInfo.rigidBody.current ||
        !topJointInfo.rigidBody.current
      ) {
        console.error(
          `RigidBody not found for ${bottomXRJointName} or ${topXRJointName} during bone link creation`,
        );
        success = false;
        break;
      }

      const bottomJointRb = bottomJointInfo.rigidBody.current;
      const topJointRb = topJointInfo.rigidBody.current;

      /**
       * RigidBody1 is the "parent" rigid body and RigidBody2 is the "child" rigid body
       * the parent body (rb1) is the one closer to the wrist
       * the child body (rb2) is the one closer to the finger tip
       */

      // continue;

      // Special case for wrist
      if (bottomXRJointName === "wrist") {
        console.log("\n--- Special case for wrist ---");
        console.log("bone.name: ", bone.name);
        console.log("bottomXRJointName: ", bottomXRJointName);
        console.log("topXRJointName: ", topXRJointName);

        const jointData = RAPIER.JointData.spherical(ORIGIN, {
          x: 0,
          y: -bone.boxArgs.height / 2 - this.trueHandJointRadius,
          z: 0,
        });

        jointData.stiffness = 1.0e5;
        jointData.damping = 1500;

        const bottomJoint = this.rapierWorld.createImpulseJoint(
          jointData,
          bottomJointRb,
          boneRb,
          true,
        );

        bone.attachedRapierJoints.bottom = bottomJoint;

        const topJointData = RAPIER.JointData.spherical(
          // bone
          {
            x: 0,
            y: bone.boxArgs.height / 2,
            z: 0,
          },
          // wrist
          {
            x: 0,
            y: -this.trueHandJointRadius,
            z: 0,
          },
        );

        // topJointData.stiffness = 1.0e3;
        // topJointData.damping = 0;

        const topJoint = this.rapierWorld.createImpulseJoint(
          topJointData,
          boneRb,
          topJointRb,
          true,
        );

        bone.attachedRapierJoints.top = topJoint;

        continue;
      }

      let bottomJoint: RAPIER.ImpulseJoint | undefined;
      let topJoint: RAPIER.ImpulseJoint | undefined;

      // Connecting the bottom of the bone and bottom joint
      switch (bottomJointType) {
        case JointType.Spherical: {
          const jointData = RAPIER.JointData.spherical(ORIGIN, {
            x: 0,
            y: -bone.boxArgs.height / 2 - this.trueHandJointRadius,
            z: 0,
          });

          jointData.stiffness = 1.0e3;
          jointData.damping = 150;

          bottomJoint = this.rapierWorld.createImpulseJoint(
            jointData,
            bottomJointRb,
            boneRb,
            true,
          );

          bone.attachedRapierJoints.bottom = bottomJoint;

          break;
        }
        case JointType.Revolute: {
          const jointData = RAPIER.JointData.revolute(
            ORIGIN,
            {
              x: 0,
              y: -bone.boxArgs.height / 2 - this.trueHandJointRadius,
              z: 0,
            },
            {
              x: 1,
              y: 0,
              z: 0,
            },
          );

          jointData.stiffness = 1.0e3;
          jointData.damping = 150;

          bottomJoint = this.rapierWorld.createImpulseJoint(
            jointData,
            bottomJointRb,
            boneRb,
            true,
          );

          bone.attachedRapierJoints.bottom = bottomJoint;

          break;
        }
      }

      // Connecting the top of the bone and top joint
      switch (topJointType) {
        case JointType.Spherical: {
          const jointData = RAPIER.JointData.spherical(
            // Bone
            {
              x: 0,
              y: bone.boxArgs.height / 2 + this.trueHandJointRadius,
              z: 0,
            },
            // Joint
            ORIGIN,
          );

          jointData.stiffness = 1.0e3;
          jointData.damping = 150;

          topJoint = this.rapierWorld.createImpulseJoint(
            jointData,
            boneRb,
            topJointRb,
            true,
          );

          bone.attachedRapierJoints.top = topJoint;

          break;
        }
        case JointType.Revolute: {
          const jointData = RAPIER.JointData.revolute(
            // Bone
            {
              x: 0,
              y: bone.boxArgs.height / 2,
              z: 0,
            },
            // Joint
            {
              x: 0,
              y: -this.trueHandJointRadius,
              z: 0,
            },
            {
              x: 1,
              y: 0,
              z: 0,
            },
          );

          jointData.stiffness = 1.0e3;
          jointData.damping = 150;

          topJoint = this.rapierWorld.createImpulseJoint(
            jointData,
            boneRb,
            topJointRb,
            true,
          );

          break;
        }
        case JointType.Fixed: {
          const jointData = RAPIER.JointData.fixed(
            // Bone
            {
              x: 0,
              y: bone.boxArgs.height / 2 + this.trueHandJointRadius,
              z: 0,
            },
            // Joint
            {
              x: 0,
              y: 0,
              z: 0,
              w: 1,
            },
            {
              x: 0,
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

          jointData.stiffness = 1.0e3;
          jointData.damping = 150;

          topJoint = this.rapierWorld.createImpulseJoint(
            jointData,
            boneRb,
            topJointRb,
            true,
          );

          bone.attachedRapierJoints.top = topJoint;

          break;
        }
      }

      // console.log("bottomJoint", bottomJoint);
      // console.log("topJoint", topJoint);

      // if (bottomJoint) bone.attachedRapierJoints.bottom = bottomJoint;
      // if (topJoint) bone.attachedRapierJoints.top = topJoint;
    }

    this.trueHand.ready = success;

    return success;
  }

  private linkWrists(): boolean {
    const trueWristRb = this.wrist.rigidBodies.trueWrist.current;
    const kinematicWristRb = this.wrist.rigidBodies.kinematicWrist.current;

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
        x: 0,
        y: -1,
        z: 0,
      },
      AxesMask,
    );

    const joint2 = this.rapierWorld.createImpulseJoint(
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
      // {
      //   x: kinematicWristPosition.x,
      //   y: kinematicWristPosition.y,
      //   z: kinematicWristPosition.z,
      // },
    );

    const joint = this.rapierWorld.createImpulseJoint(
      springJointParams,
      kinematicWristRb,
      trueWristRb,
      true,
    );

    // kinematicWrist.attachedRapierJoints.spring = joint;
    // kinematicWrist.attachedRapierJoints.generic = joint2;

    // trueWrist.attachedRapierJoints.spring = joint;
    // trueWrist.attachedRapierJoints.generic = joint2;

    // if (joint && joint2) {
    if (joint) {
      console.log("---------------- Wrists linked -------------------");
      // this.trueHand.handsLinked = true;
      // this.kinematicHand.handsLinked = true;
    }

    return true;
  }

  private synchronizeHands(
    syncBones: boolean,
    syncJoints: boolean,
    syncWrists: boolean,
  ) {
    const stiffness = 1.0e6;
    const mass = 5;

    let handsLinked = true;

    if (syncJoints) {
      for (const [name, trueJointInfo] of this.trueHand.joints) {
        // if (name !== "wrist") continue;

        // if (name === "wrist") continue;

        const kinematicJointArr = this.kinematicHand.joints[JointOrder[name]];

        if (!kinematicJointArr) {
          console.error(
            `Kinematic Joint for ${name} not found in the kinematic hand`,
          );
          handsLinked = false;
          break;
        }

        const [, kinematicJoint] = kinematicJointArr;

        const kinematicJointRb = kinematicJoint.rigidBody.current;
        const trueJointRb = trueJointInfo.rigidBody.current;

        if (!kinematicJointRb || !trueJointRb) {
          console.error(
            `Kinematic Joint for ${name} or True Joint for ${name} not found in the kinematic hand`,
          );
          handsLinked = false;
          break;
        }

        const kinematicJointPosition = kinematicJointRb.translation();
        // const kinematicJointPosition = kinematicJoint.transform.position;

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

        // const genericJoint = this.rapierWorld.createImpulseJoint(
        //   genericJointParams,
        //   kinematicJointRb,
        //   trueJointRb,
        //   true,
        // );

        const springJointParams = RAPIER.JointData.spring(
          0,
          stiffness,
          150,
          // where the child RB should be

          {
            x: 0,
            y: 0,
            z: 0,
          },
          {
            x: kinematicJointPosition.x,
            y: kinematicJointPosition.y,
            z: kinematicJointPosition.z,
          },
        );

        const springJoint = this.rapierWorld.createImpulseJoint(
          springJointParams,
          kinematicJointRb,
          trueJointRb,
          true,
        );

        // console.log("genericJoint", genericJoint);
        // console.log("springJoint", springJoint);

        kinematicJoint.attachedRapierJoints.spring = springJoint;
        // kinematicJoint.attachedRapierJoints.generic = genericJoint;

        console.log(
          "kinematicJoint.attachedRapierJoints",
          kinematicJoint.attachedRapierJoints,
        );
      }
    }

    if (syncBones) {
      for (const bone of this.trueHand.bones) {
        const kinematicBone = bone.refs.kinematicBoneRef.current;
        const trueBone = bone.refs.trueBoneRef.current;

        if (!handsLinked) return;

        if (!kinematicBone) {
          console.log("bone.kinematicBoneRef.current not set");
          handsLinked = false;
          break;
        }
        if (!trueBone) {
          console.log("bone.trueBoneRef.current not set");
          handsLinked = false;
          break;
        }

        const springJointParams = RAPIER.JointData.spring(
          0,
          stiffness,
          100,
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
            x: 0,
            y: -1,
            z: 0,
          },
          AxesMask,
        );

        const genericJoint = this.rapierWorld.createImpulseJoint(
          genericJointParams,
          kinematicBone,
          trueBone,
          true,
        );

        /**
         *
         *  FIX: THE BONES ARE PLACED IN DIFFERENT SLOTS
         */
        const springJoint = this.rapierWorld.createImpulseJoint(
          springJointParams,
          kinematicBone,
          trueBone,
          true,
        );

        console.log("genericJoint", genericJoint);
        console.log("springJoint", springJoint);

        bone.attachedRapierJoints.spring = springJoint;
        bone.attachedRapierJoints.generic = genericJoint;
      }
    }

    if (syncWrists) {
      // handsLinked = this.linkWrists();
      this.linkWrists();
    }

    // this.handsLinked = handsLinked;

    this.kinematicHand.handsLinked = handsLinked;
    this.trueHand.handsLinked = handsLinked;

    return handsLinked;
  }

  private calculateHeightForBone(
    jointOne: THREE.Vector3,
    jointTwo: THREE.Vector3,
  ) {
    return jointOne.distanceTo(jointTwo);
  }

  private updateKinematicJointProperties(
    joint: KinematicJointInfo,
    position: Vector3Object,
    orientation: Vector4Object,
  ) {
    joint.transform.position.set(position.x, position.y, position.z);

    joint.transform.orientation.set(
      orientation.x,
      orientation.y,
      orientation.z,
      orientation.w,
    );

    joint.rigidBody.current?.setNextKinematicTranslation(position);
    joint.rigidBody.current?.setNextKinematicRotation(orientation);
  }

  private updateSensor(
    palmJoint: PalmJointNames,
    position: Vector3Object,
    orientation: Vector4Object,
  ) {
    if (!this.sensorJoints) {
      return;
    }

    const palmProperties = this.sensorJoints.get(palmJoint);

    if (!palmProperties) {
      throw new Error(`Palm joint ${palmJoint} not found in sensorJoints`);
    }

    // palmProperties.position.set(position.x, position.y, position.z);
    // palmProperties.orientation.set(
    //   orientation.x,
    //   orientation.y,
    //   orientation.z,
    //   orientation.w,
    // );

    // palmProperties.joints.
  }

  private createSpringLigaments() {
    let lastBone: BoneInfo | undefined;
    console.log(
      `\n---------- ${this.handedness} Bone - createBoneLinks --------`,
    );

    let rapierJoint: RAPIER.JointData | undefined;
    let complete = true;

    this.trueHand.bones.forEach((bone) => {
      if (bone.name.includes("wrist")) {
        lastBone = bone;
        return;
      }

      if (!lastBone) {
        console.log("lastBone not set");
        lastBone = bone;
        return;
      }

      const {
        height: lastBoneHeight,
        width: lastBoneWidth,
        depth: lastBoneDepth,
      } = lastBone.boxArgs;
      const {
        height: curBoneHeight,
        width: curBoneWidth,
        depth: curBoneDepth,
      } = bone.boxArgs;

      if (!lastBoneHeight || !curBoneHeight) {
        console.log("Bone height not set");
        complete = false;
        return;
      }

      const lastBoneTrueBone = lastBone.refs.trueBoneRef.current;
      const trueBone = bone.refs.trueBoneRef.current;

      if (!lastBoneTrueBone) {
        console.log("lastBoneTrueBone not set");
        complete = false;
        return;
      }

      if (!trueBone) {
        console.log("trueBone not set");
        complete = false;
        return;
      }

      const ligamentLength = lastBoneHeight / 2 + curBoneHeight / 2;

      console.log("ligamentLength", ligamentLength);
      console.log("lastBone.boxArgs", lastBone.boxArgs);
      console.log("bone.boxArgs", bone.boxArgs);

      // Right side of bones
      const ligamentData1 = RAPIER.JointData.spring(
        ligamentLength,
        1.0e5,
        0.001,
        // lastBone
        {
          x: lastBoneWidth / 2,
          y: 0,
          z: 0,
        },
        // curBone
        {
          x: curBoneWidth / 2,
          y: 0,
          z: 0,
        },
      );

      const ligamentData2 = RAPIER.JointData.spring(
        ligamentLength,
        1.0e5,
        0.001,
        // lastBone
        {
          x: -lastBoneWidth / 2,
          y: 0,
          z: 0,
        },
        // curBone
        {
          x: -curBoneWidth / 2,
          y: 0,
          z: 0,
        },
      );

      const j = this.rapierWorld.createImpulseJoint(
        ligamentData1,
        lastBoneTrueBone,
        trueBone,
        true,
      );

      console.log("j", j);

      const k = this.rapierWorld.createImpulseJoint(
        ligamentData2,
        lastBoneTrueBone,
        trueBone,
        true,
      );

      lastBone = bone;
    });

    // complete && this.notifyUpdate();
  }

  private createCompleteFingers() {
    // let rigidBodyDesc: RAPIER.RigidBodyDesc;
    // let rigidBody: RAPIER.RigidBody;

    console.log("-----INSIDE createCompleteFingers-----");
    console.log("this.completeFingerBones", this.completeFingerBones);

    this.completeFingerBones.forEach(([_, fingerBones], i) => {
      const rigidBodyDesc = RAPIER.RigidBodyDesc.dynamic()
        .setCanSleep(false)
        .setGravityScale(0.0)
        .setAdditionalSolverIterations(5)
        .setCcdEnabled(true);

      const rigidBody = this.rapierWorld.createRigidBody(rigidBodyDesc);

      // fingerBones.fingerRigidBody = rigidBody;

      fingerBones.bones.forEach((bone, i, arr) => {
        switch (i) {
          case 0: {
            const colliderDesc = RAPIER.ColliderDesc.cylinder(
              bone.boxArgs.width / 2,
              bone.boxArgs.width / 2,
            )
              .setFriction(1.0)
              .setRestitution(0.0)
              .setDensity(5);

            const collider = this.rapierWorld.createCollider(
              colliderDesc,
              rigidBody,
            );

            // bone.colliderRef = React.createRef<RapierCollider>();
            // bone.refs.trueBoneColliderRef = collider;

            break;
          }

          case 1: {
            const colliderDesc = RAPIER.ColliderDesc.cylinder(
              bone.boxArgs.width / 2,
              bone.boxArgs.width / 2,
            )
              .setFriction(1.0)
              .setRestitution(0.0)
              .setDensity(5);

            const collider = this.rapierWorld.createCollider(
              colliderDesc,
              rigidBody,
            );

            // bone.collider = collider;

            break;
          }

          case 2: {
            const colliderDesc = RAPIER.ColliderDesc.cylinder(
              bone.boxArgs.width / 2,
              bone.boxArgs.width / 2,
            )
              .setFriction(1.0)
              .setRestitution(0.0)
              .setDensity(5);

            const collider = this.rapierWorld.createCollider(
              colliderDesc,
              rigidBody,
            );

            // bone.collider = collider;

            break;
          }

          case 3: {
            const colliderDesc = RAPIER.ColliderDesc.cylinder(
              bone.boxArgs.width / 2,
              bone.boxArgs.width / 2,
            )
              .setFriction(1.0)
              .setRestitution(0.0)
              .setDensity(5);

            const collider = this.rapierWorld.createCollider(
              colliderDesc,
              rigidBody,
            );

            // bone.collider = collider;

            break;
          }

          case 4: {
            const colliderDesc = RAPIER.ColliderDesc.cylinder(
              bone.boxArgs.width / 2,
              bone.boxArgs.width / 2,
            )
              .setFriction(1.0)
              .setRestitution(0.0)
              .setDensity(5);

            const collider = this.rapierWorld.createCollider(
              colliderDesc,
              rigidBody,
            );

            // bone.collider = collider;

            break;
          }
        }
      });
    });

    // fingerOrder.forEach((fingerName, i) => {
    //   const [name, fingerBones] = this.completeFingerBones[i]!;

    //   const rigidBodyDesc = RAPIER.RigidBodyDesc.dynamic()
    //     .setCanSleep(false)
    //     .setGravityScale(0.0)
    //     .setAdditionalSolverIterations(5)
    //     .setCcdEnabled(true);

    //   const rigidBody = this.rapierWorld.createRigidBody(rigidBodyDesc);

    //   // fingerBones.fingerRigidBody = rigidBody;

    //   fingerBones.bones.forEach((bone, i, arr) => {
    //     switch (i) {
    //       case 0: {
    //         const colliderDesc = RAPIER.ColliderDesc.cylinder(
    //           bone.boxArgs.width / 2,
    //           bone.boxArgs.width / 2,
    //         )
    //           .setFriction(1.0)
    //           .setRestitution(0.0)
    //           .setDensity(5);

    //         const collider = this.rapierWorld.createCollider(
    //           colliderDesc,
    //           rigidBody,
    //         );

    //         // bone.colliderRef = React.createRef<RapierCollider>();
    //         // bone.refs.trueBoneColliderRef = collider;

    //         break;
    //       }

    //       case 1: {
    //         const colliderDesc = RAPIER.ColliderDesc.cylinder(
    //           bone.boxArgs.width / 2,
    //           bone.boxArgs.width / 2,
    //         )
    //           .setFriction(1.0)
    //           .setRestitution(0.0)
    //           .setDensity(5);

    //         const collider = this.rapierWorld.createCollider(
    //           colliderDesc,
    //           rigidBody,
    //         );

    //         // bone.collider = collider;

    //         break;
    //       }

    //       case 2: {
    //         const colliderDesc = RAPIER.ColliderDesc.cylinder(
    //           bone.boxArgs.width / 2,
    //           bone.boxArgs.width / 2,
    //         )
    //           .setFriction(1.0)
    //           .setRestitution(0.0)
    //           .setDensity(5);

    //         const collider = this.rapierWorld.createCollider(
    //           colliderDesc,
    //           rigidBody,
    //         );

    //         // bone.collider = collider;

    //         break;
    //       }

    //       case 3: {
    //         const colliderDesc = RAPIER.ColliderDesc.cylinder(
    //           bone.boxArgs.width / 2,
    //           bone.boxArgs.width / 2,
    //         )
    //           .setFriction(1.0)
    //           .setRestitution(0.0)
    //           .setDensity(5);

    //         const collider = this.rapierWorld.createCollider(
    //           colliderDesc,
    //           rigidBody,
    //         );

    //         // bone.collider = collider;

    //         break;
    //       }

    //       case 4: {
    //         const colliderDesc = RAPIER.ColliderDesc.cylinder(
    //           bone.boxArgs.width / 2,
    //           bone.boxArgs.width / 2,
    //         )
    //           .setFriction(1.0)
    //           .setRestitution(0.0)
    //           .setDensity(5);

    //         const collider = this.rapierWorld.createCollider(
    //           colliderDesc,
    //           rigidBody,
    //         );

    //         // bone.collider = collider;

    //         break;
    //       }
    //     }
    //   });
    // });

    // this.completeFingers.forEach((fingerBones, i) => {
    //   rigidBodyDesc = RAPIER.RigidBodyDesc.dynamic()
    //     .setCanSleep(false)
    //     .setGravityScale(0.0)
    //     .setAdditionalSolverIterations(5)
    //     .setCcdEnabled(true);

    //   rigidBody = this.rapierWorld.createRigidBody(rigidBodyDesc);

    //   fingerBones.map((bone, i, arr) => {
    //     switch (i) {
    //       case 0: {
    //         const colliderDesc = RAPIER.ColliderDesc.cylinder(
    //           bone.boxArgs.width / 2,
    //           bone.boxArgs.width / 2,
    //         )
    //           .setFriction(1.0)
    //           .setRestitution(0.0)
    //           .setDensity(5);

    //         collider1 = this.rapierWorld.createCollider(
    //           colliderDesc,
    //           rigidBody,
    //         );

    //         break;
    //       }
    //     }
    //   });

    //   // rigidBody = this.rapierWorld.createRigidBody(rigidBodyDesc);
    // });
  }

  private linkFingersToWrist() {
    // const wristJoint = wrist.transform.position;

    let complete = true;

    this.completeFingerBones.forEach(([_, fingerBones], i) => {
      const fingerRigidBody = fingerBones.fingerRefs.kinematicFinger.current;

      let yAnchor = 0;

      fingerBones.bones.forEach((bone) => {
        if (
          bone.name.includes("tip") ||
          bone.name.includes("distal") ||
          bone.name.includes("intermediate")
        )
          return;

        yAnchor -= bone.boxArgs.height!;
      });

      if (!fingerRigidBody) {
        console.log("Finger rigid body not found");
        complete = false;
        return;
        // throw new Error("Finger rigid body not found");
      }

      const jointData = RAPIER.JointData.spherical(
        {
          x: 0,
          y: 0,
          z: 0,
        },
        {
          x: 0,
          y: yAnchor,
          z: 0,
        },
      );

      // const joint = this.rapierWorld.createImpulseJoint(
      //   jointData,
      //   this.kinematicWrist.current!,
      //   fingerRigidBody,
      //   true,
      // );
    });

    this.ligamentsCreated = complete;
  }

  private updateFingers() {
    console.log("-----INSIDE updateFingers-----");
    console.log("this.completeFingerBones", this.completeFingerBones);

    this.completeFingerBones.forEach(([_, fingerBones], i) => {
      // Calculate the average position of all bones in the finger
      const { averagePosition, averageOrientation } = fingerBones.bones.reduce(
        (acc, bone) => {
          const startJointPosition = bone.startJoint.transform.position;
          const endJointPosition = bone.endJoint.transform.position;
          const boneCenter = startJointPosition
            .clone()
            .lerp(endJointPosition, 0.5);

          // const newP = acc.averagePosition.add(boneCenter);

          // _direction.copy(startJointPosition).sub(endJointPosition).normalize();

          // const vectorIsCorrect =
          //   _vector.x === 0 && _vector.y === -1 && _vector.z === 0;

          // // _quaternion.setFromUnitVectors(
          // //   vectorIsCorrect ? _vector : _vector.set(0, -1, 0),
          // //   _direction,
          // // );

          // bone.transform.position
          //   .copy(startJointPosition)
          //   .lerpVectors(startJointPosition, endJointPosition, 0.5);

          // bone.transform.orientation.setFromUnitVectors(
          //   vectorIsCorrect ? _vector : _vector.set(0, -1, 0),
          //   _direction,
          // );

          // bone.refs.trueBoneColliderRef!.current?.setTranslationWrtParent({
          //   x: bone.transform.position.x,
          //   y: bone.transform.position.y,
          //   z: bone.transform.position.z,
          // });

          // bone.refs.trueBoneColliderRef!.current?.setRotationWrtParent({
          //   x: bone.transform.orientation.x,
          //   y: bone.transform.orientation.y,
          //   z: bone.transform.orientation.z,
          //   w: bone.transform.orientation.w,
          // });

          // bone.refs.trueBoneColliderRef!.current?.setTranslation({
          //   x: bone.transform.position.x,
          //   y: bone.transform.position.y,
          //   z: bone.transform.position.z,
          // });

          // bone.refs.trueBoneColliderRef!.current?.setRotation({
          //   x: bone.transform.orientation.x,
          //   y: bone.transform.orientation.y,
          //   z: bone.transform.orientation.z,
          //   w: bone.transform.orientation.w,
          // });
          // Setting the orientation of the bone

          const shouldSetOrientation =
            bone.name.includes("proximal") && bone.name.includes("phalanx");

          return {
            averagePosition: acc.averagePosition.add(boneCenter),
            averageOrientation: shouldSetOrientation
              ? bone.transform.orientation
              : acc.averageOrientation,
          };

          // return acc.add(boneCenter);
        },
        {
          averagePosition: _position.set(0, 0, 0),
          averageOrientation: _quaternion.set(0, 0, 0, 1),
        },
      );

      averagePosition.divideScalar(fingerBones.bones.length);

      // using the metacarpal--phalanx-proximal bone as the representative bone
      const representativeOrientation =
        fingerBones.bones[1]!.transform.orientation;

      // Setting the KinematicFinger Position/Orientation
      const fingerRigidBody = fingerBones.fingerRefs.kinematicFinger.current;
      if (fingerRigidBody) {
        console.log("averagePosition", averagePosition);
        console.log("representativeOrientation", representativeOrientation);
        console.log(
          "fingerBones.bones[1]!.transform.position",
          fingerBones.bones[1]!.transform.position,
        );

        // fingerRigidBody.setNextKinematicTranslation(averagePosition);
        // fingerRigidBody.setNextKinematicRotation(representativeOrientation);
      }
    });
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

    // this.rigidBodyStates.set(rigidBody.handle, rbState);
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
    this.trueHand.bones.forEach((bone) => {
      if (bone.attachedRapierJoints.spring) {
        // bone.attachedRapierJoints.spring.remove();
        this.rapierWorld.removeImpulseJoint(
          bone.attachedRapierJoints.spring,
          false,
        );
      }
      if (bone.attachedRapierJoints.generic) {
        // bone.attachedRapierJoints.generic.remove();
        this.rapierWorld.removeImpulseJoint(
          bone.attachedRapierJoints.generic,
          false,
        );
      }
      if (bone.attachedRapierJoints.bottom) {
        // bone.attachedRapierJoints.bottom.remove();
        this.rapierWorld.removeImpulseJoint(
          bone.attachedRapierJoints.bottom,
          false,
        );
      }
      if (bone.attachedRapierJoints.top) {
        // bone.attachedRapierJoints.top.remove();
        this.rapierWorld.removeImpulseJoint(
          bone.attachedRapierJoints.top,
          false,
        );
      }

      if (bone.refs.trueBoneRef.current) {
        this.rapierWorld.removeRigidBody(bone.refs.trueBoneRef.current);
      }

      if (bone.refs.kinematicBoneRef.current) {
        this.rapierWorld.removeRigidBody(bone.refs.kinematicBoneRef.current);
      }
    });

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
    this.trueHand = {
      ready: false,
      handsLinked: false,
      joints: [],
      bones: [],
    };
    this.kinematicHand = {
      ready: false,
      handsLinked: false,
      joints: [],
      bones: [],
    };
    this.completeFingerBones = [];
    this.ligamentsCreated = false;
    this.visible = false;
    this.intializedHand = false;
    this.handsLinked = false;
  }
}
