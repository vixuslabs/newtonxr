import React, {
  forwardRef,
  Fragment,
  useMemo,
  useRef,
  type MutableRefObject,
  type RefObject,
} from "react";
import {
  createMotionHand,
  getMotionHandModelUrl,
  type MotionHand,
} from "@coconut-xr/natuerlich";
import { useFrame, useLoader } from "@react-three/fiber";
import type { RapierRigidBody } from "@react-three/rapier";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { clone } from "three/examples/jsm/utils/SkeletonUtils.js";

import { HandBone, HandSensor, useNewton } from "../core/index.js";
import { SpatialHand } from "../SpatialHand.js";

interface JointProperties {
  position: THREE.Vector3;
  orientation: THREE.Quaternion;
  matrix?: THREE.Matrix4;
  linearVelocity?: THREE.Vector3;
  angularVelocity?: THREE.Vector3;
}

export interface JointInfo {
  name: XRHandJoint;
  properties: JointProperties;
  readonly isTipJoint: boolean;
  handedness?: "left" | "right";
}

export interface RapierBone {
  position: THREE.Vector3;
  orientation: THREE.Quaternion;
}

export interface BoneInfo {
  startJoint: JointInfo;
  endJoint: JointInfo;
  bone: RapierBone;
  boneRef: RefObject<RapierRigidBody>;
  position?: THREE.Vector3;
  orientation?: THREE.Quaternion;
  readonly height?: number;
}
export interface HandInfo {
  handedness: XRHandedness;
  boneInfo: BoneInfo[];
}

export interface JointRefs {
  physicsRef: MutableRefObject<RapierRigidBody>;
  meshRef: MutableRefObject<THREE.Mesh>;
}

/**
 * PhysHand component represents a physical hand in a XR scene.
 * It renders the hand bones and optionally a digital hand.
 *
 * @component
 * @param hand - The XRHand object representing the physical hand.
 * @param inputSource - The XRInputSource object representing the input source of the hand.
 * @param id - The unique identifier for the XRHand.
 * @param withDigitalHand - **Optional**. Specifies whether to render a digital hand along with the physical hand. Default is false.
 * @returns The PhysHand component.
 */
export const PhysHand = forwardRef<
  THREE.Group,
  {
    hand: XRHand;
    inputSource: XRInputSource;
    id: number;
    withDigitalHand?: boolean;
  }
>(({ hand, inputSource, id, withDigitalHand = false }, ref) => {
  const updateHandBones = useNewton((state) => state.updateHandBones);
  const hands = useNewton((state) => state.hands);
  // const joints = useRef(defaultHandJointValues);
  const handUrl = getMotionHandModelUrl(inputSource.handedness);

  const { scene: handScene } = useLoader(GLTFLoader, handUrl);

  const clonedHandScene = useMemo(() => clone(handScene), [handScene]);

  const motionHandObject = useMemo(
    () => createMotionHand(hand, clonedHandScene),
    [clonedHandScene, hand],
  );

  const motionHandRef = useRef<MotionHand>(motionHandObject);

  useFrame((state, _, frame) => {
    const motionHand = motionHandRef.current;

    if (
      frame == null ||
      frame.session.visibilityState === "hidden" ||
      frame.session.visibilityState === "visible-blurred"
    ) {
      motionHand.visible = false;
      return;
    }
    const referenceSpace = state.gl.xr.getReferenceSpace();
    if (referenceSpace === null) {
      motionHand.visible = false;
      return;
    }

    if (motionHand.visible) {
      updateHandBones(
        motionHand,
        inputSource.handedness,
        frame,
        referenceSpace,
        true,
      );
    }
  });

  if (inputSource.handedness === "none") return null;

  if (hands[inputSource.handedness] === null) return null;

  return (
    <>
      <group name={`${inputSource.handedness}-hand`} ref={ref}>
        {/* Joints */}
        {Array.from(hands[inputSource.handedness]?.bones.entries() ?? []).map(
          ([name, { height, boneRef }]) => {
            return (
              <Fragment key={name}>
                <HandBone ref={boneRef} height={height}>
                  <mesh>
                    <boxGeometry args={[0.005, height, 0.004]} />
                    <meshBasicMaterial
                      color={"white"}
                      transparent={!motionHandRef.current.visible}
                      opacity={motionHandRef.current.visible ? 1 : 0}
                    />
                  </mesh>
                </HandBone>
              </Fragment>
            );
          },
        )}

        {hands[inputSource.handedness] && (
          <HandSensor handedness={inputSource.handedness} />
        )}

        {withDigitalHand && (
          <SpatialHand hand={hand} inputSource={inputSource} id={id} />
        )}
      </group>
    </>
  );
});

