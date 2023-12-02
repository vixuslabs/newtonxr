"use client";

import { RayBasicMaterial } from "@coconut-xr/natuerlich/defaults";
import {
  DynamicControllerModel,
  SpaceGroup,
  useInputSourceEvent,
} from "@coconut-xr/natuerlich/react";
import type { XLinesIntersection } from "@coconut-xr/xinteraction";
import { XCurvedPointer } from "@coconut-xr/xinteraction/react";
import type { InputDeviceFunctions } from "@coconut-xr/xinteraction/react";
import { useFrame } from "@react-three/fiber";
import React, {
  Suspense,
  useCallback,
  useMemo,
  useRef,
  useState,
  // useEffect,
} from "react";
import { Vector3 } from "three";

import { useNewton } from "./core/store.js";
import { useControllersState } from "./hooks/useControllersState.js";
import { useHeldObjects } from "./hooks/useHeldObjects.js";

interface PhysicalControllerProps {
  inputSource: XRInputSource;
  id: number;
}

const rayMaterial = new RayBasicMaterial({
  transparent: true,
  toneMapped: false,
});

const INITIAL_POINT = new Vector3(0, 0, 0);
const INITIAL_RAY_LENGTH = 0.01;
const RAY_ADJUSTMENT_SPEED = 0.6;

export function PhysicalController({
  inputSource,
  id,
}: PhysicalControllerProps) {
  const [rayLength, setRayLength] = useState<number>(INITIAL_RAY_LENGTH);
  const pointerRef = useRef<InputDeviceFunctions>(null);
  const pointerPoints = useMemo(
    () => [INITIAL_POINT, new Vector3(0, 0, -rayLength)],
    [rayLength],
  );
  const rayOffset = useMemo(() => rayLength * 0.5, [rayLength]);
  const controllerRef = useRef<THREE.Group>(null);

  const handedness = useMemo(
    () => inputSource.handedness,
    [inputSource.handedness],
  );
  const { setInteractionPoint, updateControllerPointer } = useNewton();

  const [controllerState] = useControllersState(handedness);

  const { heldObject, setHeldObject, clearHeldObject } = useHeldObjects(
    inputSource.handedness,
  );

  const handleSelectEnd = useCallback((e: XRInputSourceEvent) => {
    /* eslint-disable */
    pointerRef.current?.release(0, e);
    /* eslint-enable */
  }, []);

  const handleSelectStart = useCallback((e: XRInputSourceEvent) => {
    e.inputSource.gamepad?.hapticActuators.forEach((haptic) => {
      void haptic.playEffect("dual-rumble", {
        duration: 100,
        strongMagnitude: 0.5,
        weakMagnitude: 0.5,
      });
    });
    /* eslint-disable */
    pointerRef.current?.press(0, e);
    /* eslint-enable */
  }, []);

  const handleIntersection = (
    intersection: readonly XLinesIntersection[],
    // handedness: "left" | "right"
  ) => {
    // console.log("intersection", intersection);
    if (
      intersection.length === 0 ||
      (intersection[0] && !intersection[0].capturedObject)
    ) {
      if (!heldObject) {
        return;
      }
      if (clearHeldObject) clearHeldObject();
      return;
    }

    const capturedObject = intersection[0]?.capturedObject;

    if (capturedObject?.uuid === heldObject || heldObject) {
      return;
    }

    console.log("capturedObject", capturedObject);

    if (setHeldObject) setHeldObject(capturedObject!.uuid);
  };

  useInputSourceEvent("selectstart", inputSource, handleSelectStart, [
    rayLength,
  ]);

  useInputSourceEvent("selectend", inputSource, handleSelectEnd, [rayLength]);

  useFrame((state, delta) => {
    let newRayLength = rayLength;

    const adjustment = RAY_ADJUSTMENT_SPEED * delta;

    if (!controllerState || handedness == "none") return;

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [_, yThumbstick] = controllerState.axes;

    if (!yThumbstick) return;

    if (yThumbstick.value < -0.2) {
      newRayLength += adjustment;
    } else if (yThumbstick.value > 0.2 && rayLength > INITIAL_RAY_LENGTH) {
      newRayLength -= adjustment;
    }

    if (newRayLength !== rayLength) {
      setRayLength(newRayLength);
      setInteractionPoint(handedness, {
        zPosition: -newRayLength,
        heldObjectId: heldObject,
      });
      updateControllerPointer(handedness, -newRayLength);
    }
  });

  return (
    <>
      {inputSource.gripSpace && (
        <SpaceGroup ref={controllerRef} space={inputSource.gripSpace}>
          <Suspense fallback={null}>
            <DynamicControllerModel inputSource={inputSource} />
          </Suspense>
        </SpaceGroup>
      )}
      <SpaceGroup space={inputSource.targetRaySpace}>
        <XCurvedPointer
          points={pointerPoints}
          ref={pointerRef}
          id={id}
          onIntersections={handleIntersection}
        />
        <mesh
          scale-x={0.005}
          scale-y={0.005}
          scale-z={rayLength}
          position-z={-rayOffset}
          material={rayMaterial}
        >
          <boxGeometry />
        </mesh>
      </SpaceGroup>
    </>
  );
}
