"use client";

import React, { forwardRef } from "react";
import { interactionGroups, RigidBody } from "@react-three/rapier";
import type {
  RapierRigidBody,
  RigidBodyAutoCollider,
} from "@react-three/rapier";

import useBridgeBone from "../hooks/useBridgeBone.js";
import type { HandBoneNames } from "./index.js";

export interface BoneProps {
  name: HandBoneNames;
  visible: boolean;
  rigidBodyType?: "dynamic" | "kinematicPosition" | "kinematicVelocity";
  handedness: "left" | "right";
  height?: number;
  collider?: RigidBodyAutoCollider;
  children?: React.ReactNode;
}

/**
 * Represents a bone within your hand in a physics simulation.
 * @param visible Whether the bone is visible.
 * @param height The height of the bone.
 * @param collider The collider to attach to the bone.
 * @param children The child components of the bone.
 * @param ref A reference to the bone's underlying RapierRigidBody.
 * @returns The Bone component.
 */
export const HandBone = forwardRef<RapierRigidBody, BoneProps>(
  (
    {
      name,
      visible,
      rigidBodyType = "dynamic",
      handedness,
      height,
      collider = "cuboid",
      children,
    },
    ref,
  ) => {
    const BridgeBone = useBridgeBone(
      ref as React.RefObject<RapierRigidBody>,
      handedness,
      name,
    );

    return (
      <>
        <RigidBody
          ref={ref}
          type={rigidBodyType}
          gravityScale={0}
          restitution={0.1}
          friction={0}
          colliders={children ? collider : "cuboid"}
          collisionGroups={interactionGroups([0], [6, 7, 8])}
          onCollisionEnter={(_) => {
            // console.log("bone collision enter ", payload);
          }}
          onCollisionExit={(_) => {
            // console.log("bone collision exit ", payload);
          }}
          // ccd
        >
          {children ? (
            children
          ) : (
            <mesh visible={visible}>
              {/* <cylinderGeometry args={[0.1, 0.1, height ?? 0.05 / 2, 32]} /> */}
              <boxGeometry args={[0.1, height, 0.1]} />
              <meshBasicMaterial wireframe color={"white"} />
            </mesh>
          )}
        </RigidBody>
        {BridgeBone}
      </>
    );
  },
);

HandBone.displayName = "HandBone";
