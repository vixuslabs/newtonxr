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

  useFrame(() => {
    const handModel = handRef.current;
    const physicsHand = physicsRef.current;
    if (handModel && physicsHand) {
      console.log("-----------");

      console.log("handModel", handModel);
      console.log("handModel.position", handModel.position);
      console.log("handModel.rotation", handModel.rotation);
      // handWorldPosition.current.applyMatrix4(handModel.matrixWorld);
      console.log("---");
      // console.log("handModel.position", handModel.position);
      // console.log("handModel.rotation", handModel.rotation);
      // handModel.getWorldPosition(handWorldPosition.current);
      // handWorldPosition.current.setFromMatrixPosition(handModel.matrix);
      // handModel.getWorldQuaternion(handWorldQuaternion.current);
      // console.log("handWorldPosition", handWorldPosition.current);
      // console.log("handWorldQuaternion", handWorldQuaternion.current);

      // physicsHand.setNextKinematicRotation(handWorldQuaternion.current);

      handModel.matrix.decompose(
        handWorldPosition.current,
        handWorldQuaternion.current,
        handWorldScale.current,
      );
      console.log("---");

      console.log("handWorldPosition", handWorldPosition.current);
      console.log("handWorldQuaternion", handWorldQuaternion.current);

      physicsHand.setNextKinematicTranslation(handWorldPosition.current);
      physicsHand.setNextKinematicRotation(handWorldQuaternion.current);

      console.log("physicsHand.translation()", physicsHand.translation());
      console.log("physicsHand.rotation()", physicsHand.rotation());

      console.log("---------");
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
          // gravityScale={0}
        >
          <DynamicHandModel
            ref={handRef}
            hand={hand}
            handedness={inputSource.handedness}
          >
            <HandBoneGroup
              rotationJoint="wrist"
              joint={["thumb-tip", "index-finger-tip"]}
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
