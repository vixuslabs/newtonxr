import type { RootState } from "@react-three/fiber";
import { create } from "zustand";
import type { StoreApi } from "zustand";
import { combine } from "zustand/middleware";

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

export type NewtonState = {
  controllers: {
    left: XRController | null;
    right: XRController | null;
  };
  hands: {
    left: XRHand | null;
    right: XRHand | null;
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
  onNextFrameCallbacks: new Set(),
};

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

      // set Controllers state
      const inputSources = frame?.session.inputSources;
      // const inputSources = frame?.session.inputSources.values();

      // const stateControllers: XRController[] = [];

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
