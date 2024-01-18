"use client";

import React, { Fragment } from "react";
import { useFixedJoint } from "@react-three/rapier";
import type { RapierRigidBody } from "@react-three/rapier";

interface ConnectiveFixedJointProps {
  children?: React.ReactNode;
  boneOneRef: React.RefObject<RapierRigidBody>;
  boneTwoRef: React.RefObject<RapierRigidBody>;
  //   connectingJointName: XRHandJoint;
}

export function ConnectiveFixedJoint({
  children,
  boneOneRef,
  boneTwoRef,
}: ConnectiveFixedJointProps) {
  const joint = useFixedJoint(boneOneRef, boneTwoRef, [
    [0, 0, 0],
    [0, 0, 0, 1],
    [0, 0, 0],
    [0, 0, 0, 1],
  ]);

  return (
    <Fragment>
      <>{children}</>
    </Fragment>
  );
}
