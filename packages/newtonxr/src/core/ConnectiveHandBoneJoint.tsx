"use client";

import React from "react";
import type { RapierRigidBody } from "@react-three/rapier";

import {
  ConnectiveFixedJoint,
  ConnectiveRevoluteJoint,
  ConnectiveSphericalJoint,
} from "./index.js";

export enum JointType {
  Fixed = "fixed",
  Spherical = "spherical",
  Revolute = "revolute",
  Prismatic = "prismatic",
}

export const jointTypeMappings = new Map<XRHandJoint, JointType>([
  // Wrist and thumb joints
  ["wrist", JointType.Spherical],
  ["thumb-metacarpal", JointType.Spherical],
  ["thumb-phalanx-proximal", JointType.Spherical],
  ["thumb-phalanx-distal", JointType.Revolute],
  ["thumb-tip", JointType.Fixed],

  // Index finger joints
  ["index-finger-metacarpal", JointType.Spherical],
  ["index-finger-phalanx-proximal", JointType.Spherical],
  ["index-finger-phalanx-intermediate", JointType.Revolute],
  ["index-finger-phalanx-distal", JointType.Revolute],
  ["index-finger-tip", JointType.Fixed],

  // Middle finger joints
  ["middle-finger-metacarpal", JointType.Spherical],
  ["middle-finger-phalanx-proximal", JointType.Spherical],
  ["middle-finger-phalanx-intermediate", JointType.Revolute],
  ["middle-finger-phalanx-distal", JointType.Revolute],
  ["middle-finger-tip", JointType.Fixed],

  // Ring finger joints
  ["ring-finger-metacarpal", JointType.Spherical],
  ["ring-finger-phalanx-proximal", JointType.Spherical],
  ["ring-finger-phalanx-intermediate", JointType.Revolute],
  ["ring-finger-phalanx-distal", JointType.Revolute],
  ["ring-finger-tip", JointType.Fixed],

  // Pinky finger joints
  ["pinky-finger-metacarpal", JointType.Spherical],
  ["pinky-finger-phalanx-proximal", JointType.Spherical],
  ["pinky-finger-phalanx-intermediate", JointType.Revolute],
  ["pinky-finger-phalanx-distal", JointType.Revolute],
  ["pinky-finger-tip", JointType.Fixed],
]);

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
