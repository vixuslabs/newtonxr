"use client";

import { getPlaneId } from "@coconut-xr/natuerlich";
import { TrackedPlane, useTrackedPlanes } from "@coconut-xr/natuerlich/react";
import { RigidBody } from "@react-three/rapier";
import type { RapierRigidBody } from "@react-three/rapier";
import React, { useEffect, useRef } from "react";

interface BuildPhysicalPlanesProps {
  children?: React.ReactNode;
  debug?: boolean;
}

export function BuildPhysicalPlanes({
  children,
  debug = false,
}: BuildPhysicalPlanesProps) {
  const planes = useTrackedPlanes();
  const planeRef = useRef<THREE.Mesh>(null);
  const rigidBodyRef = useRef<RapierRigidBody>(null);

  useEffect(() => {
    // planes?.forEach((plane) => {
    // planeRef.current?.geometry?.setFromPoints(plane.polygon);
    // });
  }, [planes]);

  return (
    <group name="room-planes">
      {planes?.map((plane) => (
        <RigidBody
          key={getPlaneId(plane)}
          ref={rigidBodyRef}
          colliders="cuboid"
          type="fixed"
        >
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
