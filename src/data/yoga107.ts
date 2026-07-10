/**
 * Yoga-107 数据集集成
 * 来源: https://github.com/dhirensr/yoga-poses-dataset
 *
 * 数据集包含107个体式，每个体式有:
 * - 英文名称
 * - 梵文名称
 * - 分类标签
 * - 难度等级
 */

// Yoga-107 体式元数据
export interface Yoga107Pose {
  id: number
  englishName: string
  sanskritName: string
  categories: string[]
  difficulty: number // 1-3
}

// 从Yoga-107数据集提取的体式列表
export const YOGA_107_POSES: Yoga107Pose[] = [
  { id: 0, englishName: "Bharadvaja's Twist", sanskritName: "Bharadvajasana I", categories: ["Hip Opening", "Seated", "Twist"], difficulty: 1 },
  { id: 1, englishName: "Big Toe Pose", sanskritName: "Padangusthasana", categories: ["Forward Bend", "Standing"], difficulty: 1 },
  { id: 2, englishName: "Boat Pose", sanskritName: "Paripurna Navasana", categories: ["Core", "Seated", "Strengthening"], difficulty: 2 },
  { id: 3, englishName: "Bound Angle Pose", sanskritName: "Baddha Konasana", categories: ["Forward Bend", "Hip Opening", "Seated"], difficulty: 1 },
  { id: 4, englishName: "Bow Pose", sanskritName: "Dhanurasana", categories: ["Chest Opening", "Backbends"], difficulty: 2 },
  { id: 5, englishName: "Bridge Pose", sanskritName: "Setu Bandha Sarvangasana", categories: ["Backbends"], difficulty: 2 },
  { id: 6, englishName: "Camel Pose", sanskritName: "Ustrasana", categories: ["Chest Opening", "Backbends"], difficulty: 2 },
  { id: 7, englishName: "Cat Pose", sanskritName: "Marjaryasana", categories: ["Core"], difficulty: 1 },
  { id: 8, englishName: "Cat Cow Pose", sanskritName: "Chakravakasana", categories: ["Backbends"], difficulty: 1 },
  { id: 9, englishName: "Knees, Chest and Chin Pose", sanskritName: "Ashtanga Namaskara", categories: ["Core"], difficulty: 1 },
  { id: 10, englishName: "Chair Pose", sanskritName: "Utkatasana", categories: ["Core", "Standing", "Strengthening"], difficulty: 2 },
  { id: 11, englishName: "Child's Pose", sanskritName: "Balasana", categories: ["Forward Bend", "Hip Opening", "Restorative"], difficulty: 1 },
  { id: 12, englishName: "Cobra Pose", sanskritName: "Bhujangasana", categories: ["Chest Opening", "Backbends"], difficulty: 1 },
  { id: 13, englishName: "Corpse Pose", sanskritName: "Savasana", categories: ["Restorative"], difficulty: 1 },
  { id: 14, englishName: "Cow Face Pose", sanskritName: "Gomukhasana", categories: ["Hip Opening", "Seated"], difficulty: 2 },
  { id: 15, englishName: "Cow Pose", sanskritName: "Bitilasana", categories: ["Chest Opening", "Backbends"], difficulty: 1 },
  { id: 16, englishName: "Crane (Crow) Pose", sanskritName: "Bakasana", categories: ["Arm Balance", "Core"], difficulty: 3 },
  { id: 17, englishName: "Dolphin Plank Pose", sanskritName: "Makara Adho Mukha Svanasana", categories: ["Arm Balance", "Core", "Strengthening"], difficulty: 2 },
  { id: 18, englishName: "Dolphin Pose", sanskritName: "Ardha Pincha Mayurasana", categories: ["Core", "Standing", "Strengthening"], difficulty: 2 },
  { id: 19, englishName: "Downward-Facing Dog", sanskritName: "Adho Mukha Svanasana", categories: ["Forward Bend", "Standing", "Strengthening"], difficulty: 2 },
  { id: 20, englishName: "Eagle Pose", sanskritName: "Garudasana", categories: ["Balancing", "Hip Opening", "Standing"], difficulty: 2 },
  { id: 21, englishName: "Easy Pose", sanskritName: "Sukhasana", categories: ["Hip Opening", "Seated"], difficulty: 1 },
  { id: 22, englishName: "Eight-Angle Pose", sanskritName: "Astavakrasana", categories: ["Arm Balance"], difficulty: 3 },
  { id: 23, englishName: "Extended Hand-To-Big-Toe Pose", sanskritName: "Utthita Hasta Padangustasana", categories: ["Balancing", "Hip Opening", "Standing"], difficulty: 3 },
  { id: 24, englishName: "Extended Puppy Pose", sanskritName: "Uttana Shishosana", categories: ["Forward Bend"], difficulty: 2 },
  { id: 25, englishName: "Extended Side Angle Pose", sanskritName: "Utthita Parsvakonasana", categories: ["Standing", "Strengthening"], difficulty: 2 },
  { id: 26, englishName: "Extended Triangle Pose", sanskritName: "Utthita Trikonasana", categories: ["Standing", "Strengthening"], difficulty: 1 },
  { id: 27, englishName: "Feathered Peacock Pose", sanskritName: "Pincha Mayurasana", categories: ["Inversion", "Strengthening"], difficulty: 3 },
  { id: 28, englishName: "Fire Log Pose", sanskritName: "Agnistambhasana", categories: ["Hip Opening", "Seated"], difficulty: 1 },
  { id: 29, englishName: "Firefly Pose", sanskritName: "Tittibhasana", categories: ["Arm Balance"], difficulty: 3 },
  { id: 30, englishName: "Fish Pose", sanskritName: "Matsyasana", categories: ["Chest Opening", "Backbends"], difficulty: 2 },
  { id: 31, englishName: "Four-Limbed Staff Pose", sanskritName: "Chaturanga Dandasana", categories: ["Arm Balance", "Core", "Strengthening"], difficulty: 2 },
  { id: 32, englishName: "Garland Pose", sanskritName: "Malasana", categories: ["Standing"], difficulty: 1 },
  { id: 33, englishName: "Gate Pose", sanskritName: "Parighasana", categories: ["Standing"], difficulty: 1 },
  { id: 34, englishName: "Half Frog Pose", sanskritName: "Ardha Bhekasana", categories: ["Chest Opening", "Backbends"], difficulty: 2 },
  { id: 35, englishName: "Half Lord of the Fishes Pose", sanskritName: "Ardha Matsyendrasana", categories: ["Hip Opening", "Seated", "Twist"], difficulty: 1 },
  { id: 36, englishName: "Lying Half Lord of the Fishes Pose", sanskritName: "Supta Matsyendrasana", categories: ["Hip Opening", "Restorative", "Twist"], difficulty: 1 },
  { id: 37, englishName: "Half Moon Pose", sanskritName: "Ardha Chandrasana", categories: ["Balancing", "Standing"], difficulty: 2 },
  { id: 38, englishName: "Handstand", sanskritName: "Adho Mukha Vriksasana", categories: ["Balancing", "Inversion", "Strengthening"], difficulty: 3 },
  { id: 39, englishName: "Happy Baby Pose", sanskritName: "Ananda Balasana", categories: ["Core"], difficulty: 1 },
  { id: 40, englishName: "Head-to-Knee Forward Bend", sanskritName: "Janu Sirsasana", categories: ["Forward Bend", "Seated"], difficulty: 1 },
  { id: 41, englishName: "Hero Pose", sanskritName: "Virasana", categories: ["Seated"], difficulty: 2 },
  { id: 42, englishName: "Heron Pose", sanskritName: "Krounchasana", categories: ["Seated"], difficulty: 1 },
  { id: 43, englishName: "High Lunge", sanskritName: "Utthita Ashwa Sanchalanasana", categories: ["Standing"], difficulty: 1 },
  { id: 44, englishName: "Intense Side Stretch Pose", sanskritName: "Parsvottanasana", categories: ["Forward Bend", "Standing"], difficulty: 2 },
  { id: 45, englishName: "Legs-Up-the-Wall Pose", sanskritName: "Viparita Karani", categories: ["Restorative"], difficulty: 1 },
  { id: 46, englishName: "Locust Pose", sanskritName: "Salabhasana", categories: ["Chest Opening", "Strengthening", "Backbends"], difficulty: 2 },
  { id: 47, englishName: "Lord of the Dance Pose", sanskritName: "Natarajasana", categories: ["Balancing", "Chest Opening", "Standing", "Backbends"], difficulty: 3 },
  { id: 48, englishName: "Lotus Pose", sanskritName: "Padmasana", categories: ["Seated"], difficulty: 2 },
  { id: 49, englishName: "Low Lunge", sanskritName: "Anjaneyasana", categories: ["Standing"], difficulty: 2 },
  { id: 50, englishName: "Marichi's Pose", sanskritName: "Marichyasana III", categories: ["Hip Opening", "Seated", "Twist"], difficulty: 2 },
  { id: 51, englishName: "Monkey Pose", sanskritName: "Hanumanasana", categories: ["Seated"], difficulty: 3 },
  { id: 52, englishName: "Mountain Pose", sanskritName: "Tadasana", categories: ["Standing"], difficulty: 1 },
  { id: 53, englishName: "Noose Pose", sanskritName: "Pasasana", categories: ["Binding", "Hip Opening", "Strengthening", "Twist"], difficulty: 3 },
  { id: 54, englishName: "One-Legged King Pigeon Pose", sanskritName: "Eka Pada Rajakapotasana", categories: ["Hip Opening", "Backbends"], difficulty: 3 },
  { id: 55, englishName: "One-Legged King Pigeon Pose II", sanskritName: "Eka Pada Rajakapotasana II", categories: ["Backbends"], difficulty: 3 },
  { id: 56, englishName: "Peacock Pose", sanskritName: "Mayurasana", categories: ["Arm Balance"], difficulty: 1 },
  { id: 57, englishName: "Pigeon Pose", sanskritName: "Kapotasana", categories: ["Backbends"], difficulty: 3 },
  { id: 58, englishName: "Plank Pose", sanskritName: "Phalakasana", categories: ["Arm Balance", "Core", "Strengthening"], difficulty: 1 },
  { id: 59, englishName: "Plow Pose", sanskritName: "Halasana", categories: ["Inversion"], difficulty: 3 },
  { id: 60, englishName: "Pose Dedicated to the Sage Koundinya I", sanskritName: "Eka Pada Koundinyanasana I", categories: ["Arm Balance", "Twist"], difficulty: 3 },
  { id: 61, englishName: "Pose Dedicated to the Sage Koundinya II", sanskritName: "Eka Pada Koundinyanasana II", categories: ["Arm Balance"], difficulty: 3 },
  { id: 62, englishName: "Pose Dedicated to the Sage Marichi I", sanskritName: "Marichyasana I", categories: ["Binding", "Forward Bend", "Hip Opening", "Seated"], difficulty: 2 },
  { id: 63, englishName: "Reclining Bound Angle Pose", sanskritName: "Supta Baddha Konasana", categories: ["Hip Opening", "Restorative"], difficulty: 1 },
  { id: 64, englishName: "Reclining Hand-to-Big-Toe Pose", sanskritName: "Supta Padangusthasana", categories: ["Restorative"], difficulty: 2 },
  { id: 65, englishName: "Reclining Hero Pose", sanskritName: "Supta Virasana", categories: ["Restorative"], difficulty: 2 },
  { id: 66, englishName: "Revolved Head-to-Knee Pose", sanskritName: "Parivrtta Janu Sirsasana", categories: ["Seated", "Twist"], difficulty: 1 },
  { id: 67, englishName: "Revolved Side Angle Pose", sanskritName: "Parivrtta Parsvakonasana", categories: ["Standing", "Strengthening", "Twist"], difficulty: 2 },
  { id: 68, englishName: "Revolved Triangle Pose", sanskritName: "Parivrtta Trikonasana", categories: ["Standing", "Strengthening", "Twist"], difficulty: 2 },
  { id: 69, englishName: "Scale Pose", sanskritName: "Tolasana", categories: ["Arm Balance", "Core"], difficulty: 2 },
  { id: 70, englishName: "Seated Forward Bend", sanskritName: "Paschimottanasana", categories: ["Forward Bend", "Seated"], difficulty: 1 },
  { id: 71, englishName: "Bhujapidasana", sanskritName: "Bhujapidasana", categories: ["Arm Balance", "Core"], difficulty: 3 },
  { id: 72, englishName: "Side Crane (Crow) Pose", sanskritName: "Parsva Bakasana", categories: ["Arm Balance"], difficulty: 3 },
  { id: 73, englishName: "Side Plank Pose", sanskritName: "Vasisthasana", categories: ["Arm Balance", "Balancing", "Core"], difficulty: 3 },
  { id: 74, englishName: "Side-Reclining Leg Lift", sanskritName: "Anantasana", categories: ["Balancing", "Core"], difficulty: 1 },
  { id: 75, englishName: "Sphinx Pose", sanskritName: "Salamba Bhujangasana", categories: ["Chest Opening", "Backbends"], difficulty: 1 },
  { id: 76, englishName: "Staff Pose", sanskritName: "Dandasana", categories: ["Seated"], difficulty: 1 },
  { id: 77, englishName: "Standing Forward Bend", sanskritName: "Uttanasana", categories: ["Forward Bend"], difficulty: 2 },
  { id: 78, englishName: "Standing Half Forward Bend", sanskritName: "Ardha Uttanasana", categories: ["Forward Bend", "Standing"], difficulty: 1 },
  { id: 79, englishName: "Standing Split", sanskritName: "Urdhva Prasarita Eka Padasana", categories: ["Forward Bend", "Standing"], difficulty: 2 },
  { id: 80, englishName: "Supported Headstand", sanskritName: "Salamba Sirsasana", categories: ["Balancing", "Inversion"], difficulty: 3 },
  { id: 81, englishName: "Supported Shoulderstand", sanskritName: "Salamba Sarvangasana", categories: ["Balancing", "Inversion"], difficulty: 3 },
  { id: 82, englishName: "Tree Pose", sanskritName: "Vriksasana", categories: ["Balancing", "Standing"], difficulty: 2 },
  { id: 83, englishName: "Upward Bow (Wheel) Pose", sanskritName: "Urdhva Dhanurasana", categories: ["Chest Opening", "Strengthening", "Backbends"], difficulty: 3 },
  { id: 84, englishName: "Upward Facing Two-Foot Staff Pose", sanskritName: "Dwi Pada Viparita Dandasana", categories: ["Chest Opening", "Backbends"], difficulty: 3 },
  { id: 85, englishName: "Upward Plank Pose", sanskritName: "Purvottanasana", categories: ["Strengthening"], difficulty: 2 },
  { id: 86, englishName: "Upward Salute", sanskritName: "Urdhva Hastasana", categories: ["Standing"], difficulty: 1 },
  { id: 87, englishName: "Upward-Facing Dog Pose", sanskritName: "Urdhva Mukha Svanasana", categories: ["Chest Opening", "Backbends"], difficulty: 2 },
  { id: 88, englishName: "Warrior I Pose", sanskritName: "Virabhadrasana I", categories: ["Standing", "Strengthening"], difficulty: 2 },
  { id: 89, englishName: "Warrior II Pose", sanskritName: "Virabhadrasana II", categories: ["Standing", "Strengthening"], difficulty: 2 },
  { id: 90, englishName: "Warrior III Pose", sanskritName: "Virabhadrasana III", categories: ["Balancing", "Standing", "Strengthening"], difficulty: 3 },
  { id: 91, englishName: "Wide-Angle Seated Forward Bend", sanskritName: "Upavistha Konasana", categories: ["Forward Bend", "Hip Opening", "Seated"], difficulty: 3 },
  { id: 92, englishName: "Wide-Legged Forward Bend", sanskritName: "Prasarita Padottanasana", categories: ["Forward Bend", "Hip Opening", "Standing", "Strengthening"], difficulty: 1 },
  { id: 93, englishName: "Wild Thing", sanskritName: "Camatkarasana", categories: ["Arm Balance", "Chest Opening"], difficulty: 2 },
  { id: 94, englishName: "Yogic Sleep", sanskritName: "Yoganidrasana", categories: ["Forward Bend", "Seated"], difficulty: 3 },
  { id: 95, englishName: "Scorpion Pose", sanskritName: "Vrischikasana", categories: ["Backbends", "Inversion"], difficulty: 3 },
  { id: 96, englishName: "Thunderbolt Pose", sanskritName: "Vajrasana", categories: ["Kneeling", "Seated"], difficulty: 1 },
  { id: 97, englishName: "Balance Pose", sanskritName: "Tulasana", categories: ["Arm Balance"], difficulty: 2 },
  { id: 98, englishName: "Lion Pose", sanskritName: "Simhasana", categories: ["Seated"], difficulty: 1 },
  { id: 99, englishName: "Crocodile Pose", sanskritName: "Makarasana", categories: ["Restorative"], difficulty: 1 },
  { id: 100, englishName: "Pendant Pose", sanskritName: "Lolasana", categories: ["Arm Balance", "Core"], difficulty: 3 },
  { id: 101, englishName: "Tortoise Pose", sanskritName: "Kurmasana", categories: ["Forward Bend", "Seated"], difficulty: 3 },
  { id: 102, englishName: "Embryo in Womb Pose", sanskritName: "Garbha Pindasana", categories: ["Seated"], difficulty: 3 },
  { id: 103, englishName: "Durvasasana", sanskritName: "Durvasasana", categories: ["Standing", "Balancing"], difficulty: 3 },
  { id: 104, englishName: "Frog Pose", sanskritName: "Bhekasana", categories: ["Chest Opening", "Backbends"], difficulty: 2 },
  { id: 105, englishName: "Formidable Pose", sanskritName: "Bhairavasana", categories: ["Hip Opening"], difficulty: 2 },
  { id: 106, englishName: "Formidable Face/Chin Stand Pose", sanskritName: "Ganda Bherundasana", categories: ["Inversion", "Backbends", "Strengthening"], difficulty: 3 },
]

