# Mixamo 模型集成指南

## 下载 Mixamo 模型

### 步骤 1: 访问 Mixamo
1. 打开 https://www.mixamo.com
2. 使用 Adobe 账号登录（免费注册）

### 步骤 2: 选择角色
推荐选择以下角色之一：
- **Y Bot** - 标准男性角色
- **X Bot** - 标准女性角色

### 步骤 3: 下载模型
1. 点击角色页面的 "Download" 按钮
2. 设置下载选项：
   - **Format**: FBX (for Unity)
   - **Pose**: T-Pose（重要！）
   - **Skin**: With Skin
3. 点击 "Download" 下载

### 步骤 4: 放置模型文件
将下载的 `.fbx` 文件放到以下目录：
```
assets/models/mixamo/
```

## 自动集成

运行设置脚本自动复制模型到 public 目录：
```bash
node scripts/setup-mixamo.js
```

## 手动集成

如果自动脚本不工作，手动复制模型文件：
```bash
cp assets/models/mixamo/*.fbx public/assets/models/mixamo/
```

## 启动应用

```bash
npm run dev
```

应用会自动检测并加载 Mixamo 模型。如果没有找到 Mixamo 模型，会回退到测试模型。

## 在应用中加载模型

应用启动后，也可以通过点击 "🧍 加载模型" 按钮手动选择 Mixamo 模型文件。

## 支持的格式

- `.fbx` - Mixamo 默认格式（推荐）
- `.glb` - GLTF 二进制格式
- `.gltf` - GLTF 文本格式

## 骨骼映射

Mixamo 模型使用标准骨骼命名：
- `mixamorigHips` - 骨盆
- `mixamorigSpine` - 脊柱
- `mixamorigLeftArm` - 左臂
- `mixamorigRightArm` - 右臂
- `mixamorigLeftUpLeg` - 左大腿
- `mixamorigRightUpLeg` - 右大腿
- 等等...

## 肌肉热力图

加载 Mixamo 模型后，可以启用肌肉热力图显示：
1. 点击 "显示肌肉" 按钮
2. 模型会根据关节角度显示肌肉张力

## 故障排除

### 模型加载失败
- 确保模型文件是 T-Pose 姿势
- 确保选择了 "With Skin" 选项
- 检查文件格式是否正确

### 模型显示异常
- 尝试重新下载模型
- 确保使用的是 Mixamo 标准角色

### 性能问题
- FBX 文件可能较大，首次加载可能需要几秒
- 考虑使用 GLB 格式以获得更好的性能

## 技术细节

模型加载流程：
1. 使用 Three.js FBXLoader/GLTFLoader 加载模型
2. 提取骨骼和蒙皮网格
3. 标准化模型大小和位置
4. 创建骨骼控制器用于姿态更新

骨骼控制器会根据 MediaPipe 检测的关键点自动更新模型姿态。
