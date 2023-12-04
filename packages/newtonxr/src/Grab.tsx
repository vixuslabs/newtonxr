"use client";

import React, {
  forwardRef,
  useMemo,
  // useCallback,
  type MutableRefObject,
} from "react";
import { type ThreeEvent } from "@react-three/fiber";
// import { useNewton } from "../state.js";
// import { useControllersState } from "../hooks/useControllersState.js";

import {
  // vec3,
  type RapierRigidBody,
} from "@react-three/rapier";

// import { useControllersState, useHeldObjects } from "./index.js";

export interface RigidAndMeshRefs {
  rigidRef: React.RefObject<RapierRigidBody>;
  meshRef: React.RefObject<
    THREE.Mesh<
      THREE.BufferGeometry<THREE.NormalBufferAttributes>,
      THREE.Material | THREE.Material[],
      THREE.Object3DEventMap
    >
  >;
}

export interface GrabProps {
  name: string;
  children: React.ReactNode;
  physicsActive?: boolean;
  handleGrab: (e: ThreeEvent<PointerEvent>) => void;
  handleRelease: (
    e: ThreeEvent<PointerEvent>,
    velocity?: THREE.Vector3,
  ) => void;
  handleWhileHeld?: () => void;
}

// eslint-disable-next-line react/display-name
export const Grab = forwardRef<RigidAndMeshRefs, GrabProps>(
  (
    {
      name,
      children,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      physicsActive = false,
      handleGrab,
      handleRelease,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      handleWhileHeld,
    },
    ref,
  ) => {
    /* eslint-disable */
    const rigidRef = useMemo(
      () =>
        // @ts-expect-error - current exists
        ref!.current?.rigidRef as MutableRefObject<RapierRigidBody>,
      [ref],
    );

    const meshRef = useMemo(
      // @ts-expect-error - current exists
      () => ref!.current?.meshRef as MutableRefObject<Mesh>,
      [ref],
    );
    /* eslint-enable */

    const handlePointerDown = (e: ThreeEvent<PointerEvent>) => {
      console.log("handlePointerDown");
      handleGrab(e);
    };

    const handlePointerUp = (e: ThreeEvent<PointerEvent>) => {
      console.log("handlePointerUp");
      handleRelease(e);
    };

    return (
      <mesh
        name={name}
        ref={meshRef}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
      >
        {children}
      </mesh>
    );
  },
);
