import { createRef } from "react";
import type { MotionHand } from "@coconut-xr/natuerlich";
import type { RootState } from "@react-three/fiber";
import type { RapierRigidBody } from "@react-three/rapier";
import { Object3D, Quaternion, Vector3 } from "three";
import { create, type StoreApi } from "zustand";
import { combine } from "zustand/middleware";

import { HandJoints, jointConnections } from "../constants.js";
import type { PalmJointNames, PalmProperties } from "./HandSensor.js";
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

export interface InteractionPoint {
  zPosition: number;
  heldObjectId: string | null;
}

export type HandBoneNames =
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

export type HandBoneMap = Map<HandBoneNames, BoneInfo>;

export type HandJointMap = Map<XRHandJoint, JointInfo>;

export interface HandProperties {
  joints: HandJointMap;
  bones: HandBoneMap;
  palm: PalmProperties;
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

const palmJointNamesArr = [
  "wrist",
  "thumb-phalanx-proximal",
  "index-finger-phalanx-proximal",
  "pinky-finger-phalanx-proximal",
];

function isPalmJointName(name: XRHandJoint): name is PalmJointNames {
  return palmJointNamesArr.includes(name);
}

function isTipJointName(name: XRHandJoint): boolean {
  return name.includes("tip");
}

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
     * @todo - This entire function can be moved inside of the `onFrame` method.
     * @param motionHand - The motion hand data.
     * @param handedness - The handedness of the hand.
     * @param frame - The XRFrame containing the motion data.
     * @param referenceSpace - The XRReferenceSpace used as the frame of reference.
     * @param updateRapier - A boolean indicating whether to update the Rapier physics engine.
     * @param usingSensor - **Optional**. A boolean indicating whether the hand sensor is being used, defaults to true.
     */
    updateHandBones: (
      motionHand: MotionHand,
      handedness: XRHandedness,
      frame: XRFrame,
      referenceSpace: XRReferenceSpace,
      updateRapier: boolean,
      usingSensor = true,
    ): void => {
      if (handedness === "none") return;

      let newtonBones = get().hands[handedness]?.bones;
      let newtonPalm = get().hands[handedness]?.palm;
      let newtonJoints = get().hands[handedness]?.joints;

      if (!newtonJoints) {
        newtonJoints = new Map<XRHandJoint, JointInfo>();
      }

      if (!newtonBones && !newtonPalm) {
        newtonBones = new Map<HandBoneNames, BoneInfo>();
        newtonPalm = {
          joints: new Map<PalmJointNames, JointInfo>(),
          position: new Vector3(),
          orientation: new Quaternion(),
          direction: new Vector3(),
          handedness: handedness,
        };
      } else if (!newtonBones) {
        newtonBones = new Map<HandBoneNames, BoneInfo>();
      } else if (!newtonPalm) {
        newtonPalm = {
          joints: new Map<PalmJointNames, JointInfo>(),
          position: new Vector3(),
          orientation: new Quaternion(),
          direction: new Vector3(),
          handedness: handedness,
        };
      }

      if (!newtonBones) {
        console.log("no bones");
        return;
      }

      if (!newtonPalm) {
        console.log("no palm");
        return;
      }

      if (!newtonJoints) {
        console.log("no joints");
        return;
      }

      for (const inputJointSpace of motionHand.hand.values()) {
        let startJointInfo = newtonJoints.get(inputJointSpace.jointName);

        if (!startJointInfo) {
          newtonJoints.set(inputJointSpace.jointName, {
            name: inputJointSpace.jointName,
            properties: {
              position: new Vector3(),
              orientation: new Quaternion(),
            },
            isTipJoint: isTipJointName(inputJointSpace.jointName),
          });
          startJointInfo = newtonJoints.get(inputJointSpace.jointName);
        }

        if (!startJointInfo) continue;

        const startJointPose = frame.getJointPose?.(
          inputJointSpace,
          referenceSpace,
        );

        if (!startJointPose) continue;

        const storedJoint = newtonJoints.get(inputJointSpace.jointName);

        if (!storedJoint) {
          newtonJoints.set(inputJointSpace.jointName, startJointInfo);
        }

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

        /**
         * If the hand sensor is being used and the current
         * inputJointSpace is classified as a PalmJoint, we
         * will update the palm joint
         */
        if (usingSensor && isPalmJointName(inputJointSpace.jointName)) {
          const palmJoint = newtonPalm.joints.get(inputJointSpace.jointName);

          if (!palmJoint) {
            newtonPalm.joints.set(inputJointSpace.jointName, startJointInfo);
          }
        }

        const connectedJoints =
          jointConnections[HandJoints[inputJointSpace.jointName]];

        if (!connectedJoints) continue;

        connectedJoints.forEach((endJointName) => {
          if (!startJointInfo) {
            console.log(
              "startJointInfo is null inside connectedJoints.forEach",
            );
            return;
          }
          const endJointInfo = newtonJoints?.get(endJointName);

          if (!endJointInfo) return;

          if (!newtonBones) {
            console.log("newtonBones is null inside connectedJoints.forEach");
            return;
          }

          // Quick fix, but works
          const endJointSpace = motionHand.hand.get(
            endJointName as unknown as number,
          );

          if (!endJointSpace) return;

          const { vector, position, direction, quaternion } =
            get().reservedThreeValues;

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

            if (newtonBones.size === 0) {
              console.log("no bones in store yet");
            }

            let storedBone = newtonBones.get(
              `${startJointInfo.name}--${endJointInfo.name}` as HandBoneNames,
            );

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
                  position: position.set(0, 0, 0).clone(),
                  orientation: quaternion.set(0, 0, 0, 1).clone(),
                },
                boneRef: createRef<RapierRigidBody>(),
                height: height,
              };
              newtonBones.set(
                `${startJointInfo.name}--${endJointInfo.name}` as HandBoneNames,
                storedBone,
              );

              storedBone = newtonBones.get(
                `${startJointInfo.name}--${endJointInfo.name}` as HandBoneNames,
              );
            }

            if (!storedBone) {
              console.log("still no stored bone");
              return;
            }

            const ref = storedBone.boneRef;

            const startPos = startJointInfo.properties.position;
            const startOrientation = startJointInfo.properties.orientation;

            const endPos = endJointInfo.properties.position;
            const endOrientation = endJointInfo.properties.orientation;

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

            /**
             * Updating the storedBone to reflect:
             * 1. the new position of the bone
             * 2. the new orientation of the bone
             * 3. the new position of the start joint
             * 4. the new orientation of the start joint
             * 5. the new position of the end joint
             * 6. the new orientation of the end joint
             */
            storedBone.bone.position.copy(position);
            storedBone.bone.orientation.copy(quaternion);

            storedBone.startJoint.properties.position.copy(startPos);
            storedBone.startJoint.properties.orientation.copy(startOrientation);

            storedBone.endJoint.properties.position.copy(endPos);
            storedBone.endJoint.properties.orientation.copy(endOrientation);
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
            palm: newtonPalm,
            joints: newtonJoints,
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
