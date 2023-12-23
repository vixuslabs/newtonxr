"use client";

import React, { Suspense, useRef } from "react";
import {
  DynamicHandModel,
  FocusStateGuard,
  HandBoneGroup,
} from "@coconut-xr/natuerlich/react";
import { XSphereCollider } from "@coconut-xr/xinteraction/react";
import type { InputDeviceFunctions } from "@coconut-xr/xinteraction/react";

interface SpacialHandProps {
  hand: XRHand;
  inputSource: XRInputSource;
  id: number;
  children?: React.ReactNode;
  radius?: number;
}

export function SpatialHand({
  hand,
  inputSource,
  id,
  children,
  radius = 0.07,
}: SpacialHandProps) {
  const colliderRef = useRef<InputDeviceFunctions>(null);
  // const physicsRef = useRef<RapierRigidBody>(null);
  const handRef = useRef<THREE.Group>(null);

  if (inputSource.handedness === "none") return null;

  return (
    <FocusStateGuard>
      <Suspense fallback={null}>
        <DynamicHandModel
          ref={handRef}
          hand={hand}
          handedness={inputSource.handedness}
        >
          <HandBoneGroup
            rotationJoint="wrist"
            // rotationJoint="middle-finger-metacarpal"
            joint={[
              "thumb-tip",
              "index-finger-tip",
              "wrist",
              "middle-finger-metacarpal",
            ]}
          >
            <XSphereCollider
              id={id}
              ref={colliderRef}
              radius={radius}
              onIntersections={() => {
                console.log("hand intersections");
              }}
            />
          </HandBoneGroup>
          {children}
        </DynamicHandModel>
      </Suspense>
    </FocusStateGuard>
  );
}
