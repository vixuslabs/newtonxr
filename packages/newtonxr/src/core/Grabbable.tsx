"use client";

import { isXIntersection } from "@coconut-xr/xinteraction";
import { useFrame, type ThreeEvent } from "@react-three/fiber";
import {
  vec3,
  // vec3,
  type RapierRigidBody,
} from "@react-three/rapier";
import React, {
  forwardRef,
  useMemo,
  useRef,
  // useCallback,
  type MutableRefObject,
} from "react";
// import { Matrix4, Quaternion, Vector3 } from "three";
import { Vector3 } from "three";

// import { useNewton } from "../state.js";
import { useControllersState } from "../hooks/useControllersState.js";
import { useHeldObjects } from "../hooks/useHeldObjects.js";

// import { vec3 } from "@react-three/rapier";

export interface RigidAndMeshRefs {
  rigidRef: React.RefObject<RapierRigidBody>;
  meshRef: React.RefObject<
    THREE.Mesh<
      THREE.BufferGeometry<THREE.NormalBufferAttributes>,
      THREE.Material | THREE.Material[],
      THREE.Object3DEventMap
    >
  >;
}

export interface GrabProps {
  name: string;
  children: React.ReactNode;
  physicsActive?: boolean;
  handleGrab: (e: ThreeEvent<PointerEvent>) => void;
  handleRelease: (
    e: ThreeEvent<PointerEvent>,
    velocity?: THREE.Vector3,
  ) => void;
  isDeletable?: boolean;
}

