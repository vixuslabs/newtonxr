import type { UUID } from "crypto";
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
import { Quaternion, Vector3 } from "three";
import * as THREE from "three";

import { JointType } from "../hooks/useHandHooks.js";
import {
  // _direction,
  // _position,
  // _quaternion,
  // _object,
  // _position,
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

interface BBoneInfo {
  name: HandBoneNames;
  id: UUID;
  topJoint: JointInfo;
  bottomJoint: JointInfo;
  kinematic: {
    rigidBody: RAPIER.RigidBody;
    bottomJoint: JointInfo;
    topJoint: JointInfo;
    connectedImpulseJoints: AttachedRapierJoints;
  };
}

export interface BoneInfo {
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
  wrist: Wrist;

  handGroup: THREE.Group;
  boneProps: Map<HandBoneNames, NewtonBoneProps>;
  jointData: Map<XRHandJoint, JointData>;
  boneData: Map<HandBoneNames, BoneData>;
  impulseJoints: Map<HandBoneNames | XRHandJoint, RAPIER.ImpulseJoint>;
  boneImpulseJoints: Map<HandBoneNames, BoneImpulseJoints>;
  rigidBodyStates: RigidBodyStateMap;
  colliderStates: ColliderStateMap;

  // kinematicBones: Map<HandBoneNames, BoneInfo>;
  // trueBones: Map<HandBoneNames, BoneInfo>;
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
    // this.kinematicBones = new Map<HandBoneNames, BoneInfo>();
    // this.trueBones = new Map<HandBoneNames, BoneInfo>();

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
        rigidBodyInfo: null,
        isTipBone: isTipJointName(endJointName),
        connectedImpulseJoints: {},
      };

      this.boneProps.set(boneName, {
        width: 0.004,
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
      );
    }

    if (this.boneData.size === 0) {
      console.log("updateHandOnFrame - Creating bones now");
      this.setBoneHeights();
      this.buildHand();
      this.linkBones();
      this.notifyUpdate();
    }

    if (options.updateRapier) {
      this.updateHands();
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

      const pos = kinematicJointRb.translation();

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

      const genericImpulseJoint = this.rapierWorld.createImpulseJoint(
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

    return true;
  }

  private calculateHeightForBone(
    jointOne: THREE.Vector3,
    jointTwo: THREE.Vector3,
  ) {
    return jointOne.distanceTo(jointTwo);
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
