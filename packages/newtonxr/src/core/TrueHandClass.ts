import { UUID } from "crypto";
import React from "react";
import type {
  Quaternion as RapierQuaternion,
  Vector3 as RapierVector3,
  World,
} from "@dimforge/rapier3d-compat";
import RAPIER from "@dimforge/rapier3d-compat";
// import type { Vector3 as Vector3Like } from "@react-three/fiber";
import type { RapierCollider, RapierRigidBody } from "@react-three/rapier";
// import { quat, vec3 } from "@react-three/rapier";
import { Quaternion, Vector3 } from "three";

import {
  _direction,
  // _object,
  // _position,
  // _quaternion,
  _vector,
} from "../utils/reserveThreeValues.js";
import { isTipJointName } from "./index.js";
import type { HandBoneNames } from "./index.js";

interface TrueHandOptions {
  handedness: XRHandedness;
  rapier: World;
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

interface UpdateBonesOnFrameOptions {
  updateRapier?: boolean;
  updateSensor?: boolean;
}

// interface RapierBoneRigidBody {
//   position: RapierVector3;
//   orientation: RapierQuaternion;
// }

// interface JointProperties {
//   position: RapierVector3;
//   orientation: RapierQuaternion;
// }

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

export interface BoneInfo {
  name: HandBoneNames;
  id: UUID;
  startJoint: JointInfo;
  endJoint: JointInfo;
  transform: RapierBoneRigidBody;
  rigidBody?: RapierRigidBody;
  visibleBoneRef: React.RefObject<RapierRigidBody>;
  bridgeBoneRef: React.RefObject<RapierRigidBody>;
  isTipBone: boolean;
  boxArgs: {
    width: number;
    height?: number;
    depth: number;
  };
  // height?: number;
}

export interface TrueHandClassProps {
  handedness: XRHandedness;
  intializedHand: boolean;
  visible: boolean;
  allBonesLinked: boolean;
  kinematicBones: BoneInfo[];
  dynamicBones: BoneInfo[];
  xrJoints: Map<XRHandJoint, JointInfo>;
  rapier: World;
  initHand: () => void;
  updateBone: (name: HandBoneNames, bone: BoneInfo) => void;
  createJointFromBones: (
    boneOne: HandBoneNames,
    boneTwo: HandBoneNames,
  ) => void;
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
  allBonesLinked: boolean;
  bones: BoneInfo[];
  xrJoints: Map<XRHandJoint, JointInfo>;
  sensorJoints: Map<PalmJointNames, PalmProperties> | undefined;
  rapier: World;

  private updateCallback?: () => void;

  constructor({ handedness, rapier, withSensor = true }: TrueHandOptions) {
    this.handedness = handedness;
    this.bones = [];
    this.xrJoints = new Map<XRHandJoint, JointInfo>();
    this.visible = false;
    this.allBonesLinked = false;
    this.intializedHand = false;
    this.rapier = rapier;
    this.sensorJoints = withSensor
      ? new Map<PalmJointNames, PalmProperties>()
      : undefined;

    this.initHand();
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
          width: 0.005,
          depth: 0.004,
        },
        isTipBone: isTipJointName(endJointName),
        visibleBoneRef: React.createRef<RapierRigidBody>(),
        bridgeBoneRef: React.createRef<RapierRigidBody>(),
      };
      this.bones.push(bone);
    });
    this.intializedHand = true;
    this.visible = true;
  }

  updateBone(name: HandBoneNames, bone: BoneInfo) {
    const index = BoneNames[name];
    this.bones[index] = bone;
  }

  updateKinematicHand(
    hand: XRHand,
    frame: XRFrame,
    referenceSpace: XRReferenceSpace,
    options: UpdateBonesOnFrameOptions = {
      updateRapier: true,
      updateSensor: true,
    },
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

    console.log(`${this.handedness} hand bones: `, this.bones);

    if (!this.allBonesLinked) {
      // this.linkBones();
    }

    if (options.updateRapier) {
      this.updateRapierBones();
    }

    if (options.updateSensor) {
      this.updateSensorBones();
    }

    this.notifyUpdate();
  }

  createJointFromBones(boneOne: HandBoneNames, boneTwo: HandBoneNames) {
    const boneOneInfo = this.getBone(boneOne);
    const boneTwoInfo = this.getBone(boneTwo);
  }

  getBone(name: HandBoneNames) {
    const index = BoneNames[name];

    const bone = this.bones[index];

    if (!bone) {
      throw new Error(`Bone ${name} not found`);
    }
    return bone;
  }

  setVisibility(visible: boolean) {
    this.visible = visible;
  }

  setInitializedHand(initialized: boolean) {
    this.intializedHand = initialized;
  }

  private createRapierJoints() {
    // FIX: Create RapierJoints in Here
  }

  reset() {
    this.xrJoints.clear();
    this.bones = [];
    this.visible = false;
    this.intializedHand = false;
    this.allBonesLinked = false;
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

  private updateSensor(
    palmJoint: PalmJointNames,
    position: RapierVector3,
    orientation: RapierQuaternion,
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

  private updateRapierBones() {
    // FIX: Make RigidBodies in Here

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
        _vector.x === 0 && _vector.y === 1 && _vector.z === 0;

      bone.transform.orientation.setFromUnitVectors(
        vectorIsCorrect ? _vector : _vector.set(0, 1, 0),
        _direction,
      );

      // console.log("bone.bridgeBoneRef.current", bone.bridgeBoneRef.current);
      // console.log("bone ", bone);

      // Update bone transform
      bone.bridgeBoneRef.current?.setNextKinematicTranslation(
        bone.transform.position,
      );
      bone.bridgeBoneRef.current?.setNextKinematicRotation(
        bone.transform.orientation,
      );

      /// update bone in map

      // this.updateBone(bone.name, bone);
    });

    if (!this.allBonesLinked) {
      // this.linkBones();
      this.allBonesLinked = true;
    }
  }

  private updateSensorBones() {
    // TODO: update sensor bones
  }

  private updateJointProperties(
    jointName: XRHandJoint,
    position: RapierVector3,
    orientation: RapierQuaternion,
  ) {
    const joint = this.xrJoints.get(jointName);

    if (!joint) {
      throw new Error(`Joint ${jointName} not found`);
    }

    joint.properties.position.x = position.x;
    joint.properties.position.y = position.y;
    joint.properties.position.z = position.z;

    joint.properties.orientation.x = orientation.x;
    joint.properties.orientation.y = orientation.y;
    joint.properties.orientation.z = orientation.z;
    joint.properties.orientation.w = orientation.w;
  }

  private calculateHeightForBone(
    jointOne: THREE.Vector3,
    jointTwo: THREE.Vector3,
  ) {
    console.log("height: ", jointOne.distanceTo(jointTwo));
    return jointOne.distanceTo(jointTwo);
  }
}