// eslint-disable-next-line react/display-name
export const Grabbable = forwardRef<RigidAndMeshRefs, GrabProps>(
  ({ name, children, handleGrab, handleRelease }, ref) => {
    // const newton = useNewton();
    const { heldObject: leftHeldObject } = useHeldObjects("left");
    const { heldObject: rightHeldObject } = useHeldObjects("right");
    const [leftController, rightController] = useControllersState();
    // const { interactionPoints } = useNewton();
    const downState = useRef<{
      pointerId: number;
      pointToObjectOffset: THREE.Vector3;
      zPosition: number;
      positions: THREE.Vector3[];
      timestamps: number[];
    }>();
    const maxEntries = useMemo(() => 5, []);
    // const impluseVector = useMemo(() => vec3({ x: 0, y: 0, z: 0 }), []);
    const changeInPosition = useRef<Vector3>(new Vector3(0, 0, 0));
    const currentObjectPosition = useRef<Vector3>(new Vector3(0, 0, 0));
    const currentObjectVelocity = useRef<Vector3>(new Vector3(0, 0, 0));

    // const currentPointerPosition = useRef<Vector3>(new Vector3(0, 0, 0));
    // const pointerOffset = useRef<Vector3>(new Vector3(0, 0, 0));
    const pointerWorldPosition = useRef<Vector3>(new Vector3(0, 0, 0));

    // const currentControllerPosition = useRef<Vector3>(new Vector3(0, 0, 0));
    // const currentControllerOrientation = useRef<Quaternion>(
    //   new Quaternion(0, 0, 0, 0),
    // );
    // const transformMatrix = useRef<THREE.Matrix4>(new Matrix4());
    const directionVector = useRef<Vector3>(new Vector3(0, 0, 0));
    const rigidRef = useMemo(
      () =>
        (ref as MutableRefObject<RigidAndMeshRefs>).current
          .rigidRef as MutableRefObject<RapierRigidBody>,
      [ref],
    );

    const meshRef = useMemo(
      // () => ref!.current?.meshRef as MutableRefObject<Mesh>,
      () => (ref as MutableRefObject<RigidAndMeshRefs>).current.meshRef,
      [ref],
    );

    useFrame(() => {
      if (!downState.current || !rigidRef.current) {
        return;
      }

      console.log("inside useFrame after return");

      const heldByLeft = leftHeldObject === meshRef.current?.uuid;
      const heldByRight = rightHeldObject === meshRef.current?.uuid;

      console.log("heldByLeft", heldByLeft);
      console.log("heldByRight", heldByRight);

      if (heldByLeft || heldByRight) {
        console.log("\n-------------------");
        const controller = heldByLeft ? leftController : rightController;
        const controllerPosition = controller?.pose.transform.position;
        const controllerOrientation = controller?.pose.transform.orientation;
        const zPointer = controller?.pointer;
        console.log("controller", controller);
        console.log("controllerPosition", controllerPosition);
        console.log("zPointer", zPointer);
        if (zPointer && controllerPosition && controllerOrientation) {
          console.log(
            "before set - rigidRef.current.translation()",
            rigidRef.current.translation(),
          );

          rigidRef.current.setTranslation(
            vec3({
              x: controllerPosition.x,
              y: controllerPosition.y,
              z: controllerPosition.z,
            }),
            true,
          );
          // rigidRef.current.setTranslation(
          //   vec3(currentControllerPosition.current),
          //   true
          // );

          console.log(
            "after set - rigidRef.current.translation()",
            rigidRef.current.translation(),
          );

          console.log("pointerWorldPosition", pointerWorldPosition);

          const objectPosition = rigidRef.current.translation();

          currentObjectPosition.current.set(
            objectPosition.x,
            objectPosition.y,
            objectPosition.z,
          );

          const displacement = pointerWorldPosition.current.sub(
            currentObjectPosition.current,
          );

          console.log("displacement", displacement);

          const springConstant = 0.1; // Adjust this value as needed
          const springForce = displacement.multiplyScalar(springConstant);

          console.log("springForce", springForce);

          const objectVel = rigidRef.current.linvel();
          const dampingCoefficient = 0.5; // Adjust this value as needed

          currentObjectVelocity.current.set(
            objectVel.x,
            objectVel.y,
            objectVel.z,
          );

          const dampingForce =
            currentObjectVelocity.current.multiplyScalar(dampingCoefficient);

          console.log("dampingForce", dampingForce);

          const totalForce = springForce.add(dampingForce);

          console.log("totalForce", totalForce);

          console.log("-------------");
        }
      }
    });

    const handleObjectMove = (e: ThreeEvent<PointerEvent>) => {
      console.log("inside handleObjectMove");

      if (!rigidRef.current) {
        return;
      }

      const heldByLeft = leftHeldObject === meshRef.current?.uuid;
      const heldByRight = rightHeldObject === meshRef.current?.uuid;

      console.log("heldByLeft", heldByLeft);
      console.log("heldByRight", heldByRight);

      if (heldByLeft || heldByRight) {
        const controller = heldByLeft ? leftController : rightController;

        const controllerPosition = controller?.pose.transform.position;
        const controllerOrientation = controller?.pose.transform.orientation;
        const matrix = controller?.pose.transform.matrix;
        const zPosition = controller?.pointer;

        if (
          !controllerPosition ||
          !controllerOrientation ||
          !matrix ||
          !zPosition
        )
          return;

        const pos = new Vector3(
          controllerPosition.x,
          controllerPosition.y,
          controllerPosition.z,
        );

        directionVector.current.set(0, 0, 0);

        directionVector.current.subVectors(e.point, pos).normalize();
        // console.log("rayDirection", rayDirection);
        // const offset = currentPointerState.z;

        const adjustedPosition = new Vector3().addVectors(
          pos,
          directionVector.current.multiplyScalar(-zPosition),
        );

        // const mat = new Matrix4().fromArray(matrix);

        if (controllerPosition && controllerOrientation) {
          // rigidRef.current.setTranslation(vec3(e.point), true);
          // rigidRef.current.setTranslation(vec3(pos), false);
          rigidRef.current.setTranslation(vec3(adjustedPosition), false);
        }
      }
    };

    return (
      <mesh
        name={name}
        ref={meshRef}
        onPointerDown={(e) => {
          if (
            meshRef.current != null &&
            meshRef.current.visible &&
            downState.current == null &&
            isXIntersection(e)
          ) {
            e.stopPropagation();
            console.log("setting object pressed");
            (e.target as HTMLElement).setPointerCapture(e.pointerId);

            const timeStamp = new Date().getTime();
            const currentObjectPosition = rigidRef.current.translation();

            const currentPosition = new Vector3(
              currentObjectPosition.x,
              currentObjectPosition.y,
              currentObjectPosition.z,
            );

            changeInPosition.current = currentPosition;

            downState.current = {
              pointerId: e.pointerId,
              pointToObjectOffset: meshRef.current.position
                .clone()
                .sub(e.point),
              zPosition: e.point.z,
              // positions: [currentPosition],
              positions: [e.point],
              timestamps: [timeStamp],
            };
            handleGrab(e);
          }
        }}
        onPointerUp={(e) => {
          if (downState.current?.pointerId != e.pointerId) {
            return;
          }
          if (
            downState.current.positions.length > 1 &&
            downState.current.timestamps
          ) {
            const lastIndex = downState.current.positions.length - 1;
            const deltaTime =
              (downState.current.timestamps[lastIndex]! -
                downState.current.timestamps[0]!) /
              1000;

            const deltaPosition = downState.current.positions[
              lastIndex
            ]!.clone().sub(downState.current.positions[0]!);
            const velocity = deltaPosition.divideScalar(deltaTime);

            downState.current = undefined;

            handleRelease(e, velocity);
          }
        }}
        onPointerMove={(e) => {
          if (meshRef.current && downState.current && isXIntersection(e)) {
            const heldByLeft = leftHeldObject === meshRef.current.uuid;
            const heldByRight = rightHeldObject === meshRef.current.uuid;

            if (!heldByLeft && !heldByRight) return;

            // const currentEPoint = e.point;

            const currentTimeStamp = new Date().getTime();
            downState.current.positions.push(e.point);
            downState.current.timestamps.push(currentTimeStamp);

            if (downState.current.positions.length > maxEntries) {
              downState.current.positions.shift();
              downState.current.timestamps.shift();
            }

            if (downState.current.positions.length < 2) {
              return;
            } else {
              handleObjectMove(e);
            }

            // const lastPositionIndex = downState.current.positions.length - 1;
            // const lastTimestampIndex = downState.current.timestamps.length - 1;
            // const deltaTime =
            //   (downState.current.timestamps[lastTimestampIndex]! -
            //     downState.current.timestamps[0]) /
            //   1000;

            // const deltaPosition = downState.current.positions[lastPositionIndex]
            //   .clone()
            //   .sub(downState.current.positions[0]!);
            // const velocity = deltaPosition.divideScalar(deltaTime);

            // rigidRef.current.applyImpulse(vec3(velocity), true);
          }
        }}
      >
        {children}
      </mesh>
    );
  },
);
