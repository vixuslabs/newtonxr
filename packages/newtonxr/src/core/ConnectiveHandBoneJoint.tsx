"use client";

import React from "react";
import type { RapierRigidBody } from "@react-three/rapier";

import { JointType, jointTypeMappings } from "../hooks/useHandHooks.js";
import {
  ConnectiveFixedJoint,
  ConnectiveRevoluteJoint,
  ConnectiveSphericalJoint,
} from "./index.js";

interface HandBoneJointsProps {
  children: React.ReactNode;
  boneOneRef: React.RefObject<RapierRigidBody>;
  boneTwoRef: React.RefObject<RapierRigidBody>;
  connectingJointName: XRHandJoint;
}

export function ConnectiveHandBoneJoint({
  children,
  boneOneRef,
  boneTwoRef,
  connectingJointName,
}: HandBoneJointsProps) {
  const jointType = jointTypeMappings.get(connectingJointName);

  if (!jointType) return null;

  switch (jointType) {
    case JointType.Fixed:
      return (
        <ConnectiveFixedJoint boneOneRef={boneOneRef} boneTwoRef={boneTwoRef}>
          {children}
        </ConnectiveFixedJoint>
      );
    case JointType.Spherical:
      return (
        <ConnectiveSphericalJoint
          boneOneRef={boneOneRef}
          boneTwoRef={boneTwoRef}
        >
          {children}
        </ConnectiveSphericalJoint>
      );
    case JointType.Revolute:
      return (
        <ConnectiveRevoluteJoint
          boneOneRef={boneOneRef}
          boneTwoRef={boneTwoRef}
        >
          {children}
        </ConnectiveRevoluteJoint>
      );
    default:
      console.log("default");
      return (
        <>
          <>{children}</>
        </>
      );
  }
}
