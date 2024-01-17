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

import { HandBone, HandSensor } from "../core/index.js";
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
  const [inputHand] = useHands(inputSource.handedness);

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
        {Array.from(inputHand.bones.entries() ?? []).map(
          ([name, { height, boneRef }]) => {
            return (
              <Fragment key={name}>
                <HandBone
                  rigidBodyType="kinematicPosition"
                  visible={true}
                  ref={boneRef}
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
        )}

        {inputHand && <HandSensor handedness={inputSource.handedness} />}

        {withDigitalHand && (
          <SpatialHand hand={hand} inputSource={inputSource} id={id} />
        )}
      </group>
    </>
  );
});

PhysHand.displayName = "PhysHand";
