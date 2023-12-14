"use client";

import React, { Suspense, useRef } from "react";
import {
  DynamicHandModel,
  FocusStateGuard,
  HandBoneGroup,
} from "@coconut-xr/natuerlich/react";
import { XSphereCollider } from "@coconut-xr/xinteraction/react";
import type { InputDeviceFunctions } from "@coconut-xr/xinteraction/react";
import { useFrame } from "@react-three/fiber";
import { interactionGroups, RigidBody } from "@react-three/rapier";
import type { RapierRigidBody } from "@react-three/rapier";
import { Quaternion, Vector3 } from "three";

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
  const physicsRef = useRef<RapierRigidBody>(null);
  const handRef = useRef<THREE.Group>(null);
  const handWorldPosition = useRef<THREE.Vector3>(new Vector3());
  const handWorldQuaternion = useRef<THREE.Quaternion>(new Quaternion());
  const handWorldScale = useRef<THREE.Vector3>(new Vector3());

  const correctedLQuaternionY = useRef(
    new Quaternion().setFromAxisAngle(new Vector3(0, 1, 0), -Math.PI / 2),
  ).current;

  const correctedLQuaternionZ = useRef(
    new Quaternion().setFromAxisAngle(new Vector3(0, 0, 1), -Math.PI / 2),
  ).current;

  const correctedRQuaternionY = useRef(
    new Quaternion().setFromAxisAngle(new Vector3(0, 1, 0), Math.PI / 2),
  ).current;

  const correctedRQuaternionZ = useRef(
    new Quaternion().setFromAxisAngle(new Vector3(0, 0, 1), Math.PI / 2),
  ).current;

  useFrame(() => {
    const handModel = handRef.current;
    const physicsHand = physicsRef.current;
    if (handModel && physicsHand && inputSource.handedness !== "none") {
      // console.log(`----- ${inputSource.handedness} hand ------`);
      handModel.matrix.decompose(
        handWorldPosition.current,
        handWorldQuaternion.current,
        handWorldScale.current,
      );

      if (inputSource.handedness === "left") {
        handWorldQuaternion.current.multiplyQuaternions(
          handWorldQuaternion.current,
          correctedLQuaternionY,
        );

        handWorldQuaternion.current.multiplyQuaternions(
          handWorldQuaternion.current,
          correctedLQuaternionZ,
        );
      } else {
        handWorldQuaternion.current.multiplyQuaternions(
          handWorldQuaternion.current,
          correctedRQuaternionY,
        );
        handWorldQuaternion.current.multiplyQuaternions(
          handWorldQuaternion.current,
          correctedRQuaternionZ,
        );
      }

      physicsHand.setNextKinematicTranslation(handWorldPosition.current);
      physicsHand.setNextKinematicRotation(handWorldQuaternion.current);
    }
  });

  if (inputSource.handedness === "none") return null;

  return (
    <FocusStateGuard>
      <Suspense fallback={null}>
        <RigidBody
          ref={physicsRef}
          // position={[0, 1, -0.4]}
          collisionGroups={interactionGroups(
            [0, inputSource.handedness === "left" ? 1 : 2],
            // [6, 7]
            [8],
          )}
          type="kinematicPosition"
          colliders="trimesh"
          dominanceGroup={127}
          ccd
        >
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
            {/* {children != null && (
              <HandBoneGroup joint={childrenAtJoint}>{children}</HandBoneGroup>
            )} */}
            {children}
          </DynamicHandModel>
        </RigidBody>
      </Suspense>
    </FocusStateGuard>
  );
}
