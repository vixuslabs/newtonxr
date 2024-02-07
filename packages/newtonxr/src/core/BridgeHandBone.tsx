import React, { forwardRef } from "react";
import {
  RigidBody,
  type RapierRigidBody,
  type RigidBodyOptions,
} from "@react-three/rapier";

interface BridgeHandBoneProps extends RigidBodyOptions {
  children?: React.ReactNode;
}

export interface BridgeHandBoneUserData {
  type: string;
}

export const BridgeHandBone = forwardRef<RapierRigidBody, BridgeHandBoneProps>(
  ({ children, ...props }, ref) => {
    return (
      <RigidBody
        {...props}
        ref={ref}
        userData={
          {
            type: "bridge-hand-bone",
          } as BridgeHandBoneUserData
        }
      >
        {children}
      </RigidBody>
    );
  },
);

BridgeHandBone.displayName = "BridgeHandBone";
