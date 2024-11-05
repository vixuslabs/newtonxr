<div align="center">

# newtonxr

### No longer being maintained

[![npm](https://img.shields.io/npm/v/@vixuslabs/newtonxr)](https://www.npmjs.com/package/@vixuslabs/newtonxr)
[![GitHub](https://img.shields.io/github/license/vixuslabs/newtonxr)]()

</div>

## Description

`newtonxr` is a library designed to seamlessly integrate physics-based hands
into XR/VR experiences. At the heart of `newtonxr` is the `TrueHand` component,
which utilizes `@dimforge/rapier3d-compat` to provide a realistic and
interactive hand physics model.

`@coconut-xr/natuerlich` is used to properly integrate `newtonxr` with WebXR

`@react-three/rapier` is used to create the physics objects and world.

## Installation

`newtonxr` is developed using `pnpm`, but it is packaged in a way that allows it
to be easily installed and used in projects that utilize `npm` or `yarn`.

To install `newtonxr`, you can use npm, yarn, or pnpm:

```bash
npm install @vixuslabs/newtonxr
# or
yarn add @vixuslabs/newtonxr
# or
pnpm add @vixuslabs/newtonxr
```

## Usage

To use `newtonxr` in your project, you can import the components and utilities
as needed. Here's an example of how to use the `TrueHand` component, the
centerpiece of the library:

```tsx
import { Suspense } from "react";
import { getInputSourceId } from "@coconut-xr/natuerlich";
import { XRCanvas } from "@coconut-xr/natuerlich/defaults";
import {
  FocusStateGuard,
  ImmersiveSessionOrigin,
  useEnterXR,
  useHeighestAvailableFrameRate,
  useInputSources,
} from "@coconut-xr/natuerlich/react";
import { TrueHand } from "@vixuslabs/newtonxr";

const sessionOptions: XRSessionInit = {
  requiredFeatures: ["local-floor", "hand-tracking"],
  optionalFeatures: ["mesh-detection", "plane-detection"],
};

function MyXRScene() {
  const inputSources = useInputSources();

  return (
    /* Essentially the @react-three/fiber canvas with XR configurated */
    <XRCanvas>
      <XRPhysics>
        <TrueHand
          key={getInputSourceId(inputSource)}
          id={getInputSourceId(inputSource)}
          XRHand={inputSource.hand}
          inputSource={inputSource}
          /* Properties for TrueHand */
        />
        {/* Other XR scene and @react-three/rapier components */}
      </XRPhysics>
    </XRCanvas>
  );
}
```

## API Documentation

The `newtonxr` library provides several components and utilities for building
immersive XR experiences, with a focus on physics-integrated hands:

- `TrueHand`: The core component of the library, representing a hand with
  physics interactions.
- `XRPhysics`: Sets up the physics environment for your XR scene.
- `PhysicalObject`: Represents a physical object in the XR scene. More of a
  helper component to get started.

## Contributing

Contributions are welcome! As of now, there are not contribution guidelines -
this will be updated in the future.

## License

`newtonxr` is licensed under the [MIT License](LICENSE).
