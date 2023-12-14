/* eslint-disable react/display-name */

import React, {
  createRef,
  forwardRef,
  useMemo,
  useRef,
  type RefObject,
} from "react";
import {
  createMotionHand,
  getMotionHandModelUrl,
  type MotionHand,
} from "@coconut-xr/natuerlich";
import { useFrame, useLoader } from "@react-three/fiber";
import {
  quat,
  RigidBody,
  vec3,
  type RapierRigidBody,
} from "@react-three/rapier";
import type { Group, Object3D } from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { clone } from "three/examples/jsm/utils/SkeletonUtils.js";

import { joints } from "../constants.js";

const assignBonePhysRefs = (motionHandObject: MotionHand) => {
  const mesh = motionHandObject.getObjectByProperty("type", "SkinnedMesh")!;
  mesh.frustumCulled = false;
  mesh.castShadow = true;
  mesh.receiveShadow = true;

  const boneRigidBodyMap = new Map<XRHandJoint, RefObject<RapierRigidBody>>();

  for (const jointName of joints) {
    const bone = motionHandObject.getObjectByName(jointName);
    if (bone == null) {
      continue;
    }

    const ref = createRef<RapierRigidBody>();

    boneRigidBodyMap.set(jointName, ref);
  }

  return boneRigidBodyMap;
};

const updatePhysBone = (
  object: MotionHand,
  frame: XRFrame,
  referenceSpace: XRReferenceSpace,
  bonePhysRefs: Map<XRHandJoint, RefObject<RapierRigidBody>>,
) => {
  console.log("\n------ updatePhysBone ------");
  let poseValid = true;
  for (const inputJoint of object.hand.values()) {
    const bone = object.boneMap.get(inputJoint.jointName);
    const bonePhysRef = bonePhysRefs.get(inputJoint.jointName);
    if (!bone || !bonePhysRef) {
      console.log(`bone: `, bone);
      console.log(`bonePhysRef: `, bonePhysRef);
      continue;
    }

    const jointPose = frame.getJointPose?.(inputJoint, referenceSpace);
    console.log(`jointPose: `, jointPose);
    console.log(`bonePhysRef.current: `, bonePhysRef.current);
    if (jointPose != null && bonePhysRef.current != null) {
      const { position, orientation } = jointPose.transform;

      bonePhysRef.current.setNextKinematicTranslation(
        vec3({ x: position.x, y: position.y, z: position.z }),
      );

      bonePhysRef.current.setNextKinematicRotation(
        quat({
          x: orientation.x,
          y: orientation.y,
          z: orientation.z,
          w: orientation.w,
        }),
      );
      continue;
    }

    if (inputJoint.jointName === "wrist") {
      poseValid = false;
      break; //wrist is untracked => everything else is unuseable
    }
  }

  console.log("------------------------\n");

  return poseValid;
};

interface HandBoneProps {
  boneName: string;
  boneObject: Object3D;
  boneRef: React.MutableRefObject<RapierRigidBody>;
  size: { radius: number; length: number };
}

export const HandBone = ({
  boneName,
  boneObject,
  boneRef,
  size,
}: HandBoneProps) => {
  //   const { world } = useRapier();

  boneRef.current.setNextKinematicTranslation(
    vec3({
      x: boneObject.position.x,
      y: boneObject.position.y,
      z: boneObject.position.z,
    }),
  );

  boneRef.current.setNextKinematicRotation(
    quat({
      x: boneObject.quaternion.x,
      y: boneObject.quaternion.y,
      z: boneObject.quaternion.z,
      w: boneObject.quaternion.w,
    }),
  );

  return (
    <RigidBody name={boneName} ref={boneRef}>
      <mesh>
        <cylinderGeometry args={[size.radius, size.radius, size.length, 10]} />
        <meshBasicMaterial wireframe color={"red"} />
      </mesh>
    </RigidBody>
  );
};

export const BoneJoint = ({
  boneA,
  boneB,
}: {
  boneA: RefObject<RapierRigidBody>;
  boneB: RefObject<RapierRigidBody>;
}) => {
  console.log(`boneA: `, boneA);
  console.log(`boneB: `, boneB);
};

export const PhysHand = forwardRef<
  Group,
  {
    hand: XRHand;
    inputSource: XRInputSource;
    id: number;
    // children?: React.ReactNode;
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
>(({ hand, inputSource, id }, ref) => {
  //   const handGroupRef = useRef<Group>(null);
  const handUrl = getMotionHandModelUrl(inputSource.handedness);

  const { scene: handScene } = useLoader(GLTFLoader, handUrl);

  const clonedHandScene = useMemo(() => clone(handScene), [handScene]);

  const motionHandObject = useMemo(
    () => createMotionHand(hand, clonedHandScene),
    [clonedHandScene, hand],
  );

  const boneRefsMap = useMemo(
    () => assignBonePhysRefs(motionHandObject),
    [motionHandObject],
  );

  console.log(`motionHandObject: `, motionHandObject);

  const motionHandRef = useRef<MotionHand>(motionHandObject);

  useFrame((state, delta, frame: XRFrame | undefined) => {
    const motionHand = motionHandRef.current;

    if (
      frame == null ||
      frame.session.visibilityState === "hidden" ||
      frame.session.visibilityState === "visible-blurred"
    ) {
      motionHand.visible = false;
      return;
    }
    const referenceSpace = state.gl.xr.getReferenceSpace();
    if (referenceSpace == null) {
      motionHand.visible = false;
      return;
    }
    // const poseValid = updateMotionHand(motionHand, frame, referenceSpace);
    const validPose = updatePhysBone(
      motionHand,
      frame,
      referenceSpace,
      boneRefsMap,
    );
    motionHand.visible = validPose;
  });

  return (
    <>
      <group name="hand">
        {Array.from(boneRefsMap.entries()).map(([boneName, boneRef]) => (
          <RigidBody
            name={boneName}
            ref={boneRef}
            key={boneName}
            type="kinematicPosition"
            colliders="cuboid"
            restitution={0}
            ccd
          >
            <mesh>
              <boxGeometry args={[0.01, 0.01, 0.01]} />
              <meshBasicMaterial wireframe color={"red"} />
            </mesh>
          </RigidBody>
        ))}
      </group>
    </>
  );
});
