import { createRef } from "react";
import type { MotionHand } from "@coconut-xr/natuerlich";
import type { RootState } from "@react-three/fiber";
import type { RapierRigidBody } from "@react-three/rapier";
import { Object3D, Quaternion, Vector3 } from "three";
import { create } from "zustand";
import type { StoreApi } from "zustand";
import { combine } from "zustand/middleware";

import {
  HandJoints,
  jointConnections,
  defaultHandJointValues as jointMap,
} from "../constants.js";
import type { BoneInfo, JointInfo } from "./PhysHand.js";

export interface GamepadAxes {
  name: string;
  value: number;
}

export type ButtonsState = {
  name: string;
} & GamepadButton;

export interface XRController {
  handedness: "left" | "right";
  pose: XRPose;
  buttons: ButtonsState[];
  axes: GamepadAxes[];
  pointer?: number;
}

// export type PointerState = {
//   z: number;
//   handedness: "left" | "right";
//   heldObject: string | null;
// }

export interface InteractionPoint {
  zPosition: number;
  heldObjectId: string | null;
}

type HandBoneNames =
  | "wrist--thumb-metacarpal"
  | "thumb-metacarpal--thumb-phalanx-proximal"
  | "thumb-phalanx-proximal--thumb-phalanx-distal"
  | "thumb-phalanx-distal--thumb-tip"
  | "wrist--index-finger-metacarpal"
  | "index-finger-metacarpal--index-finger-phalanx-proximal"
  | "index-finger-phalanx-proximal--index-finger-phalanx-intermediate"
  | "index-finger-phalanx-intermediate--index-finger-phalanx-distal"
  | "index-finger-phalanx-distal--index-finger-tip"
  | "wrist--middle-finger-metacarpal"
  | "middle-finger-metacarpal--middle-finger-phalanx-proximal"
  | "middle-finger-phalanx-proximal--middle-finger-phalanx-intermediate"
  | "middle-finger-phalanx-intermediate--middle-finger-phalanx-distal"
  | "middle-finger-phalanx-distal--middle-finger-tip"
  | "wrist--ring-finger-metacarpal"
  | "ring-finger-metacarpal--ring-finger-phalanx-proximal"
  | "ring-finger-phalanx-proximal--ring-finger-phalanx-intermediate"
  | "ring-finger-phalanx-intermediate--ring-finger-phalanx-distal"
  | "ring-finger-phalanx-distal--ring-finger-tip"
  | "wrist--pinky-finger-metacarpal"
  | "pinky-finger-metacarpal--pinky-finger-phalanx-proximal"
  | "pinky-finger-phalanx-proximal--pinky-finger-phalanx-intermediate"
  | "pinky-finger-phalanx-intermediate--pinky-finger-phalanx-distal"
  | "pinky-finger-phalanx-distal--pinky-finger-tip";

type BoneMap = Map<HandBoneNames, BoneInfo>;

interface HandProperties {
  joints: JointInfo[];
  bones: BoneMap;
}

export type NewtonState = {
  controllers: {
    left: XRController | null;
    right: XRController | null;
  };
  hands: {
    left: HandProperties | null;
    right: HandProperties | null;
  };
  interactionPoints: {
    left: InteractionPoint | null;
    right: InteractionPoint | null;
  };
  heldObjects: {
    left: string | null;
    right: string | null;
  };
  collisions: string[];
  reservedThreeValues: {
    vector: THREE.Vector3;
    position: THREE.Vector3;
    direction: THREE.Vector3;
    quaternion: THREE.Quaternion;
    object: THREE.Object3D;
  };
} & {
  onNextFrameCallbacks: Set<
    (state: RootState, delta: number, frame: XRFrame | undefined) => void
  >;
  threeStore?: StoreApi<RootState>;
};

