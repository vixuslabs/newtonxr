"use client";

import React, {
  forwardRef,
  Suspense,
  useImperativeHandle,
  useMemo,
  useRef,
} from "react";
import { FocusStateGuard } from "@coconut-xr/natuerlich/react";
import type { ThreeEvent } from "@react-three/fiber";
import { interactionGroups, RigidBody, vec3 } from "@react-three/rapier";
import type { RapierRigidBody } from "@react-three/rapier";

import { Grabbable } from "../core/Grabbable.js";
import type { GrabProps, RigidAndMeshRefs } from "../core/Grabbable.js";

interface PhysicalBallProps {
  children?: React.ReactNode;
  position?: [number, number, number];
  ballRadius?: number;
  color?: THREE.Color | string;
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
      color = "hotpink",
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
      if (rigidRef.current) {
        rigidRef.current.setTranslation(vec3(e.point), true);
        rigidRef.current.resetTorques(true);
        rigidRef.current.resetForces(true);
        rigidRef.current.setAngvel(ZeroVector, true);
      } else {
        // throw error?
        console.log("rigidRef.current is not set");
      }
    };

    const handleDefaultRelease = (
      e: ThreeEvent<PointerEvent>,
      velocity?: THREE.Vector3,
    ) => {
      if (rigidRef.current) {
        rigidRef.current?.setGravityScale(gravityScale, true);
        rigidRef.current.applyImpulse(vec3(velocity), true);
      } else {
        // throw error?
        console.log("rigidRef.current is not set");
      }
    };

    useImperativeHandle(ref, () => rigidRef, [rigidRef]);

    return (
      <Suspense fallback={null}>
        <FocusStateGuard>
          <RigidBody
            name="physicalBall"
            ref={rigidRef}
            position={position}
            gravityScale={gravityScale}
            colliders="ball"
            type="dynamic"
            collisionGroups={interactionGroups([8], [0, 1, 2, 3, 4, 5, 6, 7])}
          >
            <GrabbableComponent
              ref={rigidAndMeshRef}
              name={name}
              physicsActive
              handleGrab={handleGrab ? handleGrab : handleDefaultGrab}
              handleRelease={
                handleRelease ? handleRelease : handleDefaultRelease
              }
            >
              {children ? (
                children
              ) : (
                <>
                  <sphereGeometry args={[ballRadius, 32, 32]} />
                  <meshBasicMaterial color={color} />
                </>
              )}
            </GrabbableComponent>
          </RigidBody>
        </FocusStateGuard>
      </Suspense>
    );
  },
);
