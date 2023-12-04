"use client";

import { Physics } from "@react-three/rapier";
import type { PhysicsProps } from "@react-three/rapier";
import React, { Suspense } from "react";
import type { Vector3Tuple } from "three";

import XRConfig from "./XRConfig.js";

interface XRPhysicsProps extends PhysicsProps {
  gravity?: Vector3Tuple;
}

export function XRPhysics({
  children,
  gravity = [0, -9.81, 0],
  ...rest
}: XRPhysicsProps) {
  return (
    <Suspense>
      <Physics gravity={gravity} {...rest}>
        <XRConfig />
        {children}
      </Physics>
    </Suspense>
  );
}
