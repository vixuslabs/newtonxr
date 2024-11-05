import { Suspense, useState } from "react";
import { getInputSourceId } from "@coconut-xr/natuerlich";
import { XRCanvas } from "@coconut-xr/natuerlich/defaults";
import {
  FocusStateGuard,
  ImmersiveSessionOrigin,
  useEnterXR,
  useHeighestAvailableFrameRate,
  useInputSources,
  useNativeFramebufferScaling,
  useSessionChange,
  useSessionSupported,
  useTrackedMeshes,
  useTrackedPlanes,
} from "@coconut-xr/natuerlich/react";
import {
  BuildPhysicalMeshes,
  BuildPhysicalPlanes,
  PhysicalController,
  PhysicalObject,
  TrueHand,
  XRPhysics,
} from "@vixuslabs/newtonxr";

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
  const [clickedStart, setClickedStart] = useState(false);
  const enterAR = useEnterXR("immersive-ar", sessionOptions);
  const inputSources = useInputSources();
  const meshes = useTrackedMeshes();
  const planes = useTrackedPlanes();

  const isSupported = useSessionSupported("immersive-ar");

  useSessionChange((curSession, prevSession) => {
    if (prevSession && !curSession) {
      console.log("session ended");
      setStartSync(false);
      setClickedStart(false);
    }
  }, []);

  const frameBufferScaling = useNativeFramebufferScaling();
  const frameRate = useHeighestAvailableFrameRate();

  return (
    <div className="home-page">
      <div className="home-container">
        <h1 className="home-title">NewtonXR Playground</h1>
        <button
          disabled={!isSupported || clickedStart}
          className="home-button"
          onClick={() => {
            setClickedStart(true);
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
      <Suspense fallback={null}>
        <XRCanvas
          frameBufferScaling={frameBufferScaling}
          frameRate={frameRate}
          dpr={[1, 2]}
          className="absolute"
        >
          <ambientLight intensity={1} />
          <FocusStateGuard>
            <XRPhysics>
              {inputSources?.map((inputSource) =>
                inputSource.hand ? (
                  <TrueHand
                    key={getInputSourceId(inputSource)}
                    XRHand={inputSource.hand}
                    inputSource={inputSource}
                    id={getInputSourceId(inputSource)}
                    // fingersFriction={0}
                    // tipFingersFriction={10}
                    // density={10}
                    // restitution={0.8}
                  />
                ) : (
                  <PhysicalController
                    key={getInputSourceId(inputSource)}
                    id={getInputSourceId(inputSource)}
                    inputSource={inputSource}
                  />
                ),
              )}

              <ImmersiveSessionOrigin>
                <BuildPhysicalMeshes meshes={meshes} excludeGlobalMesh />
                <BuildPhysicalPlanes planes={planes} />

                {startSync && (
                  <>
                    <PhysicalObject restitution={0.5} position={[-0.2, 2, 0]} />
                    <PhysicalObject restitution={1.5} position={[0.3, 2, 0]}>
                      <sphereGeometry args={[0.04, 32, 32]} />
                      <meshBasicMaterial color={"cyan"} />
                    </PhysicalObject>

                    <Boxes />

                    {/* <PhysicalObject
                      friction={2}
                      restitution={0.75}
                      position={[0.2, 2, 0.2]}
                    >
                      <sphereGeometry args={[0.03, 32, 32]} />
                      <meshBasicMaterial color={"orange"} />
                    </PhysicalObject> */}
                  </>
                )}
              </ImmersiveSessionOrigin>
            </XRPhysics>
          </FocusStateGuard>
        </XRCanvas>
      </Suspense>
    </div>
  );
}

const Boxes = () => {
  return (
    <>
      <PhysicalObject
        colliders="cuboid"
        restitution={0.2}
        position={[-0.1, 2, -0.2]}
      >
        <boxGeometry args={[0.05, 0.05, 0.05]} />
        <meshBasicMaterial color={"orange"} />
      </PhysicalObject>

      {/* Boxes */}
      <PhysicalObject
        colliders="cuboid"
        restitution={0.2}
        position={[-0.05, 2, -0.2]}
      >
        <boxGeometry args={[0.05, 0.05, 0.05]} />
        <meshBasicMaterial color={"pink"} />
      </PhysicalObject>

      <PhysicalObject
        colliders="cuboid"
        restitution={0.2}
        position={[0, 2, -0.2]}
      >
        <boxGeometry args={[0.05, 0.05, 0.05]} />
        <meshBasicMaterial color={"green"} />
      </PhysicalObject>

      <PhysicalObject
        colliders="cuboid"
        restitution={0.2}
        position={[0.05, 2, -0.2]}
      >
        <boxGeometry args={[0.05, 0.05, 0.05]} />
        <meshBasicMaterial color={"blue"} />
      </PhysicalObject>

      <PhysicalObject
        colliders="cuboid"
        restitution={0.2}
        position={[0.1, 2, -0.2]}
      >
        <boxGeometry args={[0.05, 0.05, 0.05]} />
        <meshBasicMaterial color={"red"} />
      </PhysicalObject>
    </>
  );
};
