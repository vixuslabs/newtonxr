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
import type { Group, Mesh, Object3D } from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { clone } from "three/examples/jsm/utils/SkeletonUtils.js";

import { joints } from "../constants.js";
import { SpatialHand } from "../SpatialHand.js";

export interface JointRefs {
  physicsRef: RefObject<RapierRigidBody>;
  meshRef: RefObject<Mesh>;
}

const assignBonePhysRefs = (motionHandObject: MotionHand) => {
  const mesh = motionHandObject.getObjectByProperty("type", "SkinnedMesh")!;
  mesh.frustumCulled = false;
  mesh.castShadow = true;
  mesh.receiveShadow = true;

  const jointsMap = new Map<XRHandJoint, JointRefs>();
  const jointMeshRef = new Map<XRHandJoint, RefObject<Object3D>>();

  for (const jointName of joints) {
    const bone = motionHandObject.getObjectByName(jointName);
    if (bone == null) {
      continue;
    }

    const physicsRef = createRef<RapierRigidBody>();
    const jointRef = createRef<Mesh>();

    jointsMap.set(jointName, {
      physicsRef: physicsRef,
      meshRef: jointRef,
    });

    jointMeshRef.set(jointName, jointRef);
  }
  return jointsMap;
};

const updatePhysBone = (
  object: MotionHand,
  frame: XRFrame,
  referenceSpace: XRReferenceSpace,
  jointRefs: Map<XRHandJoint, JointRefs>,
) => {
  let poseValid = true;

  for (const inputJoint of object.hand.values()) {
    const bone = object.boneMap.get(inputJoint.jointName);
    const jointMaps = jointRefs.get(inputJoint.jointName);
    if (!bone || !jointMaps) {
      continue;
    }

    const jointPhysRef = jointMaps.physicsRef;
    const jointPose = frame.getJointPose?.(inputJoint, referenceSpace);

    if (jointPose != null && jointPhysRef.current != null) {
      const { position, orientation } = jointPose.transform;

      jointPhysRef.current.setNextKinematicTranslation(
        vec3({ x: position.x, y: position.y, z: position.z }),
      );

      jointPhysRef.current.setNextKinematicRotation(
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
      break;
    }
  }

  return poseValid;
};

export const PhysHand = forwardRef<
  Group,
  {
    hand: XRHand;
    inputSource: XRInputSource;
    id: number;
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
>(({ hand, inputSource, id }, ref) => {
  const handUrl = getMotionHandModelUrl(inputSource.handedness);

  const { scene: handScene } = useLoader(GLTFLoader, handUrl);

  const clonedHandScene = useMemo(() => clone(handScene), [handScene]);

  const motionHandObject = useMemo(
    () => createMotionHand(hand, clonedHandScene),
    [clonedHandScene, hand],
  );

  const jointsMap = useMemo(
    () => assignBonePhysRefs(motionHandObject),
    [motionHandObject],
  );

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
    const validPose = updatePhysBone(
      motionHand,
      frame,
      referenceSpace,
      jointsMap,
    );
    motionHand.visible = validPose;
  });

  // useImperativeHandle(ref, () => motionHandRef, [motionHandRef]);

  return (
    <>
      <group name="hand">
        {/* Joints */}
        {Array.from(jointsMap.entries()).map(
          ([boneName, { physicsRef, meshRef }]) => (
            <RigidBody
              name={boneName}
              ref={physicsRef}
              key={boneName + String(id)}
              type="kinematicPosition"
              colliders="trimesh"
              restitution={0}
              ccd
            >
              <mesh ref={meshRef}>
                <sphereGeometry args={[0.002, 8, 8]} />
                <meshBasicMaterial wireframe color={"white"} />
              </mesh>
            </RigidBody>
          ),
        )}
        {/* Bones */}
        {/* <HandBones jointsMap={jointsMap} /> */}
        <SpatialHand hand={hand} inputSource={inputSource} id={id} />
      </group>
    </>
  );
});

PhysHand.displayName = "PhysHand";
