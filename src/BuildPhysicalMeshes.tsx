"use client";
import { RigidBody } from "@react-three/rapier";
import React, { useRef } from "react";
import { useTrackedMeshes, TrackedMesh } from "@coconut-xr/natuerlich/react";
import { getMeshId } from "@coconut-xr/natuerlich";

import type { RapierRigidBody } from "@react-three/rapier";
interface BuildPhysicalMeshesProps {
  children?: React.ReactNode;
  excludeGlobalMesh?: boolean;
  debug?: boolean;
}

export function BuildPhysicalMeshes({
  children,
  excludeGlobalMesh = false,
  debug = false,
}: BuildPhysicalMeshesProps) {
  const meshes = useTrackedMeshes();
  const meshRef = useRef<THREE.Mesh>(null);
  const rigidBodyRef = useRef<RapierRigidBody>(null);

  return (
    <group name="room-meshes">
      {meshes?.map((mesh) => {
        if (excludeGlobalMesh && mesh.semanticLabel === "global mesh")
          return null;
        return (
          <RigidBody
            name={mesh.semanticLabel}
            key={getMeshId(mesh)}
            type="fixed"
            colliders={
              mesh.semanticLabel === "global mesh" ? "trimesh" : "hull"
            }
            ref={rigidBodyRef}
          >
            <TrackedMesh mesh={mesh} ref={meshRef}>
              {children ? (
                children
              ) : (
                <meshBasicMaterial
                  wireframe={debug}
                  transparent={!debug}
                  opacity={debug ? 100 : 0}
                  color={debug ? "purple" : "white"}
                />
              )}
            </TrackedMesh>
          </RigidBody>
        );
      })}
    </group>
  );
}
