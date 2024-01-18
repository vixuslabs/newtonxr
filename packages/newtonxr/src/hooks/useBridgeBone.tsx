import React from "react";
import {
  interactionGroups,
  RigidBody,
  useFixedJoint,
  type RapierRigidBody,
} from "@react-three/rapier";

import { useNewton, type HandBoneNames } from "../index.js";

function useBridgeBone(
  ref: React.RefObject<RapierRigidBody>,
  handedness: "left" | "right",
  name: HandBoneNames,
  // visible? = false,
) {
  const handBones = useNewton((state) => state.hands[handedness]?.bones);

  const bone = handBones?.get(name);

  useFixedJoint(ref, bone!.bridgeBoneRef, [
    [0, 0, 0],
    [0, 0, 0, 1],
    [0, 0, 0],
    [0, 0, 0, 1],
  ]);

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
