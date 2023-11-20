"use client";

import React, { Suspense } from "react";
import { Physics } from "@react-three/rapier";
import XRConfig from "./XRConfig.js";

import type { PhysicsProps } from "@react-three/rapier";

interface XRPhysicsProps extends PhysicsProps {
  //   gravity?: Vector3Tuple;
}

export function XRPhysics({
  children,
  gravity = [0, -9.81, 0],
}: XRPhysicsProps) {
  return (
    <Suspense>
      <Physics gravity={gravity}>
        <XRConfig />
        {children}
      </Physics>
    </Suspense>
  );
}
