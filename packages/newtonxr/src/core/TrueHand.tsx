import React, { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { interactionGroups, RigidBody, useRapier } from "@react-three/rapier";

import { useConst, useForceUpdate } from "../utils/utils.js";
import { BridgeBone } from "./HandBuilder.js";
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
  });

  return (
    <>
      {hand.bones.map((bone) => {
        return (
          <Fragment key={bone.id}>
            {/* Bridge Bone */}
            <RigidBody
              ref={bone.bridgeBoneRef}
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

            {/* Visible Bone */}
          </Fragment>
        );
      })}
    </>
  );
}
