import React, { Fragment, useEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import {
  CuboidCollider,
  // CoefficientCombineRule,
  interactionGroups,
  // RapierRigidBody,
  RigidBody,
  RoundCylinderCollider,
  RoundCylinderColliderProps,
  useRapier,
  type RigidBodyOptions,
} from "@react-three/rapier";

import { useConst, useForceUpdate } from "../utils/utils.js";
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
  handedness,
  XRHand,
  inputSource,
  bonesVisible = true,
  boneShape = "cylinder",
  id,
  ...props
}: TrueHandProps) {
  console.log(" ----------- INSIDE TrueHand -----------");

  const forceUpdate = useForceUpdate();
  const { world } = useRapier();

  const hand = useConst<TrueHandClass>(
    () =>
      new TrueHandClass({
        handedness,
        rapierWorld: world,
      }),
  );

  useEffect(() => {
    hand.setUpdateCallback(forceUpdate);
    return () => {
      hand.clearUpdateCallback();
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

  // return (
  //   <Fragment key={id}>
  //     {hand.completeFingers.map((fingerBones) => {
  //       return (
  //         <>
  //           {fingerBones.map((bone) => (
  //             <Fragment key={`kinematicBone: ` + bone.id}>
  //               <RigidBody
  //                 ref={bone.refs.kinematicBoneRef}
  //                 type="kinematicPosition"
  //                 colliders={false}
  //                 canSleep={false}
  //                 collisionGroups={interactionGroups([], [])}
  //               >
  //                 <mesh visible={false}>
  //                   <boxGeometry
  //                     args={[
  //                       bone.boxArgs.width,
  //                       bone.boxArgs.height,
  //                       bone.boxArgs.depth,
  //                     ]}
  //                   />
  //                   <meshBasicMaterial wireframe color="black" />
  //                 </mesh>
  //               </RigidBody>
  //             </Fragment>
  //           ))}

  //           <RigidBody
  //             type="dynamic"
  //             gravityScale={0}
  //             restitution={0}
  //             // restitutionCombineRule={CoefficientCombineRule.Min}
  //             // friction={0}
  //             canSleep={false}
  //             // colliders="cuboid"
  //             colliders={false}
  //             // interacts with objects and TrackedMeshes
  //             collisionGroups={interactionGroups([0], [7, 8])}
  //             density={5}
  //             // dominanceGroup={5}
  //             onCollisionEnter={(payload) => {
  //               const { target } = payload;
  //               console.log("bone collision enter ", payload);
  //               target.rigidBody?.lockRotations(true, true);
  //               // target.rigidBody?.lockTranslations(true, true);
  //             }}
  //             onCollisionExit={(payload) => {
  //               const { target } = payload;
  //               // console.log("bone collision exit ", payload);
  //               target.rigidBody?.lockRotations(false, true);

  //               // target.rigidBody?.lockTranslations(false, true);
  //             }}
  //             ccd
  //             {...props}
  //           >
  //             {fingerBones.map((bone) => (
  //               <>
  //                 <RoundCylinderCollider></RoundCylinderCollider>
  //               </>
  //             ))}
  //           </RigidBody>
  //         </>
  //       );
  //     })}
  //   </Fragment>
  // );

  return (
    <Fragment key={id}>
      {hand.bones.map((bone) => {
        if (!bone.boxArgs.height) return null;
        return (
          <Fragment key={bone.id}>
            {/* Kinematic Bone */}
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

            {/* True Bone */}
            <RigidBody
              type="dynamic"
              gravityScale={0}
              canSleep={false}
              colliders={false}
              userData={{ name: bone.name }}
              collisionGroups={interactionGroups([0], [7, 8])}
              density={5}
              onCollisionEnter={(payload) => {
                const { target } = payload;
                console.log("bone collision enter ", payload);
                target.rigidBody?.lockRotations(true, true);
              }}
              onCollisionExit={(payload) => {
                const { target } = payload;
                target.rigidBody?.lockRotations(false, true);
              }}
              ccd
              {...props}
              ref={bone.refs.trueBoneRef}
            >
              <mesh visible={true}>
                {boneShape === "cylinder" ? (
                  <>
                    <cylinderGeometry
                      args={[
                        bone.boxArgs.width / 2,
                        bone.boxArgs.width / 2,
                        bone.boxArgs.height,
                      ]}
                    />

                    <RoundCylinderCollider
                      args={[
                        bone.boxArgs.height / 2,
                        bone.boxArgs.width / 2,
                        0,
                      ]}
                      friction={1}
                      restitution={0}
                    />
                  </>
                ) : (
                  <>
                    <boxGeometry
                      args={[
                        bone.boxArgs.width,
                        bone.boxArgs.height,
                        bone.boxArgs.depth,
                      ]}
                    />

                    <CuboidCollider
                      args={[
                        bone.boxArgs.width,
                        bone.boxArgs.height,
                        bone.boxArgs.depth,
                      ]}
                      friction={1}
                      restitution={0}
                    />
                  </>
                )}

                <meshBasicMaterial
                  transparent
                  opacity={bonesVisible ? 0.5 : 0}
                  color="white"
                />
              </mesh>
            </RigidBody>
          </Fragment>
        );
      })}
    </Fragment>
  );
}
