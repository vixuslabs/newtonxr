"use client";

import React, { Fragment } from "react";
import { useSphericalJoint } from "@react-three/rapier";
import type { RapierRigidBody } from "@react-three/rapier";

interface ConnectiveSphericalJointProps {
  children?: React.ReactNode;
  boneOneRef: React.RefObject<RapierRigidBody>;
  boneTwoRef: React.RefObject<RapierRigidBody>;
}

export function ConnectiveSphericalJoint({
  children,
  boneOneRef,
  boneTwoRef,
}: ConnectiveSphericalJointProps) {
  const joint = useSphericalJoint(boneOneRef, boneTwoRef, [
    [0, 0, 0],
    [0, 0, 0],
  ]);

  return (
    <Fragment>
      <>{children}</>
    </Fragment>
  );
}
