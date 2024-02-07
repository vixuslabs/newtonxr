import React, { useRef } from "react";
import {
  interactionGroups,
  RigidBody,
  useFixedJoint,
  type RapierRigidBody,
} from "@react-three/rapier";

import { BridgeHandBone } from "../core/BridgeHandBone.js";
import { useNewton, type HandBoneNames } from "../index.js";

function useBridgeBone(
  // visibleHandRef: React.RefObject<RapierRigidBody>,
  bridgeBoneRef: React.RefObject<RapierRigidBody>,
  handedness: "left" | "right",
  name: HandBoneNames,
  // visible? = false,
) {
  // const fillerRef = useRef<RapierRigidBody>(null);
  const handBones = useNewton((state) => state.hands[handedness]?.bones);

  const bone = handBones?.get(name);

  useFixedJoint(bridgeBoneRef, bone!.bridgeBoneRef, [
    [0, 0, 0],
    [0, 0, 0, 1],
    [0, 0, 0],
    [0, 0, 0, 1],
  ]);

  // return (
  //   <BridgeHandBone
  //     ref={bone?.bridgeBoneRef}
  //     type="kinematicPosition"
  //     colliders={false}
  //     collisionGroups={interactionGroups([], [])}
  //     onCollisionEnter={() => console.log("bridge bone collision enter")}
  //   >
  //     <mesh visible={true}>
  //       {/* <cylinderGeometry args={[0.1, 0.1, height ?? 0.05 / 2, 32]} /> */}
  //       <boxGeometry args={[0.01, 0.025, 0.01]} />
  //       <meshBasicMaterial wireframe color={"red"} />
  //     </mesh>
  //   </BridgeHandBone>
  // );

  return (
    <RigidBody
      ref={bone?.bridgeBoneRef}
      type="kinematicPosition"
      colliders={false}
      collisionGroups={interactionGroups([], [])}
      onCollisionEnter={() => console.log("bridge bone collision enter")}
    >
      <mesh visible={true}>
        {/* <cylinderGeometry args={[0.1, 0.1, height ?? 0.05 / 2, 32]} /> */}
        <boxGeometry args={[0.01, 0.025, 0.01]} />
        <meshBasicMaterial wireframe color={"red"} />
      </mesh>
    </RigidBody>
  );
}

export default useBridgeBone;
