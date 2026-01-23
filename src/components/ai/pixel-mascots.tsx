"use client"

import React from "react"
import { SceneType, SceneProps } from "./types"
import { MascotCookingScene } from "./cooking"
import { MascotPlayingScene } from "./playing"
import { MascotReadingScene } from "./reading"
import { MascotSearchingScene } from "./searching"
import { MascotErrorScene } from "./error"

// Re-export types
export type { MascotProps } from "./types"
export type { SceneType, SceneProps } from "./types"

// Re-export mascots
export * from "./dog"
export * from "./bear"
export * from "./giraffe"
export * from "./common"

// Re-export scenes
export * from "./cooking"
export * from "./celebration"
export * from "./playing"
export * from "./reading"
export * from "./searching"
export * from "./error"

export const SCENE_COMPONENTS: Record<SceneType, React.ComponentType<SceneProps>> = {
    cooking: MascotCookingScene,
    playing: MascotPlayingScene,
    reading: MascotReadingScene,
    searching: MascotSearchingScene,
    error: MascotErrorScene,
}
