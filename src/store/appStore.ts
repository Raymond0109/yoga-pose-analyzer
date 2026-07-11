import { create } from 'zustand'
import type { InputSourceType } from '@/types/common'
import type { PoseResult, ComparisonResult, CorrectionAdvice } from '@/types/pose'

interface AppState {
  // 输入源
  inputType: InputSourceType
  setInputType: (type: InputSourceType) => void

  // 姿态数据
  currentPose: PoseResult | null
  setCurrentPose: (pose: PoseResult | null) => void

  // 对比结果
  comparisonResult: ComparisonResult | null
  setComparisonResult: (result: ComparisonResult | null) => void

  // 矫正建议
  corrections: CorrectionAdvice[]
  setCorrections: (corrections: CorrectionAdvice[]) => void

  // 选择的体式
  selectedPose: string
  setSelectedPose: (pose: string) => void

  // UI 状态
  showSkeleton: boolean
  isPlaying: boolean
  toggleSkeleton: () => void
  setIsPlaying: (playing: boolean) => void
}

export const useAppStore = create<AppState>((set) => ({
  inputType: 'camera',
  setInputType: (type) => set({ inputType: type }),

  currentPose: null,
  setCurrentPose: (pose) => set({ currentPose: pose }),

  comparisonResult: null,
  setComparisonResult: (result) => set({ comparisonResult: result }),

  corrections: [],
  setCorrections: (corrections) => set({ corrections }),

  selectedPose: 'tadasana',
  setSelectedPose: (pose) => set({ selectedPose: pose }),

  showSkeleton: true,
  isPlaying: true,
  toggleSkeleton: () => set((s) => ({ showSkeleton: !s.showSkeleton })),
  setIsPlaying: (playing) => set({ isPlaying: playing }),
}))
