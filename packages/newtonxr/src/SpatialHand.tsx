"use client";

import {
  DynamicHandModel,
  FocusStateGuard,
  HandBoneGroup,
  useInputSourceEvent,
} from "@coconut-xr/natuerlich/react";
import { XIntersection } from "@coconut-xr/xinteraction";
import {
  InputDeviceFunctions,
  XSphereCollider,
} from "@coconut-xr/xinteraction/react";
import {
  createPortal,
  ThreeEvent,
  useFrame,
  useThree,
} from "@react-three/fiber";
import {
  interactionGroups,
  RapierRigidBody,
  RigidBody,
} from "@react-three/rapier";
import React, { Suspense, useMemo, useRef } from "react";
import {
  ColorRepresentation,
  Event,
  Mesh,
  PositionalAudio as PositionalAudioImpl,
  Quaternion,
  Vector3,
} from "three";

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

      const scaleTest = new Vector3(1, 1, 1);

      handModel.matrix.decompose(
        handWorldPosition.current,
        handWorldQuaternion.current,
        scaleTest,
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
          </DynamicHandModel>
        </RigidBody>
      </Suspense>
    </FocusStateGuard>
  );
}
