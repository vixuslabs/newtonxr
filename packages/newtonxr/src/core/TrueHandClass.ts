import type { UUID } from "crypto";
import React from "react";
import RAPIER, {
  Vector3 as RapierVector3,
  type Quaternion as RapierQuaternion,
  type World,
} from "@dimforge/rapier3d-compat";
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

interface KinematicJointInfo {
  name: XRHandJoint;
  // properties: JointProperties;
  // rigidBody: RapierRigidBody;
  transform: RapierBoneRigidBody;
  rigidBody: React.RefObject<RapierRigidBody>;
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
  refs: {
    trueBoneRef: React.RefObject<RapierRigidBody>;
    kinematicBoneRef: React.RefObject<RapierRigidBody>;
  };
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
  kinematicJoints: KinematicJointInfo[];
  sensorJoints: Map<PalmJointNames, PalmProperties> | undefined;
  rapier: World;

  private updateCallback?: () => void;

  constructor({ handedness, rapier, withSensor = true }: TrueHandOptions) {
    this.handedness = handedness;
    this.bones = [];
    this.kinematicJoints = [];
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
        refs: {
          trueBoneRef: React.createRef<RapierRigidBody>(),
          kinematicBoneRef: React.createRef<RapierRigidBody>(),
        },
      };
      this.bones.push(bone);
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
    console.log("\n-----------------updateBonesOnFrame-----------------");
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

    // console.log(`${this.handedness} hand bones: `, this.bones);

    if (!this.allBonesLinked) {
      console.log("updateBonesOnFrame - Linking bones now");
      this.addSpringJoints();
    }

    if (options.updateRapier) {
      this.updateRapierBones();
    }

    if (options.updateSensor) {
      this.updateSensorBones();
    }

    this.notifyUpdate();

    console.log("this.allBonesLinked", this.allBonesLinked);

    console.log("-----------------updateBonesOnFrame END -----------------\n");
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

  reset() {
    this.xrJoints.clear();
    this.bones = [];
    this.visible = false;
    this.intializedHand = false;
    this.allBonesLinked = false;
  }

  private addSpringJoints() {
    // FIX: Create RapierJoints in Here
    return;

    const stiffness = 1.0e3;
    const mass = 1;
    const criticalDamping = 2.0 * Math.sqrt(stiffness * mass);
    const anchor = new RapierVector3(0, 0, 0);
    let allBonesLinked = true;

    this.bones.forEach((bone) => {
      const kinematicBone = bone.refs.kinematicBoneRef.current;
      const trueBone = bone.refs.trueBoneRef.current;

      if (!allBonesLinked) return;

      console.log("kinematicBone", kinematicBone);
      console.log("trueBone", trueBone);

      if (!kinematicBone) {
        console.log("bone.kinematicBoneRef.current not set");
        allBonesLinked = false;
        return;
      }
      if (!trueBone) {
        console.log("bone.trueBoneRef.current not set");
        allBonesLinked = false;
        return;
      }

      const anchor2 = new RapierVector3(0, 1, 0);
      const anchor3 = new RapierVector3(1, 1, 0);

      const springJoint = RAPIER.JointData.spring(
        0,
        stiffness,
        criticalDamping * 1.5,
        anchor3,
        anchor2,
      );

      console.log("springJoint", springJoint);
      console.log("kinematicBone.translation()", kinematicBone.translation());
      console.log("trueBone.translation()", trueBone.translation());

      const joint = this.rapier.createImpulseJoint(
        springJoint,
        kinematicBone,
        trueBone,
        true,
      );
      console.log("joint", joint);

      // const hey = this.rapier.createRigidBody(
      //   RAPIER.RigidBodyDesc.kinematicPositionBased(),
      // );

      // console.log("hey", hey);
    });

    this.allBonesLinked = allBonesLinked;
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

      // console.log("bone.kinematicBoneRef.current", bone.kinematicBoneRef.current);
      // console.log("bone ", bone);

      // Update bone transform
      bone.refs.kinematicBoneRef.current?.setNextKinematicTranslation(
        bone.transform.position,
      );
      bone.refs.kinematicBoneRef.current?.setNextKinematicRotation(
        bone.transform.orientation,
      );

      /// update bone in map

      // this.updateBone(bone.name, bone);
    });

    // if (!this.allBonesLinked) {
    //   // this.linkBones();
    //   this.allBonesLinked = true;
    // }
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

  private updateKinematicJointProperties(
    joint: KinematicJointInfo,
    jointName: XRHandJoint,
    position: RapierVector3,
    orientation: RapierQuaternion,
  ) {
    // const joint = this.kinematicJoints.get(jointName);

    if (!joint) {
      throw new Error(`Joint ${jointName} not found`);
    }
    joint.rigidBody.current?.setNextKinematicTranslation(
      joint.transform.position,
    );
    joint.rigidBody.current?.setNextKinematicRotation(orientation);

    // joint.rigidBody.setNextKinematicTranslation(position);
    // joint.rigidBody.setNextKinematicRotation(orientation);
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

      //   // const rbDesc = RAPIER.RigidBodyDesc.kinematicPositionBased();

      //   // const rb = this.rapier.createRigidBody(rbDesc);

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
}
