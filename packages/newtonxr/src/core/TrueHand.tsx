import React, { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import {
  interactionGroups,
  RapierRigidBody,
  RigidBody,
  useRapier,
} from "@react-three/rapier";

import { useConst, useForceUpdate } from "../utils/utils.js";
import { LinkBones, LinkBoness } from "./LinkBones.js";
import { SyncBone } from "./SyncBone.js";
import TrueHandClass from "./TrueHandClass.js";

interface TrueHandProps {
  inputSource: XRInputSource;
  XRHand: XRHand;
  handedness: XRHandedness;
  children?: React.ReactNode;
  id?: number;
}

export function TrueHand({
  handedness,
  XRHand,
  inputSource,
  id,
}: TrueHandProps) {
  const forceUpdate = useForceUpdate();
  const { world } = useRapier();

  const hand = useConst<TrueHandClass>(
    () =>
      new TrueHandClass({
        handedness,
        rapier: world,
      }),
  );

  useEffect(() => {
    // hand.visible = true;
    hand.setUpdateCallback(forceUpdate);
    // setStateHand(hand);
    return () => {
      // setStateHand(undefined);
      hand.clearUpdateCallback();
      // resetWorldProxy();
    };
  }, [forceUpdate]);

  useEffect(() => {
    return () => {
      console.log("TrueHand - cleanup");
      hand.reset();
    };
  }, []);

  useFrame((state, delta, xrFrame) => {
    if (!hand) {
      console.log("TrueHand - no hand");
      return;
    }

    if (!inputSource.hand) {
      console.log("TrueHand - no inputSource.hand");
      return;
    }

    if (!xrFrame) {
      console.log("TrueHand - no xrFrame");
      return;
    }

    const referenceSpace = state.get().gl.xr.getReferenceSpace();

    if (!referenceSpace) {
      console.log("TrueHand - no referenceSpace");
      return;
    }

    if (!XRHand) {
      console.log("TrueHand - no XRHand");
      return;
    }

    hand.updateBonesOnFrame(XRHand, xrFrame, referenceSpace);
  });

  return (
    <>
      {hand.bones.map((bone) => {
        if (!bone.boxArgs.height) return null;
        return (
          <Fragment key={bone.id}>
            {/* Bridge Bone */}
            <RigidBody
              ref={bone.refs.kinematicBoneRef}
              type="kinematicPosition"
              colliders={false}
              canSleep={false}
              collisionGroups={interactionGroups([], [])}
            >
              <mesh visible={false}>
                <boxGeometry
                  args={[
                    bone.boxArgs.width,
                    bone.boxArgs.height,
                    bone.boxArgs.depth,
                  ]}
                />
                <meshBasicMaterial wireframe color="black" />
              </mesh>
            </RigidBody>

            {/* Visible Bone */}
            <RigidBody
              ref={bone.refs.trueBoneRef}
              type="dynamic"
              gravityScale={0}
              restitution={0}
              // friction={0}
              canSleep={false}
              colliders="cuboid"
              userData={{ name: bone.name }}
              // interacts with objects and TrackedMeshes
              collisionGroups={interactionGroups([0], [7, 8])}
              density={5}
              // dominanceGroup={5}
              onCollisionEnter={(payload) => {
                const { target } = payload;
                console.log("bone collision enter ", payload);
                target.rigidBody?.lockRotations(true, true);
                // target.rigidBody?.lockTranslations(true, true);
              }}
              onCollisionExit={(payload) => {
                const { target } = payload;
                // console.log("bone collision exit ", payload);
                target.rigidBody?.lockRotations(false, true);
                // target.rigidBody?.lockTranslations(false, true);
              }}
              ccd
            >
              <mesh visible={true}>
                <boxGeometry
                  args={[
                    bone.boxArgs.width,
                    bone.boxArgs.height ?? 0.03,
                    bone.boxArgs.depth,
                  ]}
                  // args={[bone.boxArgs.width, 0.04, bone.boxArgs.depth]}
                />
                <meshBasicMaterial transparent opacity={0.5} color="white" />
              </mesh>
            </RigidBody>
          </Fragment>
        );
      })}
    </>
  );
}
