import { create } from 'zustand'
import type { InputSourceType } from '@/types/common'
import type { PoseResult, ComparisonResult, CorrectionAdvice } from '@/types/pose'
import type { SMPLParams } from '@/types/smpl'

interface AppState {
  // 输入源
  inputType: InputSourceType
  setInputType: (type: InputSourceType) => void

  // 姿态数据
  currentPose: PoseResult | null
  setCurrentPose: (pose: PoseResult | null) => void

  // SMPL 参数
  smplParams: SMPLParams | null
  setSmplParams: (params: SMPLParams | null) => void

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
  showMuscles: boolean
  isPlaying: boolean
  toggleSkeleton: () => void
  toggleMuscles: () => void
  setIsPlaying: (playing: boolean) => void
}

export const useAppStore = create<AppState>((set) => ({
  inputType: 'camera',
  setInputType: (type) => set({ inputType: type }),

  currentPose: null,
  setCurrentPose: (pose) => set({ currentPose: pose }),

  smplParams: null,
  setSmplParams: (params) => set({ smplParams: params }),

  comparisonResult: null,
  setComparisonResult: (result) => set({ comparisonResult: result }),

  corrections: [],
  setCorrections: (corrections) => set({ corrections }),

  selectedPose: 'tadasana',
  setSelectedPose: (pose) => set({ selectedPose: pose }),

  showSkeleton: true,
  showMuscles: false,
  isPlaying: true,
  toggleSkeleton: () => set((s) => ({ showSkeleton: !s.showSkeleton })),
  toggleMuscles: () => set((s) => ({ showMuscles: !s.showMuscles })),
  setIsPlaying: (playing) => set({ isPlaying: playing }),
}))
