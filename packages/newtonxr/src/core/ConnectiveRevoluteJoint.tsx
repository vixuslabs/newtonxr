"use client";

import React, { Fragment } from "react";
import { useRevoluteJoint } from "@react-three/rapier";
import type { RapierRigidBody } from "@react-three/rapier";

interface ConnectiveRevoluteJointProps {
  children?: React.ReactNode;
  boneOneRef: React.RefObject<RapierRigidBody>;
  boneTwoRef: React.RefObject<RapierRigidBody>;
}

export function ConnectiveRevoluteJoint({
  children,
  boneOneRef,
  boneTwoRef,
}: ConnectiveRevoluteJointProps) {
  const joint = useRevoluteJoint(boneOneRef, boneTwoRef, [
    [0, 0, 0],
    [0, 0, 0],
    [0, 1, 0],
  ]);

  return (
    <Fragment>
      <>{children}</>
    </Fragment>
  );
}
