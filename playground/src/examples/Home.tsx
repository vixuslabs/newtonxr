import { getInputSourceId } from "@coconut-xr/natuerlich";
import { XRCanvas } from "@coconut-xr/natuerlich/defaults";
import {
  // NonImmersiveCamera,
  ImmersiveSessionOrigin,
  useEnterXR,
  useHeighestAvailableFrameRate,
  useInputSources,
  useNativeFramebufferScaling,
  useSessionChange,
  useSessionSupported,
} from "@coconut-xr/natuerlich/react";
// import XRPhysics from "@vixuslabs/newtonxr/core";
// import Test from "newtonxr";

// import PhysicalController from "../../src/PhysicalController";

// import { BuildPhysicalMeshes, BuildPhysicalPlanes } from "../../src";

import {
  BuildPhysicalMeshes,
  BuildPhysicalPlanes,
  PhysicalBall,
  PhysicalController,
  SpatialHand,
  XRPhysics,
  // } from "@vixuslabs/newtonxr";
} from "newtonxr";
import React, { useState } from "react";

const sessionOptions: XRSessionInit = {
  requiredFeatures: [
    "local-floor",
    "mesh-detection",
    "plane-detection",
    "hand-tracking",
  ],
};

export default function Home() {
  const [startSync, setStartSync] = useState(false);
  const enterAR = useEnterXR("immersive-ar", sessionOptions);
  const inputSources = useInputSources();

  const isSupported = useSessionSupported("immersive-ar");

  useSessionChange((curSession, prevSession) => {
    if (prevSession && !curSession) {
      console.log("session ended");
      setStartSync(false);
    }
  }, []);

  const frameBufferScaling = useNativeFramebufferScaling();
  const frameRate = useHeighestAvailableFrameRate();

  return (
    <div className="home-page">
      <div className="home-container">
        <h1 className="home-title">NewtonXR Playground</h1>
        <button
          disabled={!isSupported}
          className="home-button"
          onClick={() => {
            console.log("clicked!");
            void enterAR().then(() => {
              console.log("entered");
              setStartSync(true);
            });
          }}
        >
          {isSupported ? "Begin" : "Device not Compatible :("}
        </button>
      </div>
      <XRCanvas
        frameBufferScaling={frameBufferScaling}
        frameRate={frameRate}
        dpr={[1, 2]}
        // // @ts-expect-error - import error
        // events={clippingEvents}
        gl={{ localClippingEnabled: true }}
      >
        <XRPhysics debug>
          {startSync && (
            <>
              <PhysicalBall position={[0, 1, -0.2]} />
            </>
          )}

          <ImmersiveSessionOrigin>
            <BuildPhysicalMeshes excludeGlobalMesh />
            <BuildPhysicalPlanes />
            {inputSources?.map((inputSource) =>
              inputSource.hand ? (
                // <GrabHand
                <SpatialHand
                  key={getInputSourceId(inputSource)}
                  inputSource={inputSource}
                  id={getInputSourceId(inputSource)}
                  hand={inputSource.hand}
                />
              ) : (
                <PhysicalController
                  key={getInputSourceId(inputSource)}
                  id={getInputSourceId(inputSource)}
                  inputSource={inputSource}
                />
              ),
            )}
          </ImmersiveSessionOrigin>
        </XRPhysics>
      </XRCanvas>
    </div>
  );
}
