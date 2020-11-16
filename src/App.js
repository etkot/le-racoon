// model by eon/sketchfab https://sketchfab.com/3d-models/elven-ranger-statue-71aec2d9f7724ae09992435ce8ff7258

import * as THREE from "three"
import React, { Suspense, useEffect, useRef, useMemo } from "react"
import {
    Canvas,
    useThree,
    useFrame,
    extend,
    useLoader,
} from "react-three-fiber"
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer"
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass"
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass"
import { FXAAShader } from "three/examples/jsm/shaders/FXAAShader"
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader"
import { AdditiveBlendingShader, VolumetricLightShader } from "./shaders"

import "./App.css"

extend({ EffectComposer, RenderPass, ShaderPass })

const DEFAULT_LAYER = 0
const OCCLUSION_LAYER = 1

function Leracoon({ layer = DEFAULT_LAYER }) {
    const group = useRef()
    const gltf = useLoader(GLTFLoader, "/wideG.glb")
    console.log(gltf)

    const material = useMemo(() => {
        if (layer === DEFAULT_LAYER)
            return new THREE.MeshBasicMaterial(gltf.__$[4].material)
        else
            return new THREE.MeshBasicMaterial({
                color: new THREE.Color("black"),
            })
    }, [layer, gltf])

    useFrame(() => (group.current.rotation.y += 0.008))

    return (
        <group ref={group}>
            <group position={[0, 4.3, 0]} rotation={[-1, 0, 0]}>
                <mesh
                    rotation={[-1.57079633, 0, 0]}
                    position={[0, 0, 0]}
                    material={material}
                    layers={layer}
                    receiveShadow
                    castShadow
                >
                    <bufferGeometry
                        attach="geometry"
                        {...gltf.__$[4].geometry}
                    />
                </mesh>
            </group>
        </group>
    )
}

function Effects() {
    const { gl, scene, camera, size } = useThree()
    const occlusionRenderTarget = useMemo(
        () => new THREE.WebGLRenderTarget(),
        []
    )
    const occlusionComposer = useRef()
    const composer = useRef()

    useEffect(() => {
        occlusionComposer.current.setSize(size.width, size.height)
        composer.current.setSize(size.width, size.height)
    }, [size])

    useFrame(() => {
        camera.layers.set(OCCLUSION_LAYER)
        occlusionComposer.current.render()
        camera.layers.set(DEFAULT_LAYER)
        composer.current.render()
    }, 1)

    return (
        <>
            <mesh layers={OCCLUSION_LAYER} position={[0, 4.5, -10]}>
                <sphereBufferGeometry attach="geometry" args={[5, 32, 32]} />
                <meshBasicMaterial attach="material" color="#855656" />
            </mesh>
            <effectComposer
                ref={occlusionComposer}
                args={[gl, occlusionRenderTarget]}
                renderToScreen={false}
            >
                <renderPass attachArray="passes" args={[scene, camera]} />
                <shaderPass
                    attachArray="passes"
                    args={[VolumetricLightShader]}
                    needsSwap={false}
                />
            </effectComposer>
            <effectComposer ref={composer} args={[gl]}>
                <renderPass attachArray="passes" args={[scene, camera]} />
                <shaderPass
                    attachArray="passes"
                    args={[AdditiveBlendingShader]}
                    uniforms-tAdd-value={occlusionRenderTarget.texture}
                />
                <shaderPass
                    attachArray="passes"
                    args={[FXAAShader]}
                    uniforms-resolution-value={[
                        1 / size.width,
                        1 / size.height,
                    ]}
                    renderToScreen
                />
            </effectComposer>
        </>
    )
}

const App = () => {
    return (
        <Canvas
            shadowMap
            style={{ background: "#171717" }}
            camera={{ position: [0, 4, 14], fov: 50 }}
            gl={{ antialias: false }}
            onCreated={({ gl }) => {
                gl.toneMapping = THREE.Uncharted2ToneMapping
                gl.outputEncoding = THREE.sRGBEncoding
            }}
        >
            <ambientLight intensity={0.5} />
            <pointLight position={[0, 60, -100]} intensity={20} />
            <pointLight position={[-50, 0, -50]} intensity={2} />
            <spotLight
                castShadow
                intensity={8}
                angle={Math.PI / 10}
                position={[10, 10, 10]}
                shadow-mapSize-width={2048}
                shadow-mapSize-height={2048}
            />
            <mesh position={[0, 4.5, -10]}>
                <sphereBufferGeometry attach="geometry" args={[4.9, 32, 32]} />
                <meshBasicMaterial
                    attach="material"
                    transparent
                    opacity={0.5}
                    color={new THREE.Color("#b35f5f")}
                />
            </mesh>
            <Suspense fallback={null}>
                <Leracoon />
                <Leracoon layer={OCCLUSION_LAYER} />
            </Suspense>
            <Effects />
        </Canvas>
    )
}
export default App
