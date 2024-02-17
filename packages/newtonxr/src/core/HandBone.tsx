"use client";

import React, { forwardRef } from "react";
import { interactionGroups, RigidBody } from "@react-three/rapier";
import type {
  RapierRigidBody,
  RigidBodyAutoCollider,
} from "@react-three/rapier";

import useBridgeBone from "../hooks/useBridgeBone.js";
import { useForwardedRef } from "../hooks/useForwardedRef.js";
import type { BridgeHandBoneUserData } from "./BridgeHandBone.js";
import type { HandBoneNames } from "./index.js";

export interface BoneProps {
  name: HandBoneNames;
  visible: boolean;
  // args: Vector3Tuple;
  args: [
    width?: number,
    height?: number,
    depth?: number,
    widthSegments?: number,
    heightSegments?: number,
    depthSegments?: number,
  ];
  handedness: "left" | "right";
  rigidBodyType?: "dynamic" | "kinematicPosition" | "kinematicVelocity";
  height?: number;
  collider?: RigidBodyAutoCollider;
  children?: React.ReactNode;
}

type HandBoneRef = React.RefObject<RapierRigidBody>;

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
      args,
      rigidBodyType = "dynamic",
      handedness,
      height,
      collider = "cuboid",
      // visibleHandRef,
      children,
    },
    ref,
  ) => {
    const visibleBoneRef = useForwardedRef(ref);

    const BridgeBone = useBridgeBone(visibleBoneRef, handedness, name);

    console.log("\n------HandBone----------");

    return (
      <>
        <RigidBody
          ref={visibleBoneRef}
          type={rigidBodyType}
          gravityScale={0}
          restitution={0}
          friction={0}
          colliders={collider}
          collisionGroups={interactionGroups([0], [6, 7, 8])}
          onCollisionEnter={({ other }) => {
            // console.log("bone collision enter ", payload);

            if (
              (other.rigidBody?.userData as BridgeHandBoneUserData).type ===
              "bridge-hand-bone"
            ) {
              console.log("colliding with bridge-hand-bone");
            }
            if (visibleBoneRef) {
              visibleBoneRef.current.lockRotations(true, true);
            }
          }}
          onCollisionExit={({ other }) => {
            // console.log("bone collision exit ", payload);

            if (
              (other.rigidBody?.userData as BridgeHandBoneUserData).type ===
              "bridge-hand-bone"
            ) {
              console.log("colliding with bridge-hand-bone");
            }

            if (visibleBoneRef) {
              visibleBoneRef.current.lockRotations(false, true);
            }
          }}
          // ccd
        >
          {children ? (
            children
          ) : (
            <mesh visible={visible}>
              {/* <cylinderGeometry args={[0.1, 0.1, height ?? 0.05 / 2, 32]} /> */}
              {/* <boxGeometry args={[0.1, height, 0.1]} /> */}
              <boxGeometry args={args} />
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
