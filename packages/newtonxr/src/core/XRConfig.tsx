"use client";

import { useFrame } from "@react-three/fiber";
import { useNewton } from "./store.js";

export default function XRConfig() {
  useFrame(useNewton().onFrame);

  return null;
}
