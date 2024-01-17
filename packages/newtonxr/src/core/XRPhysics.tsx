"use client";

import React, { Suspense } from "react";
import { Physics } from "@react-three/rapier";
import type { PhysicsProps } from "@react-three/rapier";

import XRConfig from "./XRConfig.js";

export function XRPhysics({ children, ...rest }: PhysicsProps) {
  return (
    <Suspense>
      <Physics {...rest}>
        <XRConfig />
        {children}
      </Physics>
    </Suspense>
  );
}
