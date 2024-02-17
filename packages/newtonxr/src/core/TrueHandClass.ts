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
import { XRHandModel } from "three/examples/jsm/Addons.js";

import { JointType } from "../hooks/useHandHooks.js";
import {
  _direction,
  _position,
  _quaternion,
  // _object,
  // _position,
  _vector,
} from "../utils/reserveThreeValues.js";
import { isTipJointName } from "./index.js";

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

    boneNames.forEach((boneName, i) => {
      const [startJointName, endJointName] = boneName.split(
        "--",
      )! as XRHandJoint[];

      if (!startJointName || !endJointName) {
        throw new Error(`Invalid bone name: ${boneName}`);
      }

      const startJoint: JointInfo = {
        name: startJointName,
        properties: {
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

    // Set the completeFingerBones
    this.completeFingers.forEach((fingerBones, i) => {
      this.completeFingerBones[i]![1].bones = fingerBones;
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

      const jointIndex = JointNamesEnum[jointSpace.jointName];
      const kinematicJoint = this.kinematicJoints[jointIndex];

      if (kinematicJoint) {
        this.updateKinematicJointProperties(
          kinematicJoint,
          startJointPose.transform.position,
          startJointPose.transform.orientation,
        );

        // kinematicJoint.transform.position.set(
        //   startJointPose.transform.position.x,
        //   startJointPose.transform.position.y,
        //   startJointPose.transform.position.z,
        // );
        // kinematicJoint.transform.orientation.set(
        //   startJointPose.transform.orientation.x,
        //   startJointPose.transform.orientation.y,
        //   startJointPose.transform.orientation.z,
        //   startJointPose.transform.orientation.w,
        // );
      } else {
        console.log(
          `Kinematic joint for ${jointSpace.jointName} not found in this.kinematicJoints`,
        );
      }
    }

    console.log("this.xrJoints", this.xrJoints);

    if (options.updateRapier) {
      console.log("updateHandOnFrame - Updating bones now");
      this.updateRapierBones();
    }

    if (!this.ligamentsCreated) {
      console.log("updateHandOnFrame - Creating ligaments now");
      this.createBoneLinks();
    }

    if (!this.handsLinked) {
      console.log("updateHandOnFrame - Linking bones now");
      this.synchronizeHands();
      // this.notifyUpdate();
    }

    // if (options.updateRapier) {
    //   this.updateFingers();
    //   // this.notifyUpdate();
    // }
    // if (!this.ligamentsCreated) {
    //   console.log("updateHandOnFrame - Creating ligaments now");
    //   this.linkFingersToWrist();
    // }

    // if (!this.handsLinked) {
    //   console.log("updateHandOnFrame - Linking bones now");
    //   // this.synchronizeHands();
    //   // this.notifyUpdate();
    // }

    // if (options.updateSensor) {
    //   this.updateSensorBones();
    //   this.notifyUpdate();
    // }

    this.notifyUpdate();
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

      // Update Collider position

      // if (bone.refs.trueBoneColliderRef) {
      //   bone.refs.trueBoneColliderRef.current?.setTranslationWrtParent(
      //     bone.transform.position,
      //   );

      //   bone.refs.trueBoneColliderRef.current?.setRotationWrtParent(
      //     bone.transform.orientation,
      //   );
      // }

      // Update bone transform
      bone.refs.kinematicBoneRef.current?.setNextKinematicTranslation(
        bone.transform.position,
      );
      bone.refs.kinematicBoneRef.current?.setNextKinematicRotation(
        bone.transform.orientation,
      );
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

        rapierJoint.stiffness = 0.0;
        rapierJoint.damping = 0.0;
        // rapierJoint.limitsEnabled = true;
        // rapierJoint.limits = []
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

          jointData.stiffness = 0.0;
          jointData.damping = 0.0;
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

          jointData.stiffness = 0.0;
          jointData.damping = 0.0;
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

          jointData.stiffness = 0.0;
          jointData.damping = 0.0;
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

  private linkFingersToWrist() {
    // const wristJoint = wrist.properties.position;

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

      const joint = this.rapierWorld.createImpulseJoint(
        jointData,
        this.wrist!,
        fingerRigidBody,
        true,
      );
    });

    this.ligamentsCreated = complete;
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

  updateKinematicHandJoint() {
    // Sets a RigidBody at each webxr joint for the KinematicHand

    this.xrJoints.forEach((jointInfo, jointName) => {
      const jointIndex = JointNamesEnum[jointName];
      const kinematicJoint = this.kinematicJoints[jointIndex];

      if (!kinematicJoint) {
        throw new Error(`Joint ${jointName} not found`);
      }

      // this.updateKinematicJointProperties(
      //   kinematicJoint,
      //   jointSpace.jointName,
      //   jointPose.transform.position,
      //   jointPose.transform.orientation,
      // );
    });

    // for (const jointSpace of hand.values()) {
    //   const jointIndex = JointNamesEnum[jointSpace.jointName];
    //   const kinematicJoint = this.kinematicJoints[jointIndex];

    //   if (!kinematicJoint) {
    //     throw new Error(`Joint ${jointSpace.jointName} not found`);
    //   }

    //   const jointPose = frame.getJointPose?.(jointSpace, referenceSpace);

    //   if (!jointPose) {
    //     console.log(
    //       `Joint pose for ${jointSpace.jointName} not found in frame.getJointPose`,
    //     );
    //     continue;
    //   }

    //   this.updateKinematicJointProperties(
    //     kinematicJoint,
    //     jointSpace.jointName,
    //     jointPose.transform.position,
    //     jointPose.transform.orientation,
    //   );

    //   // this.updateJointProperties(
    //   //   jointSpace.jointName,
    //   //   startJointPose.transform.position,
    //   //   startJointPose.transform.orientation,
    //   // );

    //   // if (this.sensorJoints && isPalmJointName(jointSpace.jointName)) {
    //   //   this.updateSensor(
    //   //     jointSpace.jointName,
    //   //     startJointPose.transform.position,
    //   //     startJointPose.transform.orientation,
    //   //   );
    //   // }
    // }
    // this.notifyUpdate();
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
  private updateFingers() {
    console.log("-----INSIDE updateFingers-----");
    console.log("this.completeFingerBones", this.completeFingerBones);

    this.completeFingerBones.forEach(([_, fingerBones], i) => {
      // Calculate the average position of all bones in the finger
      const { averagePosition, averageOrientation } = fingerBones.bones.reduce(
        (acc, bone) => {
          const startJointPosition = bone.startJoint.properties.position;
          const endJointPosition = bone.endJoint.properties.position;
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

  private calculateHeightForBone(
    jointOne: THREE.Vector3,
    jointTwo: THREE.Vector3,
  ) {
    return jointOne.distanceTo(jointTwo);
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
