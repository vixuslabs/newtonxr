import React, { forwardRef, useImperativeHandle } from "react";
import { RigidBody, type RapierRigidBody } from "@react-three/rapier";

interface BridgeHandProps {
  children?: React.ReactNode;
}

type BridgeHandRef = React.RefObject<RapierRigidBody>;

/**
 * The middle layer between the WebXR Hand and the visible Rapier Hand
 * @returns
 */

const BridgeHand = forwardRef<BridgeHandRef, BridgeHandProps>(
  ({ children }, ref) => {
    const handRef = React.useRef<RapierRigidBody>(null);

    useImperativeHandle(ref, () => handRef);
    return (
      <RigidBody type="dynamic" ref={handRef}>
        {children}
      </RigidBody>
    );
  },
);

BridgeHand.displayName = "BridgeHand";

export default BridgeHand;