PhysHand.displayName = "PhysHand";

// keeping this for reference
// return (
//   <>
//     <group name="hand" ref={ref}>
//       {/* Joints */}
//       {Array.from(jointsMap.entries()).map(
//         ([boneName, jointsRef], i, arr) => {
//           console.log("\n-------------------");
//           console.log("boneName ", boneName);
//           console.log("jointsRef ", jointsRef);
//           console.log("i ", i);
//           console.log("-------------------\n");
//           if (i < arr.length - 1) {
//             const nextBone = arr[i + 1];

//             console.log(`nextBone ${i}`, nextBone);

//             if (nextBone == null) {
//               console.log("nextBone null ");
//               return null;
//             }

//             // if (!nextBone[1].physicsRef.current) {
//             //   console.log("nextBone[1].physicsRef.current undefined ");
//             //   return null;
//             // }

//             // if (jointsRef.physicsRef.current === null) {
//             //   console.log("jointsRef.physicsRef.current null ");
//             //   return null;
//             // } else if (nextBone[1].physicsRef.current === null) {
//             //   console.log("nextBone[1].physicsRef.current null ");
//             //   return null;
//             // }

//             const bone = {
//               startJoint: jointsRef.physicsRef,
//               endJoint: nextBone[1].physicsRef,
//             };

//             // console.log("bone ", bone);
//             console.log(
//               " jointsRef.meshRef.current",
//               jointsRef.meshRef.current,
//             );

//             // const v1 = vec3(jointsRef.physicsRef.current.translation());
//             // const v2 = vec3(nextBone[1].physicsRef.current.translation());

//             // console.log("v1 ", v1);
//             // console.log("v2 ", v2);

//             // const height = jointsRef.meshRef.current.position.distanceTo(
//             //   nextBone![1].meshRef.current.position,
//             // );
//             const height = 0.02;

//             return (
//               <Fragment key={boneName}>
//                 <Bone
//                   key={boneName + String(id) + "bone"}
//                   // ref={boneJointsRef}
//                   startJoint={bone.startJoint}
//                   endJoint={bone.endJoint}
//                   height={height}
//                 >
//                   <mesh>
//                     {/* <cylinderGeometry args={[0.003, 0.003, height, 8]} /> */}
//                     <boxGeometry args={[0.003, height, 0.003]} />
//                     <meshBasicMaterial
//                       // wireframe
//                       color={"white"}
//                       transparent={!motionHandRef.current.visible}
//                       opacity={motionHandRef.current.visible ? 1 : 0}
//                     />
//                   </mesh>
//                 </Bone>
//                 {/* Joint */}
//                 {/* NO NEED FOR RIGID BODY AROUND JOINTS */}
//                 <RigidBody
//                   name={boneName}
//                   ref={jointsRef.physicsRef}
//                   key={boneName + String(id) + "joint"}
//                   type="kinematicPosition"
//                   colliders="ball"
//                   restitution={0}
//                   collisionGroups={interactionGroups(
//                     inputSource.handedness === "left" ? [1] : [2],
//                     // [],
//                     inputSource.handedness === "left" ? [2, 8] : [1, 8],
//                   )}
//                   // ccd
//                 >
//                   <mesh ref={jointsRef.meshRef}>
//                     <sphereGeometry args={[0.002, 8, 8]} />
//                     <meshBasicMaterial wireframe color={"white"} />
//                   </mesh>
//                 </RigidBody>
//               </Fragment>
//             );
//           } else {
//             console.log("i < arr.length - 1 is: ", i < arr.length - 1);
//             return null;
//           }
//         },
//       )}

//       {/* <SpatialHand hand={hand} inputSource={inputSource} id={id} /> */}
//     </group>
//   </>
// );

// return (
//   <>
//     <group name="hand">
//       {/* Joints */}
//       {Array.from(jointsMap.entries()).map(
//         ([boneName, { physicsRef, meshRef }]) => (
//           <RigidBody
//             name={boneName}
//             ref={physicsRef}
//             key={boneName + String(id)}
//             type="kinematicPosition"
//             colliders="trimesh"
//             restitution={0}
//             ccd
//           >
//             <mesh ref={meshRef}>
//               <sphereGeometry args={[0.002, 8, 8]} />
//               <meshBasicMaterial wireframe color={"white"} />
//             </mesh>
//           </RigidBody>
//         ),
//       )}
//       {/* Bones */}
//       {/* <HandBones jointsMap={jointsMap} /> */}
//       <SpatialHand hand={hand} inputSource={inputSource} id={id} />
//     </group>
//   </>
// );
