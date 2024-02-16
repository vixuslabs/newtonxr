import type { UUID } from "crypto";
import React from "react";
import RAPIER, { type World } from "@dimforge/rapier3d-compat";
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

import { JointType } from "../hooks/useHandHooks.js";
import {
  _direction,
  // _object,
  // _position,
  _vector,
} from "../utils/reserveThreeValues.js";
import { isTipJointName } from "./index.js";
import type { HandBoneNames } from "./index.js";

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

enum BoneNames {
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

type HandBoneArr = [
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

const boneNames: HandBoneArr = [
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
  properties: JointProperties;
  readonly isTipJoint: boolean;
  handedness?: "left" | "right";
}

interface KinematicJointInfo {
  name: XRHandJoint;
  transform: RapierBoneRigidBody;
  rigidBody: React.RefObject<RapierRigidBody>;
  readonly isTipJoint: boolean;
  handedness?: "left" | "right";
}

interface AttachedRapierJoints {
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
  };
  boxArgs: {
    width: number;
    height?: number;
    depth: number;
  };
  isTipBone: boolean;
  attachedRapierJoints: AttachedRapierJoints;
}

type Fingers = "thumb" | "index" | "middle" | "ring" | "pinky";

interface CompleteFinger {
  bones: BoneInfo[];
  rigidBodyRefs: {
    trueBoneRef: React.RefObject<RapierRigidBody>;
    kinematicBoneRef: React.RefObject<RapierRigidBody>;
  };
}

export type CompleteFingerBones = Record<Fingers, CompleteFinger>;

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
  updateBonesOnFrame: (
    hand: XRHand,
    frame: XRFrame,
    referenceSpace: XRReferenceSpace,
    options?: UpdateBonesOnFrameOptions,
  ) => void;
  getBone: (name: HandBoneNames) => BoneInfo;
  setVisibility: (visible: boolean) => void;
}

export default class TrueHand {
  handedness: XRHandedness;
  intializedHand: boolean;
  visible: boolean;
  handsLinked: boolean;
  ligamentsCreated: boolean;
  wrist: RapierRigidBody | undefined;
  bones: BoneInfo[];
  completeFingers: BoneInfo[][];
  completeFingerBones: CompleteFingerBones;
  xrJoints: Map<XRHandJoint, JointInfo>;
  kinematicJoints: KinematicJointInfo[];
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
    this.xrJoints = new Map<XRHandJoint, JointInfo>();
    this.kinematicJoints = [];
    this.bones = [];
    this.completeFingers = [];
    this.completeFingerBones = {
      thumb: {
        bones: [],
        rigidBodyRefs: {
          trueBoneRef: React.createRef<RapierRigidBody>(),
          kinematicBoneRef: React.createRef<RapierRigidBody>(),
        },
      },
      index: {
        bones: [],
        rigidBodyRefs: {
          trueBoneRef: React.createRef<RapierRigidBody>(),
          kinematicBoneRef: React.createRef<RapierRigidBody>(),
        },
      },
      middle: {
        bones: [],
        rigidBodyRefs: {
          trueBoneRef: React.createRef<RapierRigidBody>(),
          kinematicBoneRef: React.createRef<RapierRigidBody>(),
        },
      },
      ring: {
        bones: [],
        rigidBodyRefs: {
          trueBoneRef: React.createRef<RapierRigidBody>(),
          kinematicBoneRef: React.createRef<RapierRigidBody>(),
        },
      },
      pinky: {
        bones: [],
        rigidBodyRefs: {
          trueBoneRef: React.createRef<RapierRigidBody>(),
          kinematicBoneRef: React.createRef<RapierRigidBody>(),
        },
      },
    };
    this.sensorJoints = withSensor
      ? new Map<PalmJointNames, PalmProperties>()
      : undefined;

