import { create } from "zustand";
import { combine } from "zustand/middleware";

import type { RootState } from "@react-three/fiber";
import type { StoreApi } from "zustand";

type GamepadAxes = {
  name: string;
  value: number;
};

type ButtonsState = {
  name: string;
} & GamepadButton;

interface XRController {
  handedness: "left" | "right";
  pose: XRPose;
  buttons: ButtonsState[];
  axes: GamepadAxes[];
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
  heldObjects: {
    left: string | null;
    right: string | null;
  };
  collisions: string[];
} & {
  onNextFrameCallbacks: Set<
    (state: RootState, delta: number, frame: XRFrame | undefined) => void
  >;
  store?: StoreApi<RootState>;
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
  collisions: ["hey"],
  onNextFrameCallbacks: new Set(),
};

export const useNewton = create(
  combine(initialState, (set, get) => ({
    onFrame: (state: RootState, delta: number, frame: XRFrame | undefined) => {
      const { onNextFrameCallbacks } = get();

      for (const onNextFrameCallback of onNextFrameCallbacks) {
        onNextFrameCallback(state, delta, frame);
      }

      onNextFrameCallbacks.clear();

      const referenceSpace = state.get().gl.xr.getReferenceSpace();

      if (referenceSpace === null) return;

      // set Controllers state
      const inputSources = frame?.session.inputSources;

      // const stateControllers: XRController[] = [];

      for (const inputSource of inputSources || []) {
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
                  name: "unknown",
                  pressed: btn.pressed,
                  touched: btn.touched,
                  value: btn.value,
                };
              }
            }
          })
          .filter(Boolean);

        //   const buttonMappings = {
        //     0: { name: "trigger" },
        //     1: { name: "grip" },
        //     3: { name: "thumbstick" },
        //     4: { name: handedness === "left" ? "x" : "a" },
        //     5: { name: handedness === "left" ? "y" : "b" },
        // };

        // const buttons = gamepad.buttons
        //     .map((btn, index) => {
        //         const mapping = buttonMappings[index];
        //         if (!mapping) return null;

        //         return {
        //             ...mapping,
        //             pressed: btn.pressed,
        //             touched: btn.touched,
        //             value: btn.value,
        //         };
        //     })
        //     .filter(Boolean);

        const axes = gamepad.axes
          .map((axis, index) => {
            if (index === 0 || index === 1) null;
            return {
              name: index === 2 ? "x" : "y",
              value: axis,
            };
          })
          .filter(Boolean);

        const controller: XRController = {
          handedness,
          pose,
          buttons,
          axes,
        };

        set((state) => ({
          ...state,
          controllers: {
            ...state.controllers,
            [handedness]: controller,
          },
        }));

        // stateControllers.push(controller);
      }

      // set({
      //   controllers: {
      //     left: stateControllers.find(
      //       (controller) => controller.handedness === "left"
      //     ),
      //     right: stateControllers.find(
      //       (controller) => controller.handedness === "right"
      //     ),
      //   },
      // });
    },
    setThreeStore: (store: StoreApi<RootState>) => {
      set({ store });
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
  })),
);
