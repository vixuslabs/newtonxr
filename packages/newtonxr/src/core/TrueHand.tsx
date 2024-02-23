import React, { useEffect, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { useRapier, type RigidBodyOptions } from "@react-three/rapier";

import { useForceUpdate } from "../utils/utils.js";
import TrueHandClass from "./TrueHandClass.js";

interface TrueHandProps extends RigidBodyOptions {
  inputSource: XRInputSource;
  XRHand: XRHand;
  handedness: XRHandedness;
  bonesVisible?: boolean;
  boneShape?: "cylinder" | "cuboid";
  id?: number;
}

export function TrueHand({
  inputSource,
  bonesVisible: _ = false,
  boneShape: __ = "cylinder",
  id,
  ...props
}: TrueHandProps) {
  const forceUpdate = useForceUpdate();
  const { world, rigidBodyStates, colliderStates } = useRapier();

  const hand = useMemo(() => {
    console.log("TrueHand - handMemo called");
    return new TrueHandClass({
      handedness: inputSource.handedness,
      rapierWorld: world,
      rigidBodyStates,
      colliderStates,
    });
  }, [world]);

  useEffect(() => {
    hand.setUpdateCallback(forceUpdate);
    return () => {
      hand.clearUpdateCallback();
    };
  }, [forceUpdate]);

  // useEffect(() => {
  //   // hand.boneRigidBodies.forEach((rb) => {
  //   //   rigidBodyStates.set(rb.handle, rb);
  //   // });
  // }, [hand.boneData]);

  useEffect(() => {
    return () => {
      console.log("TrueHand - cleanup");
      hand.reset();
    };
  }, [hand]);

  useFrame((state, ____, xrFrame) => {
    if (!hand) {
      console.log("TrueHand - no hand");
      return;
    }

    if (!inputSource.hand) {
      console.log("TrueHand - no XRHand");
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

    hand.updateHandOnFrame(inputSource.hand, xrFrame, referenceSpace);
  });

  // console.log("\n---------- TrueHand -------------");
  // console.log("hand", hand);
  // console.log("hand.trueHand: ", hand.trueHand);
  // console.log("hand.kinematicHand: ", hand.kinematicHand);
  // console.log("hand.wrist", hand.wrist);
  // console.log(
  //   "hand.wrist.rigidBodies.kinematicWrist.current?.translation()",
  //   hand.wrist.rigidBodies.kinematicWrist.current?.translation(),
  // );
  // console.log(
  //   "hand.wrist.rigidBodies.trueWrist.current?.translation()",
  //   hand.wrist.rigidBodies.trueWrist.current?.translation(),
  // );
  // console.log("---------------------------------\n-");

  return <primitive key={id} object={hand.handGroup} />;
}
