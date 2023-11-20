"use client";

import React, { forwardRef, useMemo, useRef } from "react";
// import { vec3 } from "@react-three/rapier";
import { isXIntersection } from "@coconut-xr/xinteraction";

import type { RapierRigidBody } from "@react-three/rapier";
import type { ThreeEvent } from "@react-three/fiber";
import type { MutableRefObject } from "react";
// import { useNewton } from "../state.js";
import { useHeldObjects } from "../index.js";

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
  handleGrab: (e: ThreeEvent<PointerEvent>) => void;
  handleRelease: (
    e: ThreeEvent<PointerEvent>,
    velocity?: THREE.Vector3,
  ) => void;
  isDeletable?: boolean;
}

export const Grabbable = forwardRef<RigidAndMeshRefs, GrabProps>(
  ({ name, children, handleGrab, handleRelease }, ref) => {
    // const newton = useNewton();
    const { heldObject: leftHeldObject } = useHeldObjects("left");
    const { heldObject: rightHeldObject } = useHeldObjects("right");
    const downState = useRef<{
      pointerId: number;
      pointToObjectOffset: THREE.Vector3;
      zPosition: number;
      positions: THREE.Vector3[];
      timestamps: number[];
    }>();
    const maxEntries = useMemo(() => 5, []);
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

    // const handleDefaultGrab = (
    //   e: ThreeEvent<PointerEvent>,
    //   rigidRef?: React.RefObject<RapierRigidBody>
    // ) => {
    //   if (rigidRef && rigidRef.current) {
    //     rigidRef.current.setTranslation(vec3(e.point), true);
    //     rigidRef.current.resetTorques(true);
    //     rigidRef.current.resetForces(true);
    //     rigidRef.current.setAngvel(vec3({ x: 0, y: 0, z: 0 }), true);
    //     rigidRef.current.setGravityScale(0, true);
    //   } else {
    //     console.log("rigidRef.current is not set");
    //   }
    // };

    // const handleDefaultRelease = (
    //   e: ThreeEvent<PointerEvent>,
    //   velocity?: THREE.Vector3
    // ) => {
    //   if (rigidRef.current) {
    //     rigidRef.current?.setGravityScale(1, true);
    //     rigidRef.current.setLinvel(vec3(velocity), true);
    //   } else {
    //     console.log("rigidRef.current is not set");
    //   }
    // };

    return (
      <mesh
        name={name}
        ref={meshRef}
        onPointerDown={(e) => {
          if (
            meshRef.current != null &&
            meshRef.current.visible &&
            downState.current == null &&
            isXIntersection(e)
          ) {
            e.stopPropagation();
            (e.target as HTMLElement).setPointerCapture(e.pointerId);

            downState.current = {
              pointerId: e.pointerId,
              pointToObjectOffset: meshRef.current.position
                .clone()
                .sub(e.point),
              zPosition: e.point.z,
              positions: [],
              timestamps: [],
            };
            handleGrab(e);
          }
        }}
        onPointerUp={(e) => {
          if (downState.current?.pointerId != e.pointerId) {
            return;
          }
          if (
            downState.current.positions.length > 1 &&
            downState.current.timestamps
          ) {
            const lastIndex = downState.current.positions.length - 1;
            const deltaTime =
              (downState.current.timestamps[lastIndex]! -
                downState.current.timestamps[0]!) /
              1000;

            const deltaPosition = downState.current.positions[
              lastIndex
            ]!.clone().sub(downState.current.positions[0]!);
            const velocity = deltaPosition.divideScalar(deltaTime);

            downState.current = undefined;

            handleRelease(e, velocity);
          }
        }}
        onPointerMove={(e) => {
          if (
            meshRef.current == null ||
            downState.current == null ||
            !isXIntersection(e)
          ) {
            return;
          }

          const heldByLeft = leftHeldObject === meshRef.current.uuid;
          const heldByRight = rightHeldObject === meshRef.current.uuid;

          if (!heldByLeft || !heldByRight) return;

          // if (
          //   leftController &&
          //   leftController.gamepad.buttons["x-button"] ===
          //     ButtonState.PRESSED &&
          //   leftController.gamepad.buttons["y-button"] ===
          //     ButtonState.PRESSED &&
          //   isAnchorable
          // ) {
          //   console.log("setting object pressed");
          //   downState.current = undefined;
          //   handleAnchor();
          //   return;
          // }

          const timeStamp = new Date().getTime();
          downState.current.positions.push(e.point);
          downState.current.timestamps.push(timeStamp);

          if (downState.current.positions.length > maxEntries) {
            downState.current.positions.shift();
            downState.current.timestamps.shift();
          }

          // if (handness) {
          //   adjustPositionByThumbstick(handness, e);
          // }
        }}
      >
        {children}
      </mesh>
    );
  },
);

// export default function Grabbable() {
//   return (
//     <>
//       <></>
//     </>
//   );
// }