const initialState: NewtonState = {
  controllers: {
    left: null,
    right: null,
  },
  hands: {
    left: null,
    right: null,
  },
  heldObjects: {
    left: null,
    right: null,
  },
  interactionPoints: {
    left: null,
    right: null,
  },
  collisions: ["hey"],
  reservedThreeValues: {
    vector: new Vector3(),
    position: new Vector3(),
    direction: new Vector3(),
    quaternion: new Quaternion(),
    object: new Object3D(),
  },
  onNextFrameCallbacks: new Set(),
};

/**
 * Custom hook that creates and manages the state for Newton XR.
 * @param initialState - The initial state for Newton XR.
 * @returns The state and actions for Newton XR.
 */
export const useNewton = create(
  combine(initialState, (set, get) => ({
    onFrame: (state: RootState, delta: number, frame: XRFrame | undefined) => {
      const { onNextFrameCallbacks, controllers } = get();

      for (const onNextFrameCallback of onNextFrameCallbacks) {
        onNextFrameCallback(state, delta, frame);
      }

      onNextFrameCallbacks.clear();

      const referenceSpace = state.get().gl.xr.getReferenceSpace();

      if (referenceSpace === null) return;

      const inputSources = frame?.session.inputSources;

      for (const inputSource of inputSources ?? []) {
        const {
          handedness,
          gripSpace,
          gamepad,
          targetRayMode,
          targetRaySpace,
        } = inputSource;

        if (
          !handedness ||
          handedness === "none" ||
          !gripSpace ||
          !gamepad ||
          targetRayMode !== "tracked-pointer" ||
          !targetRaySpace
        )
          continue;

        // const baseLayer = state.get().gl.xr.getBaseLayer();

        const pose = frame?.getPose(gripSpace, referenceSpace);

        if (!pose) continue;

        /**
         * [Reference](https://immersive-web.github.io/webxr-gamepads-module/#example-mappings) -
         * Organizing controller state based off 5 buttons + 2 axes
         *
         */
        const buttons = gamepad.buttons
          .map((btn, index) => {
            if (index === 2) null;

            switch (index) {
              case 0:
                return {
                  name: "trigger",
                  pressed: btn.pressed,
                  touched: btn.touched,
                  value: btn.value,
                };
              case 1:
                return {
                  name: "grip",
                  pressed: btn.pressed,
                  touched: btn.touched,
                  value: btn.value,
                };
              case 3:
                return {
                  name: "thumbstick",
                  pressed: btn.pressed,
                  touched: btn.touched,
                  value: btn.value,
                };
              case 4:
                return {
                  name: handedness === "left" ? "x" : "a",
                  pressed: btn.pressed,
                  touched: btn.touched,
                  value: btn.value,
                };
              case 5:
                return {
                  name: handedness === "left" ? "y" : "b",
                  pressed: btn.pressed,
                  touched: btn.touched,
                  value: btn.value,
                };
              default: {
                return {
                  name: "invalid",
                  pressed: btn.pressed,
                  touched: btn.touched,
                  value: btn.value,
                };
              }
            }
          })
          .filter((btn) => btn.name !== "invalid" && Boolean(btn));

        const axes = gamepad.axes
          .map((axis, index) => {
            // first two axes are reserved for touch pad, which we are not using
            if (index === 0 || index === 1) {
              return {
                name: "invalid",
                value: 0,
              };
            }
            return {
              name: index === 2 ? "x" : "y",
              value: axis,
            };
          })
          .filter((axis) => axis.name !== "invalid" && Boolean(axis));

        const pointer = controllers[handedness]?.pointer ?? undefined;

        const controller: XRController = {
          handedness,
          pose,
          buttons,
          axes,
          pointer,
        };

        set((state) => ({
          ...state,
          controllers: {
            ...state.controllers,
            [handedness]: controller,
          },
        }));
      }
    },
    setThreeStore: (store: StoreApi<RootState>) => {
      set({ threeStore: store });
    },
    setHeldObject: (handedness: "left" | "right", object: string | null) => {
      set((state) => ({
        ...state,
        heldObjects: {
          ...state.heldObjects,
          [handedness]: object,
        },
      }));
    },
    /**
     * Updates the hand bones based on the motion data.
     *
     * @param motionHand - The motion hand data.
     * @param handedness - The handedness of the hand.
     * @param frame - The XRFrame containing the motion data.
     * @param referenceSpace - The XRReferenceSpace used as the frame of reference.
     * @param updateRapier - A boolean indicating whether to update the Rapier physics engine.
     */
    updateHandBones: (
      motionHand: MotionHand,
      handedness: XRHandedness,
      frame: XRFrame,
      referenceSpace: XRReferenceSpace,
      updateRapier: boolean,
    ): void => {
      if (handedness === "none") return;

      let newtonBones = get().hands[handedness]?.bones;

      if (!newtonBones) {
        set((state) => ({
          ...state,
          hands: {
            ...state.hands,
            [handedness]: {
              ...state.hands[handedness],
              bones: new Map<HandBoneNames, BoneInfo>(),
            },
          },
        }));
        newtonBones =
          get().hands[handedness]?.bones ?? new Map<HandBoneNames, BoneInfo>();
      }

      if (!newtonBones) {
        console.log("no bones");
        return;
      }

      for (const inputJointSpace of motionHand.hand.values()) {
        const startJointInfo = jointMap.get(
          HandJoints[inputJointSpace.jointName],
        );

        if (!startJointInfo) continue;

        const startJointPose = frame.getJointPose?.(
          inputJointSpace,
          referenceSpace,
        );

        if (!startJointPose) continue;

        startJointInfo.properties.position.set(
          startJointPose.transform.position.x,
          startJointPose.transform.position.y,
          startJointPose.transform.position.z,
        );

        startJointInfo.properties.orientation.set(
          startJointPose.transform.orientation.x,
          startJointPose.transform.orientation.y,
          startJointPose.transform.orientation.z,
          startJointPose.transform.orientation.w,
        );

        const connectedJoints =
          jointConnections[HandJoints[inputJointSpace.jointName]];

        if (!connectedJoints) continue;

        connectedJoints.forEach((endJointName) => {
          const endJointInfo = jointMap.get(HandJoints[endJointName]);

          if (!endJointInfo) return;

          // Quick fix, but works
          const endJointSpace = motionHand.hand.get(
            endJointName as unknown as number,
          );

          if (!endJointSpace) return;

          /**
           * Find the corresponding endJoint by looking through
           * motionHand.hand.values() and comparing the endJointName
           */
          const endJointPose = frame.getJointPose?.(
            endJointSpace,
            referenceSpace,
          );

          if (endJointPose) {
            endJointInfo.properties.position.set(
              endJointPose.transform.position.x,
              endJointPose.transform.position.y,
              endJointPose.transform.position.z,
            );

            endJointInfo.properties.orientation.set(
              endJointPose.transform.orientation.x,
              endJointPose.transform.orientation.y,
              endJointPose.transform.orientation.z,
              endJointPose.transform.orientation.w,
            );

            const height = startJointInfo.properties.position.distanceTo(
              endJointInfo.properties.position,
            );

            if (newtonBones?.size === 0) {
              console.log("no bones in store yet");
            }

            // let storedBone = newtonBones?.find((bone) => {
            //   return (
            //     bone.startJoint.name === startJointInfo.name &&
            //     bone.endJoint.name === endJointInfo.name
            //   );
            // });

            // let storedBoneIndex = -1;
            // let storedBone: BoneInfo | undefined;

            // for (let index = 0; index < newtonBones.length; index++) {
            //   const bone = newtonBones[index];
            //   if (!bone) continue;
            //   if (
            //     bone.startJoint.name === startJointInfo.name &&
            //     bone.endJoint.name === endJointInfo.name
            //   ) {
            //     storedBone = bone;
            //     storedBoneIndex = index;
            //     break; // exit the loop early
            //   }
            // }

            let storedBone = newtonBones?.get(
              `${startJointInfo.name}--${endJointInfo.name}` as HandBoneNames,
            );

            // console.log("storedBoneIndex: ", storedBoneIndex);
            // console.log("storedBone: ", storedBone);

            if (!storedBone) {
              console.log(
                "no stored bone for: ",
                startJointInfo.name,
                endJointInfo.name,
              );
              storedBone = {
                startJoint: startJointInfo,
                endJoint: endJointInfo,
                bone: {
                  position: new Vector3(),
                  orientation: new Quaternion(),
                },
                boneRef: createRef<RapierRigidBody>(),
                height: height,
              };
              // console.log(
              //   "no stored bone for: ",
              //   startJointInfo.name,
              //   endJointInfo.name,
              // );

              // set((state) => ({
              //   ...state,
              //   hands: {
              //     ...state.hands,
              //     [handedness]: {
              //       ...state.hands[handedness],
              //       bones: [
              //         ...(state.hands[handedness]?.bones ?? []),
              //         {
              //           startJoint: startJointInfo,
              //           endJoint: endJointInfo,
              //           bone: {
              //             position: new Vector3(),
              //             orientation: new Quaternion(),
              //           },
              //           boneRef: createRef<RapierRigidBody>(),
              //           height: height,
              //         },
              //       ],
              //     },
              //   },
              // }));

              // return;
            }

            const { vector, position, direction, quaternion } =
              get().reservedThreeValues;

            const ref = storedBone.boneRef;

            const startPos = startJointInfo.properties.position;

            const endPos = endJointInfo.properties.position;

            // copying bone position to reserved position Vector3
            position.copy(startPos).lerpVectors(startPos, endPos, 0.5);

            // copying bone direction to reserved direction Vector3
            direction.copy(startPos).sub(endPos).normalize();

            const vectorIsCorrect =
              vector.x === 0 && vector.y === 1 && vector.z === 0;

            quaternion.setFromUnitVectors(
              vectorIsCorrect ? vector : vector.set(0, 1, 0),
              direction,
            );

            if (ref.current && updateRapier) {
              ref.current.setNextKinematicTranslation(position);
              ref.current.setNextKinematicRotation(quaternion);
            }

            const updatedBone: BoneInfo = {
              startJoint: startJointInfo,
              endJoint: endJointInfo,
              bone: {
                position: position.clone(),
                orientation: quaternion.clone(),
                // orientation: object.quaternion,
              },
              boneRef: ref,
              height: storedBone.height ?? height,
            };

            const boneName = `${startJointInfo.name}--${endJointInfo.name}`;

            newtonBones?.set(boneName as HandBoneNames, updatedBone);

            // set((state) => ({
            //   ...state,
            //   hands: {
            //     ...state.hands,
            //     [handedness]: {
            //       ...state.hands[handedness],
            //       bones: newtonBones,
            //     },
            //   },
            // }));
          }
        });
      }

      set((state) => ({
        ...state,
        hands: {
          ...state.hands,
          [handedness]: {
            ...state.hands[handedness],
            bones: newtonBones,
          },
        },
      }));
    },
    setInteractionPoint: (
      handedness: "left" | "right",
      interactionPoint: InteractionPoint | null,
    ) => {
      set((state) => ({
        ...state,
        interactionPoints: {
          ...state.interactionPoints,
          [handedness]: interactionPoint,
        },
      }));
    },
    /**
     * registerControllerPointer registers the initial z position of the pointer
     * @description the reason we only register the z position is because the pointer is a always relative to the controller
     * @param handedness which hand the pointer is for
     * @param zPosition the initial z position of the pointer
     */
    registerControllerPointer: (
      handedness: "left" | "right",
      zPosition: number,
    ) => {
      set((state) => ({
        ...state,
        controllers: {
          ...state.controllers,
          [handedness]: {
            ...state.controllers[handedness],
            pointer: zPosition,
          },
        },
      }));
    },
    updateControllerPointer: (
      handedness: "left" | "right",
      zPosition: number,
    ) => {
      set((state) => ({
        ...state,
        controllers: {
          ...state.controllers,
          [handedness]: {
            ...state.controllers[handedness],
            pointer: zPosition,
          },
        },
      }));
    },
  })),
);