    this.initHand();
  }

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

    let fingersArr: BoneInfo[] = [];

    boneNames.forEach((boneName) => {
      const [startJointName, endJointName] = boneName.split(
        "--",
      )! as XRHandJoint[];
      // const endJoint = boneName.split("--")[1]! as XRHandJoint;

      if (!startJointName || !endJointName) {
        throw new Error(`Invalid bone name: ${boneName}`);
      }

      const startJoint: JointInfo = {
        name: startJointName,
        properties: {
          // position: new RapierVector3(0, 0, 0),
          // orientation: new RapierQuaternion(0, 0, 0, 0),
          position: new Vector3(),
          orientation: new Quaternion(),
        },
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
        properties: {
          // position: new RapierVector3(0, 0, 0),
          // orientation: new RapierQuaternion(0, 0, 0, 0),
          position: new Vector3(),
          orientation: new Quaternion(),
        },
        isTipJoint: isTipJointName(endJointName),
      };

      const existingStartJointInfo = this.xrJoints.get(startJointName);
      const existingEndJointInfo = this.xrJoints.get(endJointName);

      !existingStartJointInfo && this.xrJoints.set(startJointName, startJoint);
      !existingEndJointInfo && this.xrJoints.set(endJointName, endJoint);

      const bone: BoneInfo = {
        name: boneName,
        id: crypto.randomUUID(),
        startJoint: existingStartJointInfo ?? startJoint,
        endJoint: existingEndJointInfo ?? endJoint,
        transform: {
          // position: new RapierVector3(0, 0, 0),
          // orientation: new RapierQuaternion(0, 0, 0, 0),
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
        },
        attachedRapierJoints: {
          spring: undefined,
          top: undefined,
          bottom: undefined,
        },
      };
      this.bones.push(bone);

      if (isTipJointName(endJointName)) {
        fingersArr.push(bone);
        this.completeFingers.push(fingersArr);
        fingersArr = [];
      } else {
        fingersArr.push(bone);
      }
    });

    jointNames.forEach((jointName) => {
      const joint = this.xrJoints.get(jointName);

      if (!joint) {
        throw new Error(`Joint ${jointName} not found`);
      }

      this.kinematicJoints.push({
        name: jointName,
        rigidBody: React.createRef<RapierRigidBody>(),
        transform: {
          position: new Vector3(),
          orientation: new Quaternion(),
        },
        isTipJoint: joint.isTipJoint,
      });
    });

    this.intializedHand = true;
    this.visible = true;

    this.notifyUpdate();
  }

  updateBonesOnFrame(
    hand: XRHand,
    frame: XRFrame,
    referenceSpace: XRReferenceSpace,
    options: UpdateBonesOnFrameOptions = {
      updateRapier: true,
      updateSensor: true,
    },
  ) {
    if (!this.visible) {
      console.log("updateBonesOnFrame - Hand not visible");
      return;
    }
    if (!this.intializedHand) {
      console.log("updateBonesOnFrame - Hand not initialized, init now");
      this.initHand();
      return;
    }

    for (const jointSpace of hand.values()) {
      const joint = this.xrJoints.get(jointSpace.jointName);

      if (!joint) {
        console.log(
          `Joint ${jointSpace.jointName} not found in this.xrJoints, setting now`,
        );
        this.xrJoints.set(jointSpace.jointName, {
          name: jointSpace.jointName,
          properties: {
            position: new Vector3(),
            orientation: new Quaternion(),
          },
          isTipJoint: isTipJointName(jointSpace.jointName),
        });
        continue;
      }

      const startJointPose = frame.getJointPose?.(jointSpace, referenceSpace);

      if (!startJointPose) {
        console.log(
          `Joint pose for ${jointSpace.jointName} not found in frame.getJointPose`,
        );
        continue;
      }

      if (jointSpace.jointName === "wrist" && !this.wrist) {
        const wristDesc = RAPIER.RigidBodyDesc.fixed();
        const wrist = this.rapierWorld.createRigidBody(wristDesc);
        wrist.setTranslation(
          {
            x: startJointPose.transform.position.x,
            y: startJointPose.transform.position.y,
            z: startJointPose.transform.position.z,
          },
          true,
        );

        wrist.setRotation(
          {
            x: startJointPose.transform.orientation.x,
            y: startJointPose.transform.orientation.y * (Math.PI / 2),
            z: startJointPose.transform.orientation.z,
            w: startJointPose.transform.orientation.w,
          },
          true,
        );

        this.wrist = wrist;
      }

      this.updateJointProperties(
        jointSpace.jointName,
        startJointPose.transform.position,
        startJointPose.transform.orientation,
      );

      // if (this.sensorJoints && isPalmJointName(jointSpace.jointName)) {
      //   this.updateSensor(
      //     jointSpace.jointName,
      //     startJointPose.transform.position,
      //     startJointPose.transform.orientation,
      //   );
      // }
    }

    if (options.updateRapier) {
      this.updateRapierBones();
      this.notifyUpdate();
    }

    if (!this.ligamentsCreated) {
      console.log("updateBonesOnFrame - Creating ligaments now");
      this.createBoneLinks();
      this.notifyUpdate();
      // this.createSpringLigaments();
      // this.notifyUpdate();
    }

    if (!this.handsLinked) {
      console.log("updateBonesOnFrame - Linking bones now");
      this.synchronizeHands();
      this.notifyUpdate();
    }

    if (options.updateSensor) {
      this.updateSensorBones();
      this.notifyUpdate();
    }

    // this.notifyUpdate();
  }

  private createCompleteFingers() {
    let colliderDesc1: RAPIER.Collider;
    let colliderDesc2: RAPIER.ColliderDesc;
    let colliderDesc3: RAPIER.ColliderDesc;
    let colliderDesc4: RAPIER.ColliderDesc;
    let colliderDesc5: RAPIER.ColliderDesc;

    let collider1: RAPIER.Collider;
    let collider2: RAPIER.Collider;
    let collider3: RAPIER.Collider;
    let collider4: RAPIER.Collider;
    let collider5: RAPIER.Collider;

    let rigidBodyDesc: RAPIER.RigidBodyDesc;
    let rigidBody: RAPIER.RigidBody;

    const fingerOrder = [
      "thumb",
      "index-finger",
      "middle-finger",
      "ring-finger",
      "pinky-finger",
    ];

    this.completeFingers.forEach((fingerBones, i) => {
      rigidBodyDesc = RAPIER.RigidBodyDesc.dynamic()
        .setCanSleep(false)
        .setGravityScale(0.0)
        .setAdditionalSolverIterations(5)
        .setCcdEnabled(true);

      rigidBody = this.rapierWorld.createRigidBody(rigidBodyDesc);

      fingerBones.map((bone, i, arr) => {
        switch (i) {
          case 0: {
            const colliderDesc = RAPIER.ColliderDesc.cylinder(
              bone.boxArgs.width / 2,
              bone.boxArgs.width / 2,
            )
              .setFriction(1.0)
              .setRestitution(0.0)
              .setDensity(5);

            collider1 = this.rapierWorld.createCollider(
              colliderDesc,
              rigidBody,
            );

            break;
          }
        }
      });

      // rigidBody = this.rapierWorld.createRigidBody(rigidBodyDesc);
    });
  }

  private createBoneLinks() {
    let lastBone: BoneInfo | undefined;
    console.log(
      `\n---------- ${this.handedness} Bone - createBoneLinks --------`,
    );

    let rapierJoint: RAPIER.JointData | undefined;
    let complete = true;

    this.bones.forEach((bone, i, arr) => {
      console.log(
        `---------- ${this.handedness} Bone - createBoneLinks --------`,
      );
      const trueBone = bone.refs.trueBoneRef.current;
      // const lastBoneTrueBone = lastBone?.refs.trueBoneRef.current;

      console.log("bone height for", bone.boxArgs.height);

      if (!trueBone) {
        console.log("trueBone not set");
        complete = false;
        return;
      }

      /**
       * Bottom bone will always be first anchor
       * Top bone will always be second anchor
       * NOTE:
       */

      if (bone.name.includes("wrist")) {
        rapierJoint = RAPIER.JointData.spherical(
          {
            x: 0,
            y: 0,
            z: 0,
          },
          {
            x: 0,
            y: bone.boxArgs.height ? -bone.boxArgs.height / 2 : 0.3,
            // y: 0,
            z: 0,
          },
        );

        const joint = this.rapierWorld.createImpulseJoint(
          rapierJoint,
          this.wrist!,
          trueBone,
          true,
        );

        bone.attachedRapierJoints.bottom = joint;

        lastBone = bone;
        return;
      }

      if (!lastBone) {
        console.log("lastBone not set");
        lastBone = bone;
        return;
      }

      const lastBoneTrueBone = lastBone.refs.trueBoneRef.current;

      if (!lastBoneTrueBone) {
        console.log("lastBoneTrueBone not set");
        throw new Error(
          `lastBoneTrueBone not set during ${bone.name} ligament creation`,
        );
        // lastBone = bone;
        // return;
      }

      const jointType = jointTypeMappings.get(
        bone.name.split("--")[1]! as XRHandJoint,
      );

      if (!jointType) {
        throw new Error(`Joint type for ${bone.name} not found`);
      }

      if (!lastBone.boxArgs.height || !bone.boxArgs.height) {
        console.log("Bone height not set");
        complete = false;
        return;
      }

      switch (jointType) {
        case JointType.Spherical: {
          const jointData = RAPIER.JointData.spherical(
            {
              x: 0,
              y: lastBone.boxArgs.height ? lastBone.boxArgs.height / 2 : 0.3,
              z: 0,
            },
            {
              x: 0,
              y: bone.boxArgs.height ? -bone.boxArgs.height / 2 : 0.3,
              z: 0,
            },
          );

          // const jointData = RAPIER.JointData.spring(
          //   0,
          //   1.0e6,
          //   0.001,
          //   {
          //     x: 0,
          //     y: lastBone.boxArgs.height ? lastBone.boxArgs.height / 2 : 0.3,
          //     z: 0,
          //   },
          //   {
          //     x: 0,
          //     y: bone.boxArgs.height ? -bone.boxArgs.height / 2 : 0.3,
          //     z: 0,
          //   },
          // );

          const joint = this.rapierWorld.createImpulseJoint(
            jointData,
            lastBoneTrueBone,
            trueBone,
            true,
          );

          bone.attachedRapierJoints.bottom = joint;
          lastBone.attachedRapierJoints.top = joint;

          break;
        }

        case JointType.Revolute: {
          const jointData = RAPIER.JointData.revolute(
            {
              x: 0,
              y: lastBone.boxArgs.height ? lastBone.boxArgs.height / 2 : 0.3,
              // y: 0,
              z: 0,
            },
            {
              x: 0,
              y: bone.boxArgs.height ? -bone.boxArgs.height / 2 : 0.3,
              // y: -0,
              z: 0,
            },
            {
              x: 0,
              y: 1,
              z: 0,
            },
          );
          // const jointData = RAPIER.JointData.spring(
          //   0,
          //   1.0e6,
          //   0.001,
          //   {
          //     x: 0,
          //     y: lastBone.boxArgs.height ? lastBone.boxArgs.height / 2 : 0.3,
          //     z: 0,
          //   },
          //   {
          //     x: 0,
          //     y: bone.boxArgs.height ? -bone.boxArgs.height / 2 : 0.3,
          //     z: 0,
          //   },
          // );
          console.log("Revolute - rapierJointData", rapierJoint);

          const joint = this.rapierWorld.createImpulseJoint(
            jointData,
            lastBoneTrueBone,
            trueBone,
            true,
          );

          bone.attachedRapierJoints.bottom = joint;
          lastBone.attachedRapierJoints.top = joint;
          break;
        }

        case JointType.Fixed: {
          // console.log("JointType.Fixed");
          // console.log("No need to create a joint for the tip bone ", bone.name);
          const jointData = RAPIER.JointData.revolute(
            {
              x: 0,
              y: lastBone.boxArgs.height ? lastBone.boxArgs.height / 2 : 0.3,
              // y: 0,
              z: 0,
            },
            {
              x: 0,
              y: bone.boxArgs.height ? -bone.boxArgs.height / 2 : 0.3,
              // y: -0,
              z: 0,
            },
            {
              x: 0,
              y: 1,
              z: 0,
            },
          );
          // const jointData = RAPIER.JointData.spring(
          //   0,
          //   1.0e6,
          //   0.001,
          //   {
          //     x: 0,
          //     y: lastBone.boxArgs.height ? lastBone.boxArgs.height / 2 : 0.3,
          //     z: 0,
          //   },
          //   {
          //     x: 0,
          //     y: bone.boxArgs.height ? -bone.boxArgs.height / 2 : 0.3,
          //     z: 0,
          //   },
          // );

          const joint = this.rapierWorld.createImpulseJoint(
            jointData,
            lastBoneTrueBone,
            trueBone,
            true,
          );

          bone.attachedRapierJoints.bottom = joint;
          lastBone.attachedRapierJoints.top = joint;

          break;
        }
      }

      console.log(
        "bone.attachedRapierJoints.bottom.contactsEnabled",
        bone.attachedRapierJoints.bottom?.contactsEnabled(),
      );

      console.log(
        "lastBone.attachedRapierJoints.top.contactsEnabled",
        lastBone.attachedRapierJoints.top?.contactsEnabled(),
      );

      lastBone = bone;
    });

    complete && this.notifyUpdate();

    this.ligamentsCreated = complete;

    console.log("is complete: ", complete);

    console.log(
      `---------- ${this.handedness} Bone - createBoneLinks  END --------`,
    );
  }

  private synchronizeHands() {
    // FIX: Create RapierJoints in Here
    // return;

    const stiffness = 1.0e5;
    const mass = 5;

    let handsLinked = true;

    this.bones.forEach((bone) => {
      const kinematicBone = bone.refs.kinematicBoneRef.current;
      const trueBone = bone.refs.trueBoneRef.current;

      if (!handsLinked) return;

      console.log("kinematicBone", kinematicBone);
      console.log("trueBone", trueBone);

      if (!kinematicBone) {
        console.log("bone.kinematicBoneRef.current not set");
        handsLinked = false;
        return;
      }
      if (!trueBone) {
        console.log("bone.trueBoneRef.current not set");
        handsLinked = false;
        return;
      }

      // const anchor2 = new RapierVector3(0, 1, 0);
      // const anchor3 = new RapierVector3(1, 1, 0);

      // console.log("springJoint", springJoint);
      console.log("kinematicBone.translation()", kinematicBone.translation());
      console.log("trueBone.translation()", trueBone.translation());

      // const joint = this.rapierWorld.createImpulseJoint(
      //   springJoint,
      //   kinematicBone,
      //   trueBone,
      //   true,
      // );
      // const fixedJoint = RAPIER.JointData.fixed(
      //   {
      //     x: 0,
      //     y: 0,
      //     z: 0,
      //   },
      //   {
      //     x: 0,
      //     y: 0,
      //     z: 0,
      //     w: 1,
      //   },
      //   {
      //     x: 0,
      //     y: 0,
      //     z: 0,
      //   },
      //   {
      //     x: 0,
      //     y: 0,
      //     z: 0,
      //     w: 1,
      //   },
      // );

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
          x: 0,
          y: -1,
          z: 0,
        },
        AxesMask,
      );

      // const sphericalJoint = RAPIER.JointData.spherical(
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
      // );

      const genericJoint = this.rapierWorld.createImpulseJoint(
        genericJointParams,
        trueBone,
        kinematicBone,
        true,
      );

      /**
       *
       *  FIX: THE BONES ARE PLACED IN DIFFERENT SLOTS
       */
      const springJoint = this.rapierWorld.createImpulseJoint(
        springJointParams,
        trueBone,
        kinematicBone,
        true,
      );

      bone.attachedRapierJoints.spring = springJoint;
      bone.attachedRapierJoints.generic = genericJoint;

      console.log(
        `genericJoint.contactsEnabled()`,
        genericJoint.contactsEnabled(),
      );

      console.log(
        `springJoint.contactsEnabled()`,
        springJoint.contactsEnabled(),
      );

      // console.log("joint", joint);
    });

    this.handsLinked = handsLinked;
  }

  private createSpringLigaments() {
    let lastBone: BoneInfo | undefined;
    console.log(
      `\n---------- ${this.handedness} Bone - createBoneLinks --------`,
    );

    let rapierJoint: RAPIER.JointData | undefined;
    let complete = true;

    this.bones.forEach((bone) => {
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

      // console.log("k", k);

      // this.notifyUpdate();

      lastBone = bone;
    });

    complete && this.notifyUpdate();
  }

  private updateRapierBones() {
    this.bones.forEach((bone) => {
      const startJoint = bone.startJoint;
      const endJoint = bone.endJoint;

      const startJointPosition = startJoint.properties.position;
      const endJointPosition = endJoint.properties.position;

      if (!bone.boxArgs.height) {
        bone.boxArgs.height = this.calculateHeightForBone(
          startJoint.properties.position,
          endJoint.properties.position,
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
      bone.refs.kinematicBoneRef.current?.setNextKinematicTranslation(
        bone.transform.position,
      );
      bone.refs.kinematicBoneRef.current?.setNextKinematicRotation(
        bone.transform.orientation,
      );
    });
  }

  private updateJointProperties(
    jointName: XRHandJoint,
    position: Vector3Object,
    orientation: Vector4Object,
  ) {
    const joint = this.xrJoints.get(jointName);

    if (!joint) {
      throw new Error(`Joint ${jointName} not found`);
    }

    if (jointName === "wrist") {
      this.wrist?.setTranslation(position, true);
      this.wrist?.setRotation(orientation, true);
    }

    joint.properties.position.x = position.x;
    joint.properties.position.y = position.y;
    joint.properties.position.z = position.z;

    joint.properties.orientation.x = orientation.x;
    joint.properties.orientation.y = orientation.y;
    joint.properties.orientation.z = orientation.z;
    joint.properties.orientation.w = orientation.w;
  }

  private updateSensorBones() {
    // TODO: update sensor bones
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

  private calculateHeightForBone(
    jointOne: THREE.Vector3,
    jointTwo: THREE.Vector3,
  ) {
    console.log("height: ", jointOne.distanceTo(jointTwo));
    return jointOne.distanceTo(jointTwo);
  }

  private updateKinematicJointProperties(
    joint: KinematicJointInfo,
    jointName: XRHandJoint,
    position: Vector3Object,
    orientation: Vector4Object,
  ) {
    // const joint = this.kinematicJoints.get(jointName);

    if (!joint) {
      throw new Error(`Joint ${jointName} not found`);
    }
    joint.rigidBody.current?.setNextKinematicTranslation(
      joint.transform.position,
    );
    joint.rigidBody.current?.setNextKinematicRotation(orientation);
  }

  updateKinematicHand(
    hand: XRHand,
    frame: XRFrame,
    referenceSpace: XRReferenceSpace,
  ) {
    // Sets a RigidBody at each webxr joint for the KinematicHand

    if (!this.visible) {
      console.log("updateBonesOnFrame - Hand not visible");
      return;
    }
    if (!this.intializedHand) {
      console.log("updateBonesOnFrame - Hand not initialized, init now");
      this.initHand();
      return;
    }

    for (const jointSpace of hand.values()) {
      // const joint = this.kinematicJoints.get(jointSpace.jointName);

      const jointIndex = JointNamesEnum[jointSpace.jointName];

      // if (!joint) {
      //   console.log(
      //     `Joint ${jointSpace.jointName} not found in this.xrJoints, setting now`,
      //   );

      //   // const jointIndex = BoneNames[jointSpace.jointName];

      // const rbDesc = RAPIER.RigidBodyDesc.kinematicPositionBased();

      // const rb = this.rapierWorld.createRigidBody(rbDesc);

      //   this.kinematicJoints.set(jointSpace.jointName, {
      //     name: jointSpace.jointName,
      //     rigidBody: React.createRef<RapierRigidBody>(),
      //     isTipJoint: isTipJointName(jointSpace.jointName),
      //   });
      //   continue;
      // }

      const kinematicJoint = this.kinematicJoints[jointIndex];

      if (!kinematicJoint) {
        throw new Error(`Joint ${jointSpace.jointName} not found`);
      }

      const startJointPose = frame.getJointPose?.(jointSpace, referenceSpace);

      if (!startJointPose) {
        console.log(
          `Joint pose for ${jointSpace.jointName} not found in frame.getJointPose`,
        );
        continue;
      }

      kinematicJoint.transform.position.setX(
        startJointPose.transform.position.x,
      );
      kinematicJoint.transform.position.setY(
        startJointPose.transform.position.y,
      );
      kinematicJoint.transform.position.setZ(
        startJointPose.transform.position.z,
      );

      // kinematicJoint.transform.orientation.set(startJointPose.transform.orientation.x);
      // kinematicJoint.transform.orientation.setY(startJointPose.transform.orientation.y);
      // kinematicJoint.transform.orientation.setZ(startJointPose.transform.orientation.z);
      // kinematicJoint.transform.orientation.setW(startJointPose.transform.orientation.w);

      // kinematicJoint.transform.orientation.copy(
      //   startJointPose.transform.orientation,
      // );

      this.updateKinematicJointProperties(
        kinematicJoint,
        jointSpace.jointName,
        startJointPose.transform.position,
        startJointPose.transform.orientation,
      );

      console.log(
        "kinematicJoint.rigidBody.current?.translation()",
        kinematicJoint.rigidBody.current?.translation(),
      );

      // this.updateJointProperties(
      //   jointSpace.jointName,
      //   startJointPose.transform.position,
      //   startJointPose.transform.orientation,
      // );

      // if (this.sensorJoints && isPalmJointName(jointSpace.jointName)) {
      //   this.updateSensor(
      //     jointSpace.jointName,
      //     startJointPose.transform.position,
      //     startJointPose.transform.orientation,
      //   );
      // }
    }
    this.notifyUpdate();
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
    this.bones = [];
    this.visible = false;
    this.intializedHand = false;
    this.handsLinked = false;
  }
}
