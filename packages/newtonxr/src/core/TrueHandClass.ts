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
import { WorldStepCallback } from "@react-three/rapier";
// import { quat, vec3 } from "@react-three/rapier";
import { Bone, Quaternion, Vector3 } from "three";
import { XRHandModel } from "three/examples/jsm/Addons.js";

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

const boneNames: HandBoneNames[] = [
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

interface RapierBoneRigidBody {
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
  transform: RapierBoneRigidBody;
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

export default class Newton {
  handedness: XRHandedness;
  intializedHand: boolean;
  visible: boolean;
  handsLinked: boolean;
  ligamentsCreated: boolean;
  handsBuilt: boolean;
  // kinematicWrist: React.RefObject<RapierRigidBody>;
  trueHand: TrueHand;
  kinematicHand: KinematicHand;
  completeFingers: BoneInfo[][];
  completeFingerBones: CompleteFingerBones;
  xrJoints: Map<XRHandJoint, JointInfo>;
  sensorJoints: Map<PalmJointNames, PalmProperties> | undefined;
  rapierWorld: World;

  private updateCallback?: () => void;

  constructor({ handedness, rapierWorld, withSensor = true }: TrueHandOptions) {
    this.rapierWorld = rapierWorld;
    this.handedness = handedness;
    this.visible = false;
    this.handsLinked = false;
    this.intializedHand = false;
    this.ligamentsCreated = false;
    this.handsBuilt = false;
    // this.kinematicWrist = React.createRef<RapierRigidBody>();
    this.xrJoints = new Map<XRHandJoint, JointInfo>();
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

      this.updateXRJoints(
        jointSpace.jointName,
        startJointPose.transform.position,
        startJointPose.transform.orientation,
      );
    }

    if (options.updateRapier) {
      // this.updateRapierBones();
      this.updateKinematicHand(false, true);
    }

    if (!this.handsBuilt) {
      console.log("updateHandOnFrame - Creating ligaments now");
      // this.createBoneLinks();

      this.updateKinematicHand(false, true);
      this.buildTrueHand();

      if (this.kinematicHand.ready && this.trueHand.ready) {
        this.handsBuilt = true;
      }
    }

    if (!this.handsLinked) {
      console.log("updateHandOnFrame - Linking bones now");
      // this.linkWrists();
      this.synchronizeHands(false, true);

      if (this.trueHand.handsLinked && this.kinematicHand.handsLinked) {
        this.handsLinked = true;
      }
    }

    this.notifyUpdate();
  }

  private updateXRJoints(
    jointName: XRHandJoint,
    position: Vector3Object,
    orientation: Vector4Object,
    updateKinematicJoint = true,
  ) {
    const xrJoint = this.xrJoints.get(jointName);

    if (xrJoint) {
      xrJoint.transform.position.set(position.x, position.y, position.z);
      xrJoint.transform.orientation.set(
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
          `updateXRJoints: Kinematic joint for ${jointName} not found in this.kinematicHand.joints`,
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
      this.kinematicHand.bones.forEach((bone) => {
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
          .copy(startJointPosition)
          .lerpVectors(startJointPosition, endJointPosition, 0.5);

        _direction.copy(startJointPosition).sub(endJointPosition).normalize();

        const vectorIsCorrect =
          _vector.x === 0 && _vector.y === -1 && _vector.z === 0;

        bone.transform.orientation.setFromUnitVectors(
          vectorIsCorrect ? _vector : _vector.set(0, -1, 0),
          _direction,
        );

        // Update bone transform
        if (bone.refs.kinematicBoneRef.current) {
          bone.refs.kinematicBoneRef.current.setNextKinematicTranslation(
            bone.transform.position,
          );
          bone.refs.kinematicBoneRef.current.setNextKinematicRotation(
            bone.transform.orientation,
          );
        } else {
          console.error("RapierRigidBody not found for kinematicBone: ", bone);
          success = false;
        }
      });

    if (updateJoints) {
      for (const [name, joint] of this.kinematicHand.joints) {
        // if (name !== "wrist") continue;
        const position = joint.transform.position;
        const orientation = joint.transform.orientation;

        if (joint.rigidBody.current) {
          // console.log("\n--------");
          // console.log(
          //   "updateKinematicHand - joint.rigidBody.current.translation() ",
          //   joint.rigidBody.current?.translation(),
          // );
          // console.log(
          //   "updateKinematicHand - joint.rigidBody.current.rotation() ",
          //   joint.rigidBody.current?.rotation(),
          // );

          // console.log("setting to: ", position, orientation);

          // console.log("---\n");

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

    if (success) {
      this.kinematicHand.ready = success;
    }

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
    const kinematicWristArr = this.kinematicHand.joints[JointNamesEnum.wrist];

    if (!kinematicWristArr) {
      console.error(
        "linkWrists: this.kinematicHand.joints[JointNamesEnum.wrist] not found",
      );
      return false;
    }

    const [, kinematicWrist] = kinematicWristArr;

    const kinematicWristRb = kinematicWrist.rigidBody.current;

    if (!kinematicWristRb) {
      console.error(
        "linkWrists: kinematicWrist[1].rigidBody.current not found",
      );
      return false;
    }

    const trueWristArr = this.trueHand.joints[JointNamesEnum.wrist];

    if (!trueWristArr) {
      console.error("TrueWristRb not found");
      return false;
    }

    const [, trueWrist] = trueWristArr;

    const trueWristRb = trueWrist.rigidBody.current;

    if (!trueWristRb) {
      console.error("linkWrists: trueWristRb is undefined");
      return false;
    }

    const kinematicWristPosition = kinematicWristRb.translation();

    const springJointParams = RAPIER.JointData.spring(
      0,
      1.0e5,
      100,
      {
        x: kinematicWristPosition.x,
        y: kinematicWristPosition.y,
        z: kinematicWristPosition.z,
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

    const joint = this.rapierWorld.createImpulseJoint(
      springJointParams,
      kinematicWristRb,
      trueWristRb,
      true,
    );

    const joint2 = this.rapierWorld.createImpulseJoint(
      genericJointParams,
      kinematicWristRb,
      trueWristRb,
      true,
    );

    kinematicWrist.attachedRapierJoints.spring = joint;
    kinematicWrist.attachedRapierJoints.generic = joint2;

    trueWrist.attachedRapierJoints.spring = joint;
    trueWrist.attachedRapierJoints.generic = joint2;

    if (joint && joint2) {
      this.trueHand.handsLinked = true;
      this.kinematicHand.handsLinked = true;
    }

    return true;
  }

  private synchronizeHands(syncBones: boolean, syncJoints: boolean) {
    const stiffness = 1.0e5;
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
          0,
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
          0.01,
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
            x: 1,
            y: 0,
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

        bone.attachedRapierJoints.spring = springJoint;
        bone.attachedRapierJoints.generic = genericJoint;
      }
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

    complete && this.notifyUpdate();
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

  public setUpdateCallback(callback: () => void): void {
    this.updateCallback = callback;
  }

  public clearUpdateCallback(): void {
    this.updateCallback = undefined;
  }

  private notifyUpdate(): void {
    if (this.updateCallback) {
      this.updateCallback();
    }
  }

  reset() {
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
