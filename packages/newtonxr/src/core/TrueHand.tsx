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

    hand.updateHandOnFrame(XRHand, xrFrame, referenceSpace);
  });

  // console.log("\n---------- TrueHand -------------");
  // console.log("hand.bones: ", hand.bones);
  // console.log("hand.trueHandBones: ", hand.trueHandBones);
  // console.log("hand.trueHandJoints: ", hand.trueHandJoints);
  // console.log(
  //   "hand.kinematicWrist.current?.translation(): ",
  //   hand.kinematicWrist.current?.translation(),
  // );
  // console.log("---------------------------------\n-");

  return (
    <Fragment key={id}>
      {/* KinematicHand Wrist Rigid Body */}
      <RigidBody
        key="kinematicWrist"
        type="kinematicPosition"
        ref={hand.kinematicWrist}
        colliders={false}
        canSleep={false}
      >
        {/* <mesh visible={false}>
          <boxGeometry args={[0.05, 0.05, 0.05]} />
          <meshBasicMaterial wireframe color="black" />
        </mesh> */}
      </RigidBody>

      {/* TrueHand Rigid Body Joints */}
      {hand.trueHandJoints.map(([name, jointInfo]) => {
        return (
          <>
            <RigidBody
              key={name + "trueHandJoint"}
              type="dynamic"
              gravityScale={0}
              restitution={0}
              canSleep={false}
              ref={jointInfo.rigidBody}
              colliders={false}
            >
              <mesh>
                <sphereGeometry args={[0.001]} />
                <meshBasicMaterial color="red" />
              </mesh>
            </RigidBody>
          </>
        );
      })}

      {/* TrueHand Rigid Body Bones */}
      {hand.trueHandBones.map((bone) => {
        if (!bone.boxArgs.height) return null;
        return (
          <RigidBody
            key={bone.id}
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
                    args={[bone.boxArgs.height / 2, bone.boxArgs.width / 2, 0]}
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
        );
      })}
    </Fragment>
  );

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

  return (
    <Fragment key={id}>
      {hand.completeFingerBones.map(([name, fingerBones]) => {
        if (!fingerBones.bones[0]?.boxArgs.height) return null;

        // console.log("\n---------- fingerBones -------------");
        // console.log("name: ", name);
        // console.log(
        //   "kinematicFinger translation",
        //   fingerBones.fingerRefs.kinematicFinger.current?.translation(),
        // );
        // console.log(
        //   "kinematicFinger rotation",
        //   fingerBones.fingerRefs.kinematicFinger.current?.rotation(),
        // );

        if (fingerBones.bones[0]?.refs.trueBoneColliderRef?.current)
          return (
            <RigidBody
              key={name}
              type="kinematicPosition"
              ref={fingerBones.fingerRefs.kinematicFinger}
              // colliders={false}
            >
              {fingerBones.bones.map((bone) => {
                if (!bone.boxArgs.height) return null;

                console.log("\n----------------- bone -----------------");
                console.log("bone: ", bone);
                console.log("bone.transform", bone.transform);
                console.log(
                  "bone.refs.trueBoneColliderRef translation",
                  bone.refs.trueBoneColliderRef?.current?.translation(),
                );
                console.log(
                  "bone.refs.trueBoneColliderRef rotation",
                  bone.refs.trueBoneColliderRef?.current?.rotation(),
                );
                console.log("--------------------------------------\n");

                // bone.refs.trueBoneColliderRef?.current?.setTranslation(
                //   bone.transform.position,
                // );

                return (
                  <RoundCylinderCollider
                    key={bone.name}
                    args={[bone.boxArgs.height / 2, bone.boxArgs.width / 2, 0]}
                    friction={1}
                    restitution={0}
                    ref={bone.refs.trueBoneColliderRef}
                  >
                    <mesh>
                      <cylinderGeometry
                        args={[
                          bone.boxArgs.width / 2,
                          bone.boxArgs.width / 2,
                          bone.boxArgs.height,
                        ]}
                      />
                      <meshBasicMaterial
                        transparent
                        opacity={0.5}
                        color="white"
                      />
                    </mesh>
                  </RoundCylinderCollider>

                  // <mesh
                  //   key={bone.name}
                  //   position={bone.transform.position}
                  //   quaternion={bone.transform.orientation}
                  // >
                  //   <boxGeometry
                  //     args={[
                  //       bone.boxArgs.width,
                  //       bone.boxArgs.height,
                  //       bone.boxArgs.depth,
                  //     ]}
                  //   />
                  //   <meshBasicMaterial wireframe color="black" />
                  // </mesh>
                );
              })}
            </RigidBody>
          );
      })}
    </Fragment>
  );
}
