/**
 * 我们的体式数据库与Yoga-107数据集的映射关系
 */

import { YOGA_107_POSES } from './yoga107'

// 我们的体式ID到Yoga-107梵文名称的映射
export const OUR_TO_YOGA107_MAP: Record<string, string> = {
  'tadasana': 'Tadasana',
  'vrksasana': 'Vriksasana',
  'adho_mukha_svanasana': 'Adho Mukha Svanasana',
  'utkatasana': 'Utkatasana',
  'balasana': 'Balasana',
  'bhujangasana': 'Bhujangasana',
  'setu_bandhasana': 'Setu Bandha Sarvangasana',
  'ustrasana': 'Ustrasana',
  'baddha_konasana': 'Baddha Konasana',
  'savasana': 'Savasana',
  'virabhadrasana_i': 'Virabhadrasana I',
  'virabhadrasana_ii': 'Virabhadrasana II',
  'trikonasana': 'Utthita Trikonasana',
  'utthita_parsvakonasana': 'Utthita Parsvakonasana',
  'plank': 'Phalakasana',
  'ardha_matsyendrasana': 'Ardha Matsyendrasana',
  'kapotasana': 'Kapotasana',
  'sarvangasana': 'Salamba Sarvangasana',
  'virabhadrasana_iii': 'Virabhadrasana III',
  'natarajasana': 'Natarajasana',
  'chaturanga': 'Chaturanga Dandasana',
  'navasana': 'Paripurna Navasana',
  'bakasana': 'Bakasana',
  'sirsasana': 'Salamba Sirsasana',
}

// Yoga-107梵文名称到我们体式ID的映射
export const YOGA107_TO_OUR_MAP: Record<string, string> = Object.fromEntries(
  Object.entries(OUR_TO_YOGA107_MAP).map(([ourId, sanskrit]) => [sanskrit, ourId])
)

/**
 * 检查我们的体式是否在Yoga-107数据集中
 */
export function isPoseInYoga107(ourPoseId: string): boolean {
  return ourPoseId in OUR_TO_YOGA107_MAP
}

/**
 * 获取我们的体式对应的Yoga-107信息
 */
export function getYoga107InfoForOurPose(ourPoseId: string) {
  const sanskritName = OUR_TO_YOGA107_MAP[ourPoseId]
  if (!sanskritName) return null
  
  return YOGA_107_POSES.find(p => p.sanskritName === sanskritName) || null
}

/**
 * 获取Yoga-107中我们还没有的体式
 */
export function getMissingPosesFromYoga107(): Array<{ id: number; englishName: string; sanskritName: string; difficulty: number }> {
  const ourSanskritNames = new Set(Object.values(OUR_TO_YOGA107_MAP))
  
  return YOGA_107_POSES
    .filter(p => !ourSanskritNames.has(p.sanskritName))
    .map(p => ({
      id: p.id,
      englishName: p.englishName,
      sanskritName: p.sanskritName,
      difficulty: p.difficulty,
    }))
}

/**
 * 获取映射统计信息
 */
export function getMappingStats() {
  const totalOurs = Object.keys(OUR_TO_YOGA107_MAP).length
  const totalYoga107 = YOGA_107_POSES.length
  const missing = getMissingPosesFromYoga107()
  
  return {
    ourPoses: totalOurs,
    yoga107Poses: totalYoga107,
    mapped: totalOurs,
    missing: missing.length,
    missingPoses: missing,
  }
}
