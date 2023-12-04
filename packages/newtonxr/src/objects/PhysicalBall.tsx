"use client";

import React, { forwardRef, useImperativeHandle, useMemo, useRef } from "react";
import type { ThreeEvent } from "@react-three/fiber";
import { interactionGroups, RigidBody, vec3 } from "@react-three/rapier";
import type { RapierRigidBody } from "@react-three/rapier";

import { Grabbable } from "../core/Grabbable.js";
import type { GrabProps, RigidAndMeshRefs } from "../core/Grabbable.js";

interface PhysicalBallProps {
  children?: React.ReactNode;
  position?: [number, number, number];
  ballRadius?: number;
  mass?: number;
  name?: string;
  gravityScale?: number;
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

// eslint-disable-next-line react/display-name
export const PhysicalBall = forwardRef<
  React.RefObject<RapierRigidBody>,
  PhysicalBallProps
>(
  (
    {
      children,
      position = [0, 0, 0],
      ballRadius = 0.1,
      name = "ball",
      gravityScale = 1,
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
      // rigidRef: ref ? (ref as React.RefObject<RapierRigidBody>) : rigidRef,
      rigidRef: rigidRef,
      meshRef,
    });

    // const handleDefaultGrab = () => {
    const handleDefaultGrab = (e: ThreeEvent<PointerEvent>) => {
      console.log("handleDefaultGrab");
      console.log("rigidRef", rigidRef);
      console.log("e.distanceToRay", e.distanceToRay);
      if (rigidRef.current) {
        rigidRef.current.setTranslation(vec3(e.point), true);
        rigidRef.current.resetTorques(true);
        rigidRef.current.resetForces(true);
        rigidRef.current.setAngvel(ZeroVector, true);
      } else {
        console.log("rigidRef.current is not set");
      }
    };

    const handleDefaultRelease = (
      e: ThreeEvent<PointerEvent>,
      velocity?: THREE.Vector3,
    ) => {
      console.log("handleDefaultRelease");
      if (rigidRef.current) {
        rigidRef.current?.setGravityScale(gravityScale, true);
        rigidRef.current.applyImpulse(vec3(velocity), true);
        // rigidRef.current.setLinvel(vec3(velocity), true);
      } else {
        console.log("rigidRef.current is not set");
      }
    };

    useImperativeHandle(ref, () => rigidRef, [rigidRef]);
    return (
      // <Suspense>
      <RigidBody
        name="physicalBall"
        ref={rigidRef}
        position={position}
        gravityScale={gravityScale}
        colliders="ball"
        type="dynamic"
        collisionGroups={interactionGroups([8], [0, 1, 2, 3, 4, 5, 6, 7])}
        // canSleep={false}
        // ccd
      >
        <GrabbableComponent
          ref={rigidAndMeshRef}
          name={name}
          physicsActive
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
      // </Suspense>
    );
  },
);

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
