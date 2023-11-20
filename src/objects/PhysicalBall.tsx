"use client";

import React, { forwardRef, useMemo, useRef } from "react";
import { RigidBody, vec3 } from "@react-three/rapier";
import { Grabbable } from "../core/Grabbable.js";

import type { RigidAndMeshRefs, GrabProps } from "../core/Grabbable.js";
import type { ThreeEvent } from "@react-three/fiber";
import type { RapierRigidBody } from "@react-three/rapier";

interface PhysicalBallProps {
  children?: React.ReactNode;
  ballRadius?: number;
  name?: string;
  GrabbableComponent?: React.ForwardRefExoticComponent<
    GrabProps & React.RefAttributes<RigidAndMeshRefs>
  >;
  handleGrab?: (e: ThreeEvent<PointerEvent>) => void;
  handleRelease?: (
    e: ThreeEvent<PointerEvent>,
    velocity?: THREE.Vector3,
  ) => void;
}

/**
 * Component to create a ball
 * @param children - should be the mesh material for the ball
 * @param name - name of the ball
 * @param GrabbableComponent - component to use for grabbing, defaults to default Grabbable Component
 * @returns A virtual ball which can be grabbed and interact with the environment
 */

const PhysicalBall = forwardRef<
  React.RefObject<RapierRigidBody>,
  PhysicalBallProps
>(
  (
    {
      children,
      ballRadius = 0.1,
      name = "ball",
      GrabbableComponent = Grabbable,
      handleGrab,
      handleRelease,
    },
    ref,
  ) => {
    const rigidRef = useRef<RapierRigidBody>(null);
    const meshRef = useRef<THREE.Mesh>(null);
    const ZeroVector = useMemo(() => vec3({ x: 0, y: 0, z: 0 }), []);

    const rigidAndMeshRef = useRef({
      rigidRef: ref ? (ref as React.RefObject<RapierRigidBody>) : rigidRef,
      meshRef,
    });

    const handleDefaultGrab = (
      e: ThreeEvent<PointerEvent>,
      rigidRef?: React.RefObject<RapierRigidBody>,
    ) => {
      if (rigidRef && rigidRef.current) {
        rigidRef.current.setTranslation(vec3(e.point), true);
        rigidRef.current.resetTorques(true);
        rigidRef.current.resetForces(true);
        rigidRef.current.setAngvel(ZeroVector, true);
        rigidRef.current.setGravityScale(0, true);
      } else {
        console.log("rigidRef.current is not set");
      }
    };

    const handleDefaultRelease = (
      e: ThreeEvent<PointerEvent>,
      velocity?: THREE.Vector3,
    ) => {
      if (rigidRef.current) {
        rigidRef.current?.setGravityScale(1, true);
        rigidRef.current.setLinvel(vec3(velocity), true);
      } else {
        console.log("rigidRef.current is not set");
      }
    };

    return (
      <RigidBody ref={rigidRef}>
        <GrabbableComponent
          ref={rigidAndMeshRef}
          name={name}
          handleGrab={handleGrab ? handleGrab : handleDefaultGrab}
          handleRelease={handleRelease ? handleRelease : handleDefaultRelease}
        >
          {children ? (
            children
          ) : (
            <>
              <sphereGeometry args={[ballRadius, 32, 32]} />
              <meshBasicMaterial color="hotpink" />
            </>
          )}
        </GrabbableComponent>
      </RigidBody>
    );
  },
);

export default PhysicalBall;

// export default function _PhysicalBall({
//   children,
//   name = "ball",
//   GrabbableComponent = Grabbable,
// }: PhysicalBallProps) {
//   const rigidRef = React.useRef<RapierRigidBody>(null);
//   const meshRef = React.useRef<THREE.Mesh>(null);

//   const rigidAndMeshRef = React.useRef({
//     rigidRef,
//     meshRef,
//   });

//   return (
//     <RigidBody ref={rigidRef}>
//       <GrabbableComponent ref={rigidAndMeshRef} name={name}>
//         {children}
//       </GrabbableComponent>
//     </RigidBody>
//   );
// }
