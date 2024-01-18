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
import { useLoader } from "@react-three/fiber";
import type { RapierRigidBody } from "@react-three/rapier";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { clone } from "three/examples/jsm/utils/SkeletonUtils.js";

import {
  ConnectiveHandBoneJoint,
  HandBone,
  type HandBoneNames,
} from "../core/index.js";
import { useHands } from "../hooks/useHands.js";
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
  visibleBoneRef: RefObject<RapierRigidBody>;
  bridgeBoneRef: RefObject<RapierRigidBody>;
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

const findCommonJoint = (
  boneName1: HandBoneNames,
  boneName2: HandBoneNames,
): XRHandJoint | null => {
  const startNameWords = boneName1.split("--");
  const endNameWords = boneName2.split("--");

  for (const word of startNameWords) {
    if (word === endNameWords[0] || word === endNameWords[1]) {
      return word as XRHandJoint;
    }
  }

  return null;
};

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
  const [inputHand] = useHands(inputSource.handedness);
  inputHand?.joints;

  const handUrl = getMotionHandModelUrl(inputSource.handedness);

  const { scene: handScene } = useLoader(GLTFLoader, handUrl);

  const clonedHandScene = useMemo(() => clone(handScene), [handScene]);

  const motionHandObject = useMemo(
    () => createMotionHand(hand, clonedHandScene),
    [clonedHandScene, hand],
  );

  const motionHandRef = useRef<MotionHand>(motionHandObject);

  if (inputSource.handedness === "none") return null;

  if (!inputHand) return null;

  return (
    <>
      <group name={`${inputSource.handedness}-hand`} ref={ref}>
        {/* Joints */}
        {Array.from(inputHand.bones.entries() ?? []).map((cur, i, arr) => {
          if (i % 2 === 1) return null;
          if (i === arr.length - 1) return null;

          const next = arr[i + 1];

          if (!next) return null;

          const [
            startName,
            { height: startHeight, visibleBoneRef: startVisibleBoneRef },
          ] = cur;

          const [
            endName,
            { height: endHeight, visibleBoneRef: endVisibleBoneRef },
          ] = next;

          const commonJoint = findCommonJoint(startName, endName);

          console.log("commonJoint", commonJoint);

          if (!commonJoint) return null;

          return (
            <Fragment key={`${startName}-${endName}`}>
              <ConnectiveHandBoneJoint
                boneOneRef={startVisibleBoneRef}
                boneTwoRef={endVisibleBoneRef}
                connectingJointName={commonJoint}
              >
                <HandBone
                  name={startName}
                  rigidBodyType="dynamic"
                  visible={true}
                  handedness={inputSource.handedness as "right" | "left"}
                  ref={startVisibleBoneRef}
                  height={startHeight}
                >
                  <mesh>
                    <boxGeometry args={[0.005, startHeight, 0.004]} />
                    <meshBasicMaterial color={"white"} />
                  </mesh>
                </HandBone>
                <HandBone
                  name={endName}
                  rigidBodyType="dynamic"
                  visible={true}
                  handedness={inputSource.handedness as "right" | "left"}
                  ref={endVisibleBoneRef}
                  height={endHeight}
                >
                  <mesh>
                    <boxGeometry args={[0.005, endHeight, 0.004]} />
                    <meshBasicMaterial color={"white"} />
                  </mesh>
                </HandBone>
              </ConnectiveHandBoneJoint>
            </Fragment>
          );
        })}

        {/* {inputHand && <HandSensor handedness={inputSource.handedness} />} */}

        {withDigitalHand && (
          <SpatialHand hand={hand} inputSource={inputSource} id={id} />
        )}
      </group>
    </>
  );
});

PhysHand.displayName = "PhysHand";

{
  /* //   return (
        //     <Fragment key={name}>
        //       <HandBone
        //         name={name}
        //         rigidBodyType="dynamic"
        //         visible={true}
        //         handedness={inputSource.handedness as "right" | "left"}
        //         ref={visibleBoneRef}
        //         height={height}
        //       >
        //         <mesh>
        //           <boxGeometry args={[0.005, height, 0.004]} />
        //           <meshBasicMaterial
        //             color={"white"}
        //             transparent={!motionHandRef.current.visible}
        //             opacity={motionHandRef.current.visible ? 1 : 0}
        //           />
        //         </mesh>
        //       </HandBone>
        //     </Fragment>
        //   );
        // })} */
}

{
  /* {Array.from(inputHand.bones.entries() ?? []).map(
          ([name, { height, visibleBoneRef }]) => {
            return (
              <Fragment key={name}>
                <HandBone
                  name={name}
                  rigidBodyType="dynamic"
                  visible={true}
                  handedness={inputSource.handedness as "right" | "left"}
                  ref={visibleBoneRef}
                  height={height}
                >
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
        )} */
}
