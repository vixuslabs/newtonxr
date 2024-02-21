import React, { Fragment, useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import {
  CuboidCollider,
  CylinderCollider,
  // CoefficientCombineRule,
  interactionGroups,
  // RapierRigidBody,
  RigidBody,
  RoundCylinderCollider,
  RoundCylinderColliderProps,
  useRapier,
  type RigidBodyOptions,
} from "@react-three/rapier";
import type { RigidBodyState } from "@react-three/rapier/dist/declarations/src/components/Physics.js";

import { BoneOrder } from "../hooks/useHandHooks.js";
import { useConst, useForceUpdate } from "../utils/utils.js";
import TrueHandClass, { boneNames } from "./TrueHandClass.js";

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
  bonesVisible = false,
  boneShape = "cylinder",
  id,
  ...props
}: TrueHandProps) {
  // console.log(" ----------- INSIDE TrueHand -----------");

  const forceUpdate = useForceUpdate();
  const { world, rigidBodyStates, colliderStates } = useRapier();

  // const handBonesRbState = useMemo(() => {
  //   console.log("TrueHand - handBonesMemo called");

  //   let ready = true;

  //   const handBonesState: RigidBodyState[] = [];

  //   for (const boneName of boneNames) {
  //     const rb = hand.boneData.get(boneName);

  //     if (!rb) {
  //       ready = false;
  //       break;
  //     }
  //     // const rigidBodyState: RigidBodyState = {
  //     //   object: rb.object3d,
  //     //   rigidBody: rb.rigidBody
  //     // };
  //   };

  //   if (ready) {
  //     console.log("TrueHand - handBonesMemo ready");
  //   }
  //   return ready;

  // }, [hand.boneRigidBodies]);

  // const hand = useConst<TrueHandClass>(
  //   () =>
  //     new TrueHandClass({
  //       handedness,
  //       rapierWorld: world,
  //     }),
  // );

  const hand = useMemo(() => {
    console.log("TrueHand - handMemo called");
    return new TrueHandClass({
      handedness,
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

    hand.updateHandOnFrame(XRHand, xrFrame, referenceSpace);
  });

  console.log("states", rigidBodyStates, colliderStates);

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

  return null;

  // return <primitive object={hand.handGroup} />;

  return (
    <Fragment key={id}>
      {hand.trueHand.bones.map((bone, i) => {
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
              type={"dynamic"}
              // type={
              //   bone.transform.position.y === 0
              //     ? "kinematicPosition"
              //     : "dynamic"
              // }
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
              {bonesVisible ? (
                <>
                  <mesh>
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
                          friction={2}
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
                          friction={2}
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
                </>
              ) : (
                <RoundCylinderCollider
                  args={[bone.boxArgs.height / 2, bone.boxArgs.width, 0]}
                  friction={2}
                  restitution={0}
                />
              )}

              {/* Load the wrist rbs first loop  */}
              {i === 0 && (
                <>
                  {/* TrueHand Wrist Rigid Body */}
                  <RigidBody
                    type="dynamic"
                    gravityScale={0}
                    canSleep={false}
                    colliders={"ball"}
                    collisionGroups={interactionGroups([], [])}
                    ref={hand.wrist.rigidBodies.trueWrist}
                  />

                  {/* Kinematic Wrist Rigid Body */}
                  <RigidBody
                    type="kinematicPosition"
                    ref={hand.wrist.rigidBodies.kinematicWrist}
                    colliders={false}
                    canSleep={false}
                  />
                </>
              )}
            </RigidBody>
          </Fragment>
        );
      })}

      {/* Joints */}
      {hand.trueHand.joints.map(([name, jointInfo]) => {
        return (
          <Fragment key={name + "trueHandJoint"}>
            <RigidBody
              key={name + "trueHandJoint"}
              type="kinematicPosition"
              gravityScale={0}
              restitution={0}
              canSleep={false}
              colliders={"ball"}
              userData={{ name }}
              collisionGroups={interactionGroups([], [])}
              density={5}
              ref={jointInfo.rigidBody}
            >
              <mesh>
                <sphereGeometry args={[hand.trueHandJointRadius]} />
                <meshBasicMaterial color="red" />
              </mesh>
            </RigidBody>

            {/* Kinematic Joint */}
          </Fragment>
        );
      })}

      {/* {hand.trueHand.joints.map(([name, jointInfo]) => {
        return (
          <RigidBody
            key={name + "trueHandJoint"}
            type="kinematicPosition"
            gravityScale={0}
            restitution={0}
            canSleep={false}
            colliders={"ball"}
            userData={{ name }}
            collisionGroups={interactionGroups([], [])}
            density={5}
            ref={jointInfo.rigidBody}
          >
            <mesh>
              <sphereGeometry args={[hand.trueHandJointRadius]} />
              <meshBasicMaterial color="red" />
            </mesh>
          </RigidBody>
        );
      })} */}

      {/* TrueHand Wrist Rigid Body */}
      {/* <RigidBody
        type="dynamic"
        gravityScale={0}
        canSleep={false}
        colliders={false}
        ref={hand.wrist.rigidBodies.trueWrist}
      /> */}

      {/* Kinematic Wrist Rigid Body */}
      {/* <RigidBody
        type="kinematicPosition"
        ref={hand.wrist.rigidBodies.kinematicWrist}
        colliders={false}
        canSleep={false}
      /> */}
    </Fragment>
  );

  // return (
  //   <Fragment key={id}>
  //     {/* KinematicHand Wrist Rigid Body */}
  //     {/* <RigidBody
  //       key="kinematicWrist"
  //       type="kinematicPosition"
  //       ref={hand.kinematicHand.joints[0]?.[1].rigidBody}
  //       colliders={false}
  //       canSleep={false}
  //     /> */}

  //     {/* Kinematic Rigid Body Joints */}
  //     {hand.kinematicHand.joints.map(([name, jointInfo]) => {
  //       return (
  //         <RigidBody
  //           key={name + "kinematicHandJoint"}
  //           ref={jointInfo.rigidBody}
  //           type="kinematicPosition"
  //           colliders={false}
  //           canSleep={false}
  //           collisionGroups={interactionGroups([], [])}
  //         >
  //           <mesh visible={true}>
  //             <sphereGeometry args={[0.001]} />
  //             <meshBasicMaterial color="black" />
  //           </mesh>
  //         </RigidBody>
  //       );
  //     })}

  //     {/* TrueHand Rigid Body Joints */}
  //     {hand.trueHand.joints.map(([name, jointInfo]) => {
  //       return (
  //         <>
  //           <RigidBody
  //             key={name + "trueHandJoint"}
  //             type="dynamic"
  //             gravityScale={0}
  //             restitution={0}
  //             canSleep={false}
  //             colliders={"ball"}
  //             userData={{ name }}
  //             collisionGroups={interactionGroups([], [])}
  //             density={5}
  //             ref={jointInfo.rigidBody}
  //           >
  //             <mesh>
  //               <sphereGeometry args={[hand.trueHandJointRadius]} />
  //               <meshBasicMaterial color="red" />
  //             </mesh>
  //           </RigidBody>
  //         </>
  //       );
  //     })}

  //     {/* TrueHand Rigid Body Bones */}
  //     {hand.trueHand.bones.map((bone) => {
  //       if (!bone.boxArgs.height) return null;

  //       return (
  //         <RigidBody
  //           key={bone.id}
  //           type="dynamic"
  //           gravityScale={0}
  //           canSleep={false}
  //           colliders={false}
  //           userData={{ name: bone.name }}
  //           // collisionGroups={interactionGroups([], [])}
  //           collisionGroups={interactionGroups([0], [7, 8])}
  //           density={5}
  //           onCollisionEnter={(payload) => {
  //             const { target } = payload;
  //             console.log("bone collision enter ", payload);
  //             target.rigidBody?.lockRotations(true, true);
  //           }}
  //           onCollisionExit={(payload) => {
  //             const { target } = payload;
  //             target.rigidBody?.lockRotations(false, true);
  //           }}
  //           ccd
  //           {...props}
  //           ref={bone.refs.trueBoneRef}
  //           additionalSolverIterations={5}
  //         >
  //           <mesh visible={true}>
  //             {boneShape === "cylinder" ? (
  //               <>
  //                 <cylinderGeometry
  //                   args={[
  //                     bone.boxArgs.width / 2,
  //                     bone.boxArgs.width / 2,
  //                     bone.boxArgs.height,
  //                   ]}
  //                 />

  //                 <RoundCylinderCollider
  //                   args={[bone.boxArgs.height / 2, bone.boxArgs.width / 2, 0]}
  //                   friction={4}
  //                   restitution={0}
  //                 />
  //               </>
  //             ) : (
  //               <>
  //                 <boxGeometry
  //                   args={[
  //                     bone.boxArgs.width,
  //                     bone.boxArgs.height,
  //                     bone.boxArgs.depth,
  //                   ]}
  //                 />

  //                 <CuboidCollider
  //                   args={[
  //                     bone.boxArgs.width,
  //                     bone.boxArgs.height,
  //                     bone.boxArgs.depth,
  //                   ]}
  //                   friction={1}
  //                   restitution={0}
  //                 />
  //               </>
  //             )}

  //             <meshBasicMaterial
  //               transparent
  //               opacity={bonesVisible ? 0.5 : 0}
  //               color="white"
  //             />
  //           </mesh>
  //         </RigidBody>
  //       );
  //     })}

  //     {/* Kinematic Rigid Body Bones */}
  //   </Fragment>
  // );

  // return (
  //   <Fragment key={id}>
  //     {hand.completeFingerBones.map(([name, fingerBones]) => {
  //       if (!fingerBones.bones[0]?.boxArgs.height) return null;

  //       // console.log("\n---------- fingerBones -------------");
  //       // console.log("name: ", name);
  //       // console.log(
  //       //   "kinematicFinger translation",
  //       //   fingerBones.fingerRefs.kinematicFinger.current?.translation(),
  //       // );
  //       // console.log(
  //       //   "kinematicFinger rotation",
  //       //   fingerBones.fingerRefs.kinematicFinger.current?.rotation(),
  //       // );

  //       if (fingerBones.bones[0]?.refs.trueBoneColliderRef?.current)
  //         return (
  //           <RigidBody
  //             key={name}
  //             type="kinematicPosition"
  //             ref={fingerBones.fingerRefs.kinematicFinger}
  //             // colliders={false}
  //           >
  //             {fingerBones.bones.map((bone) => {
  //               if (!bone.boxArgs.height) return null;

  //               console.log("\n----------------- bone -----------------");
  //               console.log("bone: ", bone);
  //               console.log("bone.transform", bone.transform);
  //               console.log(
  //                 "bone.refs.trueBoneColliderRef translation",
  //                 bone.refs.trueBoneColliderRef?.current?.translation(),
  //               );
  //               console.log(
  //                 "bone.refs.trueBoneColliderRef rotation",
  //                 bone.refs.trueBoneColliderRef?.current?.rotation(),
  //               );
  //               console.log("--------------------------------------\n");

  //               // bone.refs.trueBoneColliderRef?.current?.setTranslation(
  //               //   bone.transform.position,
  //               // );

  //               return (
  //                 <RoundCylinderCollider
  //                   key={bone.name}
  //                   args={[bone.boxArgs.height / 2, bone.boxArgs.width / 2, 0]}
  //                   friction={1}
  //                   restitution={0}
  //                   ref={bone.refs.trueBoneColliderRef}
  //                 >
  //                   <mesh>
  //                     <cylinderGeometry
  //                       args={[
  //                         bone.boxArgs.width / 2,
  //                         bone.boxArgs.width / 2,
  //                         bone.boxArgs.height,
  //                       ]}
  //                     />
  //                     <meshBasicMaterial
  //                       transparent
  //                       opacity={0.5}
  //                       color="white"
  //                     />
  //                   </mesh>
  //                 </RoundCylinderCollider>

  //                 // <mesh
  //                 //   key={bone.name}
  //                 //   position={bone.transform.position}
  //                 //   quaternion={bone.transform.orientation}
  //                 // >
  //                 //   <boxGeometry
  //                 //     args={[
  //                 //       bone.boxArgs.width,
  //                 //       bone.boxArgs.height,
  //                 //       bone.boxArgs.depth,
  //                 //     ]}
  //                 //   />
  //                 //   <meshBasicMaterial wireframe color="black" />
  //                 // </mesh>
  //               );
  //             })}
  //           </RigidBody>
  //         );
  //     })}
  //   </Fragment>
  // );
}
