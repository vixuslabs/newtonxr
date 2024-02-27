import type { RootState } from "@react-three/fiber";
import { create, type StoreApi } from "zustand";
import { combine } from "zustand/middleware";

import type { BoneInfo, JointInfo, PalmJointMap } from "./TrueHandClass.js";

export interface PalmProperties {
  joints: PalmJointMap;
  position: THREE.Vector3;
  orientation: THREE.Quaternion;
  direction: THREE.Vector3;
  handedness?: "left" | "right";
}

// export interface AdjacentBoneNames {}

// export type JointToBoneNames = Record<XRHandJoint>;

// export type HandBoneMapping = {
//   [Key in HandBoneNames]: XRHandJoint;
// };

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

// type ActualHandBoneNames =
//   | "wrist"
//   | "thumb-metacarpal"
//   | "thumb-phalanx-proximal"
//   | "thumb-phalanx-distal"
//   | "index-finger-metacarpal"
//   | "index-finger-phalanx-proximal"
//   | "index-finger-phalanx-intermediate"
//   | "index-finger-phalanx-distal"
//   | "middle-finger-metacarpal"
//   | "middle-finger-phalanx-proximal"
//   | "middle-finger-phalanx-intermediate"
//   | "middle-finger-phalanx-distal"
//   | "ring-finger-metacarpal"
//   | "ring-finger-phalanx-proximal"
//   | "ring-finger-phalanx-intermediate"
//   | "ring-finger-phalanx-distal"
//   | "pinky-finger-metacarpal"
//   | "pinky-finger-phalanx-proximal"
//   | "pinky-finger-phalanx-intermediate"
//   | "pinky-finger-phalanx-distal";

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

interface HandProperties {
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
  // reservedThreeValues: {
  //   vector: THREE.Vector3;
  //   position: THREE.Vector3;
  //   direction: THREE.Vector3;
  //   quaternion: THREE.Quaternion;
  //   object: THREE.Object3D;
  // };
} & {
  onNextFrameCallbacks: Set<
    (state: RootState, delta: number, frame: XRFrame | undefined) => void
  >;
  threeStore?: StoreApi<RootState>;
};

export function isTipJointName(name: XRHandJoint): boolean {
  return name.includes("tip");
}

interface NewtonStateMethods {
  testUpdateHandBones: (
    hand: XRHand,
    handedness: XRHandedness,
    frame: XRFrame,
    referenceSpace: XRReferenceSpace,
    updateRapier: boolean,
    usingSensor?: boolean,
  ) => void;
  updateHandBones: (
    hand: XRHand,
    handedness: XRHandedness,
    frame: XRFrame,
    referenceSpace: XRReferenceSpace,
    updateRapier: boolean,
    usingSensor?: boolean,
  ) => void;
}

const initialState: NewtonState & NewtonStateMethods = {
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
  onNextFrameCallbacks: new Set(),
  updateHandBones: () => {
    return null;
  },
  testUpdateHandBones: () => {
    return null;
  },
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
          targetRayMode !== "tracked-pointer" ||
          !targetRaySpace ||
          !frame
        )
          continue;

        const pose = frame.getPose(gripSpace, referenceSpace);

        if (!pose || !gamepad) continue;

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
