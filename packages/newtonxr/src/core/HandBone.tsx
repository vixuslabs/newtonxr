"use client";

import React, { forwardRef } from "react";
// import React, { forwardRef, useImperativeHandle, useRef } from "react";
import type { MutableRefObject, RefObject } from "react";
// import type { MotionHand } from "@coconut-xr/natuerlich";
// import { useFrame } from "@react-three/fiber";
import { interactionGroups, RigidBody, vec3 } from "@react-three/rapier";
import type {
  RapierRigidBody,
  RigidBodyAutoCollider,
} from "@react-three/rapier";
import { Vector3, type Quaternion } from "three";

export interface BoneProps {
  height?: number;
  collider?: RigidBodyAutoCollider;
  children?: React.ReactNode;
}

/**
 * GOING TO GET RID OF, USED IT BEFORE, BUT THEN SWITCHED METHODS
 * SO NOT USING FOR REFERENCE ONLY
 */
export function calculateBonePositionAndOrientation(
  startJointRef: MutableRefObject<RapierRigidBody>,
  endJointRef: MutableRefObject<RapierRigidBody>,
  boneRef: RefObject<RapierRigidBody>,
  p: RefObject<Vector3>,
  o: RefObject<Vector3>,
  q: RefObject<Quaternion>,
): boolean {
  let isBone = true;
  if (p.current === null) {
    console.log("p null ", p);
    isBone = false;
    return isBone;
  }

  if (o.current === null) {
    console.log("o null ", o);
    isBone = false;
    return isBone;
  }

  if (q.current === null) {
    console.log("q null ", q);
    isBone = false;
    return isBone;
  }

  const startJoint = startJointRef.current;
  const endJoint = endJointRef.current;

  console.log("startJoint ", startJoint);
  console.log("endJoint ", endJoint);

  if (startJoint === null) {
    console.log("startJoint null ", startJoint);
    isBone = false;
    return isBone;
  }

  if (endJoint === null) {
    console.log("endJoint null ", endJoint);
    isBone = false;
    return isBone;
  }

  const startPosition = vec3(startJoint.translation());
  const endPosition = vec3(endJoint.translation());

  // const height = startPosition.distanceTo(endPosition);

  // Calculate the position of the bone
  //   const position = new Vector3()
  //     .addVectors(startPosition, endPosition)
  //     .multiplyScalar(0.5);
  const position = p.current.lerpVectors(startPosition, endPosition, 0.5);

  const startToEnd = o.current
    .subVectors(endPosition, startPosition)
    .normalize();

  /**
   * Is this right???
   */
  const orientation = q.current.setFromUnitVectors(
    new Vector3(0, 1, 0),
    startToEnd,
  );

  boneRef.current!.setNextKinematicTranslation(position);
  boneRef.current!.setNextKinematicRotation(orientation);
  // boneRef.current!.setNextKinematicRotation(quat(startJoint.rotation()));

  console.log("boneRef.current ", boneRef.current);

  return isBone;

  // return height;
  // return { position, orientation, height };
}

/**
 * Represents a bone within your hand in a physics simulation.
 * @param height The height of the bone.
 * @param collider The collider to attach to the bone.
 * @param children The child components of the bone.
 * @param ref A reference to the bone's underlying RapierRigidBody.
 * @returns The Bone component.
 */
export const HandBone = forwardRef<RapierRigidBody, BoneProps>(
  ({ height, collider, children }, ref) => {
    // const boneRef = useRef<RapierRigidBody>(null);
    // useImperativeHandle(ref, () => boneRef.current!);

    return (
      <RigidBody
        ref={ref}
        type="kinematicPosition"
        restitution={0.1}
        colliders={collider ?? undefined}
        collisionGroups={interactionGroups([0], [8])}
        onCollisionEnter={(payload) => {
          console.log("bone collision enter ", payload);
        }}
        onCollisionExit={(payload) => {
          console.log("bone collision exit ", payload);
        }}
        ccd
      >
        {children ? (
          children
        ) : (
          <mesh>
            <cylinderGeometry args={[0.1, 0.1, height, 32]} />
            <meshBasicMaterial wireframe color={"white"} />
          </mesh>
        )}
      </RigidBody>
    );
  },
);

HandBone.displayName = "HandBone";