/**
 * 从Yoga-107数据集获取体式信息
 */
export function getYoga107Pose(id: number): Yoga107Pose | undefined {
  return YOGA_107_POSES.find(p => p.id === id)
}

/**
 * 根据梵文名称查找Yoga-107体式
 */
export function findYoga107BySanskrit(sanskritName: string): Yoga107Pose | undefined {
  return YOGA_107_POSES.find(p => 
    p.sanskritName.toLowerCase() === sanskritName.toLowerCase()
  )
}

/**
 * 根据英文名称查找Yoga-107体式
 */
export function findYoga107ByEnglish(englishName: string): Yoga107Pose | undefined {
  return YOGA_107_POSES.find(p => 
    p.englishName.toLowerCase() === englishName.toLowerCase()
  )
}

/**
 * 获取指定难度的体式列表
 */
export function getYoga107PosesByDifficulty(difficulty: number): Yoga107Pose[] {
  return YOGA_107_POSES.filter(p => p.difficulty === difficulty)
}

/**
 * 获取指定分类的体式列表
 */
export function getYoga107PosesByCategory(category: string): Yoga107Pose[] {
  return YOGA_107_POSES.filter(p => 
    p.categories.some(c => c.toLowerCase() === category.toLowerCase())
  )
}

/**
 * 将Yoga-107难度映射到我们的难度系统
 * Yoga-107: 1=初级, 2=中级, 3=高级
 * 我们: 'beginner', 'intermediate', 'advanced'
 */
export function mapDifficulty(yoga107Difficulty: number): 'beginner' | 'intermediate' | 'advanced' {
  switch (yoga107Difficulty) {
    case 1: return 'beginner'
    case 2: return 'intermediate'
    case 3: return 'advanced'
    default: return 'beginner'
  }
}

/**
 * 获取所有Yoga-107体式的统计信息
 */
export function getYoga107Stats() {
  const total = YOGA_107_POSES.length
  const byDifficulty = {
    beginner: YOGA_107_POSES.filter(p => p.difficulty === 1).length,
    intermediate: YOGA_107_POSES.filter(p => p.difficulty === 2).length,
    advanced: YOGA_107_POSES.filter(p => p.difficulty === 3).length,
  }
  
  const categories = new Map<string, number>()
  YOGA_107_POSES.forEach(p => {
    p.categories.forEach(c => {
      categories.set(c, (categories.get(c) || 0) + 1)
    })
  })
  
  return { total, byDifficulty, categories }
}
