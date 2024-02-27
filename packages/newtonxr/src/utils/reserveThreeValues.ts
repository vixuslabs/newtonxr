import { Object3D, Quaternion, Vector3 } from "three";

export const _vector = new Vector3();
export const _position = new Vector3();
export const _direction = new Vector3();
export const _quaternion = new Quaternion();
export const _quaternion2 = new Quaternion();
export const _object = new Object3D();

export const ORIGIN = new Vector3(0, 0, 0);

export const AXIS_VECTORS = {
  x: new Vector3(1, 0, 0),
  y: new Vector3(0, 1, 0),
  z: new Vector3(0, 0, 1),
};
