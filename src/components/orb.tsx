'use client'

import React, { useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Sphere, MeshDistortMaterial, Float, Environment } from '@react-three/drei'
import * as THREE from 'three'

function AnimatedSphere() {
    const sphereRef = useRef<THREE.Mesh>(null)

    useFrame((state) => {
        if (sphereRef.current) {
            sphereRef.current.rotation.y = state.clock.getElapsedTime() * 0.2
            sphereRef.current.rotation.x = state.clock.getElapsedTime() * 0.1
        }
    })

    return (
        <Float speed={1.5} rotationIntensity={1} floatIntensity={2}>
            <Sphere ref={sphereRef} args={[1, 64, 64]} scale={2.2}>
                <MeshDistortMaterial
                    color="#000000"
                    attach="material"
                    distort={0.3}
                    speed={1.5}
                    roughness={0.1}
                    metalness={0.9}
                />
            </Sphere>
        </Float>
    )
}

export default function Orb({ className }: { className?: string }) {
    return (
        <div className={className}>
            <Canvas className="w-full h-full" camera={{ position: [0, 0, 8], fov: 45 }}>
                <ambientLight intensity={0.5} />
                <pointLight position={[10, 10, 10]} intensity={1.5} color="#4f46e5" />
                <pointLight position={[-10, -10, -10]} intensity={1} color="#ec4899" />
                <AnimatedSphere />
                <Environment preset="city" />
            </Canvas>
        </div>
    )
}
