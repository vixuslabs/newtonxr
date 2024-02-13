import React from "react";
import {
  interactionGroups,
  RigidBody,
  useSpringJoint,
} from "@react-three/rapier";

import type { BoneInfo } from "./TrueHandClass.js";

export function SyncBone({ bone }: { bone: BoneInfo }) {
  const kinematicBoneRef = bone.refs.kinematicBoneRef;
  const trueBoneRef = bone.refs.trueBoneRef;

  const stiffness = 1.0e3;

  const trueBoneTranslation = trueBoneRef.current?.translation();
  const kinematicBoneTranslation = kinematicBoneRef.current?.translation();

  console.log("SyncBone - trueBoneTranslation", trueBoneTranslation);
  console.log("SyncBone - kinematicBoneTranslation", kinematicBoneTranslation);

  const joint = useSpringJoint(
    trueBoneRef,
    kinematicBoneRef,
    [
      [
        trueBoneTranslation?.x ?? 0,
        trueBoneTranslation?.y ?? 0,
        trueBoneTranslation?.z ?? 0,
      ],
      [
        kinematicBoneTranslation?.x ?? 0,
        kinematicBoneTranslation?.y ?? 0,
        kinematicBoneTranslation?.z ?? 0,
      ],
      0.1,
      stiffness,
      0.7,
    ],
    // {
    //   localAnchor1: [0, 0, 0],
    //   localAnchor2: [0, 0, 0],
    //   stiffness: 0.1,
    //   damping: 0.7,
    // }
  );

  console.log("LinkBones - joint", joint);

  return (
    <RigidBody
      ref={trueBoneRef}
      type="dynamic"
      gravityScale={0}
      restitution={0}
      colliders="cuboid"
      collisionGroups={interactionGroups([0], [6, 7, 8])}
    >
      <mesh visible={true}>
        <boxGeometry
          args={[bone.boxArgs.width, bone.boxArgs.height, bone.boxArgs.depth]}
        />
        <meshBasicMaterial color="white" />
      </mesh>
    </RigidBody>
  );
  // return (
  //   <>
  //     <></>
  //   </>
  // );
}
