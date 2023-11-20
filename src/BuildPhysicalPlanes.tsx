"use client";
import { useTrackedPlanes, TrackedPlane } from "@coconut-xr/natuerlich/react";
import { getPlaneId } from "@coconut-xr/natuerlich";
import { RigidBody } from "@react-three/rapier";
import React, { useRef } from "react";

import type { RapierRigidBody } from "@react-three/rapier";
interface BuildPhysicalPlanesProps {
  children: React.ReactNode;
  debug?: boolean;
}

export function BuildPhysicalPlanes({
  children,
  debug = false,
}: BuildPhysicalPlanesProps) {
  const planes = useTrackedPlanes();
  const planeRef = useRef<THREE.Mesh>(null);
  const rigidBodyRef = useRef<RapierRigidBody>(null);

  return (
    <group name="room-planes">
      {planes?.map((plane) => (
        <RigidBody key={getPlaneId(plane)} ref={rigidBodyRef}>
          <TrackedPlane
            plane={plane}
            ref={planeRef}
            // meshRef={meshRef}
            // rigidBodyRef={rigidBodyRef}
          >
            {children ? (
              children
            ) : (
              <meshPhongMaterial
                wireframe={debug}
                opacity={debug ? 100 : 0}
                transparent={!debug}
                color={debug ? "red" : "white"}
              />
            )}
          </TrackedPlane>
        </RigidBody>
      ))}
    </group>
  );
}
