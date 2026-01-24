"use client"

import React from "react"
import { SceneType, SceneProps } from "./mascots/types"
import { MascotCookingScene } from "./mascots/cooking"
import { MascotPlayingScene } from "./mascots/playing"
import { MascotReadingScene } from "./mascots/reading"
import { MascotSearchingScene } from "./mascots/searching"
import { MascotErrorScene } from "./mascots/error"

// Re-export types
export type { MascotProps } from "./mascots/types"
export type { SceneType, SceneProps } from "./mascots/types"

// Re-export mascots
export * from "./mascots/dog"
export * from "./mascots/bear"
export * from "./mascots/giraffe"
export * from "./mascots/common"

// Re-export scenes
export * from "./mascots/cooking"
export * from "./mascots/celebration"
export * from "./mascots/playing"
export * from "./mascots/reading"
export * from "./mascots/searching"
export * from "./mascots/error"

export const SCENE_COMPONENTS: Record<SceneType, React.ComponentType<SceneProps>> = {
    cooking: MascotCookingScene,
    playing: MascotPlayingScene,
    reading: MascotReadingScene,
    searching: MascotSearchingScene,
    error: MascotErrorScene,
}
