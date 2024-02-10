import React, { Fragment, useEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { interactionGroups, RigidBody, useRapier } from "@react-three/rapier";

import TrueHandClass from "./TrueHandClass.js";

interface TrueHandProps {
  inputSource: XRInputSource;
  handedness: XRHandedness;
  children?: React.ReactNode;
  id?: number;
}

export function TrueHand({ handedness, inputSource, id }: TrueHandProps) {
  const hand = useRef<TrueHandClass | undefined>();

  const { world } = useRapier();
  useEffect(() => {
    const trueHand = new TrueHandClass({
      handedness,
      rapier: world,
    });
    hand.current = trueHand;
    console.log("TrueHand - hand", trueHand);
    trueHand.setVisibility(true);

    return () => {
      console.log("TrueHand - cleanup");
      // setHand(undefined);
      hand.current?.setVisibility(false);
    };
  }, [handedness]);

  useFrame((state, delta, xrFrame) => {
    console.log("-----------------TrueHand - useFrame-----------------");
    console.log("TrueHand - hand", hand);
    console.log("-----------------TrueHand - useFrame-----------------");

    if (!hand) {
      console.log("TrueHand - no hand");
      return;
    }

    if (!hand.current?.intializedHand) {
      console.log("TrueHand - hand not initialized");
      console.log("---SHOW ONLY HAPPEN ONCE---");
      hand.current?.initHand();
      // return
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

    // hand.visible = true;
    // hand.visible ?? hand.setVisibility(true);

    console.log("TrueHand - updating hand");

    hand.current?.updateBonesOnFrame(inputSource.hand, xrFrame, referenceSpace);

    // console.log("TrueHand - hand updated");
    // console.log("TrueHand - hand", hand);
  });

  // useEffect(() => {}, [hand]);

  console.log("IN COMP GLOBAL TrueHand - hand", hand);

  return (
    <>
      {hand.current?.bones.map((bone) => {
        console.log("creating RigidBody TrueHand - bone", bone);

        return (
          <Fragment key={id}>
            {/* Bridge Bone */}
            <RigidBody
              ref={bone.bridgeBoneRef}
              type="kinematicPosition"
              colliders={false}
              collisionGroups={interactionGroups([], [])}
            >
              <mesh visible={hand.current?.visible}>
                <boxGeometry args={[0.005, bone.height, 0.004]} />
                <meshBasicMaterial color={"white"} />
              </mesh>
            </RigidBody>

            {/* Visible Bone */}
            {/* <RigidBody
            ref={bone.visibleBoneRef}
            type="dynamic"
          >


          </RigidBody> */}
          </Fragment>
        );
      })}
    </>
  );
}
