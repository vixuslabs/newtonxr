# @vixuslabs/newtonxr

## 1.1.0

### Minor Changes

- 71e5c71: - `BuildPhysicalMeshes` and `BuildPhysicalPlanes` now require you to
  pass in your `meshes` and `planes`, respectively.

## 1.0.1

### Patch Changes

- - remove bundling to fix errors with BuildPhysicalMeshes and
    BuildPhysicalPlanes
  - add "use strict" banner

## 1.0.0

### Major Changes

- `PhysHand` has been replaced by `TrueHand`.
- `PhysHand` was removed as well as any underlying components and hooks that was
  solely utilized by PhysHand.
- Refocused

The decision to replace `PhysHand` with `TrueHand` was driven by performance
considerations. `PhysHand` was structured to have 24 bones, each being a its own
child `RigidBody` component. This was not the most efficient approach. To
address this, `TrueHand` is built and updated outside of React, then synced with
React. This approach significantly improves performance by significantly
reducing the overhead within React.

With the Addition addition of `TrueHand`, newtonxr will now be focused on
creating the best hand physics possible. It is still early, but it will
continuously get better and better. Making it impertive that you can easily
integrate newtonxr into your project.
