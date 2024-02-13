import React, { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import {
  interactionGroups,
  RapierRigidBody,
  RigidBody,
  useRapier,
} from "@react-three/rapier";

import { useConst, useForceUpdate } from "../utils/utils.js";
import { BridgeBone } from "./HandBuilder.js";
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
    // console.log("-----------------TrueHand - useFrame-----------------");
    // console.log("TrueHand - hand", hand);
    // console.log("TrueHand - XRHand", XRHand);
    // console.log("TrueHand - inputSource.hand", inputSource.hand);
    // console.log("-----------------TrueHand - useFrame-----------------");

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
      // hand.visible = false;
      return;
    }

    const referenceSpace = state.get().gl.xr.getReferenceSpace();

    if (!referenceSpace) {
      console.log("TrueHand - no referenceSpace");
      // hand.visible = false;
      return;
    }

    if (!XRHand) {
      console.log("TrueHand - no XRHand");
      // hand.visible = false;
      return;
    }

    hand.updateBonesOnFrame(XRHand, xrFrame, referenceSpace);

    // console.log(
    //   "hand.rapier.impulseJoints",
    //   hand.rapier.impulseJoints.getAll(),
    // );

    // hand.updateKinematicHand(XRHand, xrFrame, referenceSpace);
  });

  return (
    <>
      {hand.bones.map((bone) => {
        return (
          <Fragment key={bone.id}>
            {/* Bridge Bone */}
            <RigidBody
              ref={bone.refs.kinematicBoneRef}
              type="kinematicPosition"
              colliders={false}
              collisionGroups={interactionGroups([], [])}
            >
              <mesh visible={hand.visible}>
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

            {/* <LinkBones
              kinematicBone={bone.bridgeBoneRef}
              trueBone={bone.visibleBoneRef}
            /> */}

            {/* <LinkBoness boneName={bone.name} ref={bone.refs} /> */}

            <SyncBone bone={bone} />

            {/* Visible Bone */}
            {/* <RigidBody
              ref={bone.refs.trueBoneRef}
              type="dynamic"
              gravityScale={0}
              restitution={0}
              colliders="cuboid"
              collisionGroups={interactionGroups([0], [6, 7, 8])}
            >
              <mesh visible={true}>
                <boxGeometry
                  args={[
                    bone.boxArgs.width,
                    bone.boxArgs.height,
                    bone.boxArgs.depth,
                  ]}
                />
                <meshBasicMaterial color="white" />
              </mesh>
            </RigidBody> */}
          </Fragment>
        );
      })}
    </>
  );
}
