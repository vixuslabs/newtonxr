"use client";

import React, { forwardRef } from "react";
import { interactionGroups, RigidBody } from "@react-three/rapier";
import type {
  RapierRigidBody,
  RigidBodyAutoCollider,
} from "@react-three/rapier";

export interface BoneProps {
  height?: number;
  collider?: RigidBodyAutoCollider;
  children?: React.ReactNode;
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
