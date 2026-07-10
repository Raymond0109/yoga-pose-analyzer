#!/usr/bin/env python3
"""
生成简化的SMPL测试模型

这个脚本生成一个简化的人体模型，用于测试3D渲染流程。
不需要下载完整的SMPL模型。

运行:
python scripts/generate_test_model.py --output assets/models/smpl/
"""

import json
import math
import os
import argparse

def generate_sphere_vertices(radius: float, segments: int) -> list:
    """生成球体顶点"""
    vertices = []
    for i in range(segments + 1):
        lat = math.pi * i / segments
        for j in range(segments):
            lon = 2 * math.pi * j / segments
            x = radius * math.sin(lat) * math.cos(lon)
            y = radius * math.cos(lat)
            z = radius * math.sin(lat) * math.sin(lon)
            vertices.append([x, y, z])
    return vertices

def generate_cylinder_vertices(radius: float, height: float, segments: int) -> list:
    """生成圆柱体顶点"""
    vertices = []
    for i in range(segments):
        angle = 2 * math.pi * i / segments
        x = radius * math.cos(angle)
        z = radius * math.sin(angle)
        vertices.append([x, 0, z])
        vertices.append([x, height, z])
    return vertices

def generate_simple_human_model():
    """生成简化的人体模型"""
    
    # 人体比例参数 (肩宽=1.0为单位)
    shoulder_width = 1.0
    head_radius = 0.12
    torso_height = 0.5
    upper_arm_length = 0.35
    lower_arm_length = 0.30
    upper_leg_length = 0.50
    lower_leg_length = 0.45
    
    # 生成各部位顶点
    segments = 16
    
    # 头部 (球体)
    head_center = [0, 1.5, 0]
    head_vertices = []
    for i in range(segments + 1):
        lat = math.pi * i / segments
        for j in range(segments):
            lon = 2 * math.pi * j / segments
            x = head_radius * math.sin(lat) * math.cos(lon) + head_center[0]
            y = head_radius * math.cos(lat) + head_center[1]
            z = head_radius * math.sin(lat) * math.sin(lon) + head_center[2]
            head_vertices.append([x, y, z])
    
    # 躯干 (长方体)
    torso_vertices = [
        [-shoulder_width/2, 1.3, -0.15],  # 左肩后
        [shoulder_width/2, 1.3, -0.15],   # 右肩后
        [shoulder_width/2, 1.3, 0.15],    # 右肩前
        [-shoulder_width/2, 1.3, 0.15],   # 左肩前
        [-0.1, 0.8, -0.15],               # 左髋后
        [0.1, 0.8, -0.15],                # 右髋后
        [0.1, 0.8, 0.15],                 # 右髋前
        [-0.1, 0.8, 0.15],                # 左髋前
    ]
    
    # 左上臂
    left_upper_arm_vertices = [
        [-shoulder_width/2, 1.3, -0.05],
        [-shoulder_width/2, 1.3, 0.05],
        [-shoulder_width/2 - 0.05, 1.3, 0],
        [-shoulder_width/2 - upper_arm_length, 1.0, -0.05],
        [-shoulder_width/2 - upper_arm_length, 1.0, 0.05],
        [-shoulder_width/2 - upper_arm_length - 0.05, 1.0, 0],
    ]
    
    # 右上臂
    right_upper_arm_vertices = [
        [shoulder_width/2, 1.3, -0.05],
        [shoulder_width/2, 1.3, 0.05],
        [shoulder_width/2 + 0.05, 1.3, 0],
        [shoulder_width/2 + upper_arm_length, 1.0, -0.05],
        [shoulder_width/2 + upper_arm_length, 1.0, 0.05],
        [shoulder_width/2 + upper_arm_length + 0.05, 1.0, 0],
    ]
    
    # 左前臂
    left_lower_arm_vertices = [
        [-shoulder_width/2 - upper_arm_length, 1.0, -0.04],
        [-shoulder_width/2 - upper_arm_length, 1.0, 0.04],
        [-shoulder_width/2 - upper_arm_length - 0.04, 1.0, 0],
        [-shoulder_width/2 - upper_arm_length - lower_arm_length, 0.7, -0.04],
        [-shoulder_width/2 - upper_arm_length - lower_arm_length, 0.7, 0.04],
        [-shoulder_width/2 - upper_arm_length - lower_arm_length - 0.04, 0.7, 0],
    ]
    
    # 右前臂
    right_lower_arm_vertices = [
        [shoulder_width/2 + upper_arm_length, 1.0, -0.04],
        [shoulder_width/2 + upper_arm_length, 1.0, 0.04],
        [shoulder_width/2 + upper_arm_length + 0.04, 1.0, 0],
        [shoulder_width/2 + upper_arm_length + lower_arm_length, 0.7, -0.04],
        [shoulder_width/2 + upper_arm_length + lower_arm_length, 0.7, 0.04],
        [shoulder_width/2 + upper_arm_length + lower_arm_length + 0.04, 0.7, 0],
    ]
    
    # 左大腿
    left_upper_leg_vertices = [
        [-0.1, 0.8, -0.08],
        [-0.1, 0.8, 0.08],
        [-0.15, 0.8, 0],
        [-0.1, 0.8 - upper_leg_length, -0.08],
        [-0.1, 0.8 - upper_leg_length, 0.08],
        [-0.15, 0.8 - upper_leg_length, 0],
    ]
    
    # 右大腿
    right_upper_leg_vertices = [
        [0.1, 0.8, -0.08],
        [0.1, 0.8, 0.08],
        [0.15, 0.8, 0],
        [0.1, 0.8 - upper_leg_length, -0.08],
        [0.1, 0.8 - upper_leg_length, 0.08],
        [0.15, 0.8 - upper_leg_length, 0],
    ]
    
    # 左小腿
    left_lower_leg_vertices = [
        [-0.1, 0.8 - upper_leg_length, -0.06],
        [-0.1, 0.8 - upper_leg_length, 0.06],
        [-0.12, 0.8 - upper_leg_length, 0],
        [-0.1, 0.3, -0.06],
        [-0.1, 0.3, 0.06],
        [-0.12, 0.3, 0],
    ]
    
    # 右小腿
    right_lower_leg_vertices = [
        [0.1, 0.8 - upper_leg_length, -0.06],
        [0.1, 0.8 - upper_leg_length, 0.06],
        [0.12, 0.8 - upper_leg_length, 0],
        [0.1, 0.3, -0.06],
        [0.1, 0.3, 0.06],
        [0.12, 0.3, 0],
    ]
    
    # 合并所有顶点
    all_vertices = []
    all_vertices.extend(head_vertices)
    all_vertices.extend(torso_vertices)
    all_vertices.extend(left_upper_arm_vertices)
    all_vertices.extend(right_upper_arm_vertices)
    all_vertices.extend(left_lower_arm_vertices)
    all_vertices.extend(right_lower_arm_vertices)
    all_vertices.extend(left_upper_leg_vertices)
    all_vertices.extend(right_upper_leg_vertices)
    all_vertices.extend(left_lower_leg_vertices)
    all_vertices.extend(right_lower_leg_vertices)
    
    # 生成面片 (简化版)
    faces = []
    vertex_offset = 0
    
    # 头部面片
    for i in range(segments):
        for j in range(segments):
            v1 = vertex_offset + i * segments + j
            v2 = vertex_offset + i * segments + (j + 1) % segments
            v3 = vertex_offset + (i + 1) * segments + (j + 1) % segments
            v4 = vertex_offset + (i + 1) * segments + j
            faces.append([v1, v2, v3])
            faces.append([v1, v3, v4])
    vertex_offset += len(head_vertices)
    
    # 其他部位的面片 (简化处理)
    # 躯干
    torso_faces = [
        [0, 1, 2], [0, 2, 3],  # 前
        [4, 6, 5], [4, 7, 6],  # 后
        [0, 4, 5], [0, 5, 1],  # 左
        [2, 6, 7], [2, 7, 3],  # 右
        [0, 3, 7], [0, 7, 4],  # 上
        [1, 5, 6], [1, 6, 2],  # 下
    ]
    for face in torso_faces:
        faces.append([f + vertex_offset for f in face])
    vertex_offset += len(torso_vertices)
    
    # 其他部位使用简单的三角形
    for part_vertices in [left_upper_arm_vertices, right_upper_arm_vertices,
                         left_lower_arm_vertices, right_lower_arm_vertices,
                         left_upper_leg_vertices, right_upper_leg_vertices,
                         left_lower_leg_vertices, right_lower_leg_vertices]:
        n = len(part_vertices)
        for i in range(0, n - 2, 3):
            faces.append([vertex_offset + i, vertex_offset + i + 1, vertex_offset + i + 2])
        vertex_offset += n
    
    # 关节位置 (24个SMPL关节)
    joints = [
        [0, 0.9, 0],      # 0: 骨盆
        [-0.1, 0.8, 0],   # 1: 左髋
        [0.1, 0.8, 0],    # 2: 右髋
        [0, 0.85, 0],     # 3: 脊柱
        [-0.1, 0.45, 0],  # 4: 左膝
        [0.1, 0.45, 0],   # 5: 右膝
        [0, 0.95, 0],     # 6: 脊柱2
        [-0.1, 0.05, 0],  # 7: 左踝
        [0.1, 0.05, 0],   # 8: 右踝
        [0, 1.05, 0],     # 9: 脊柱3
        [-0.15, 0, 0],    # 10: 左脚
        [0.15, 0, 0],     # 11: 右脚
        [0, 1.15, 0],     # 12: 颈部
        [-shoulder_width/2, 1.3, 0],  # 13: 左肩
        [shoulder_width/2, 1.3, 0],   # 14: 右肩
        [0, 1.5, 0],      # 15: 头
        [-shoulder_width/2 - upper_arm_length, 1.0, 0],  # 16: 左肘
        [shoulder_width/2 + upper_arm_length, 1.0, 0],   # 17: 右肘
        [-shoulder_width/2 - upper_arm_length - lower_arm_length, 0.7, 0],  # 18: 左腕
        [shoulder_width/2 + upper_arm_length + lower_arm_length, 0.7, 0],   # 19: 右腕
        [-shoulder_width/2 - upper_arm_length - lower_arm_length - 0.1, 0.65, 0],  # 20: 左手
        [shoulder_width/2 + upper_arm_length + lower_arm_length + 0.1, 0.65, 0],   # 21: 右手
        [-0.1, 0.8 - upper_leg_length, 0],  # 22: 左膝2
        [0.1, 0.8 - upper_leg_length, 0],   # 23: 右膝2
    ]
    
    # 骨骼层级 (父关节索引)
    kintree_table = [
        [-1, 0],  # 0: 骨盆 (根)
        [0, 1],   # 1: 左髋
        [0, 2],   # 2: 右髋
        [0, 3],   # 3: 脊柱
        [1, 4],   # 4: 左膝
        [2, 5],   # 5: 右膝
        [3, 6],   # 6: 脊柱2
        [4, 7],   # 7: 左踝
        [5, 8],   # 8: 右踝
        [6, 9],   # 9: 脊柱3
        [7, 10],  # 10: 左脚
        [8, 11],  # 11: 右脚
        [9, 12],  # 12: 颈部
        [12, 13], # 13: 左肩
        [12, 14], # 14: 右肩
        [12, 15], # 15: 头
        [13, 16], # 16: 左肘
        [14, 17], # 17: 右肘
        [16, 18], # 18: 左腕
        [17, 19], # 19: 右腕
        [18, 20], # 20: 左手
        [19, 21], # 21: 右手
        [4, 22],  # 22: 左膝2
        [5, 23],  # 23: 右膝2
    ]
    
    return {
        'vertices_template': all_vertices,
        'faces': faces,
        'joint_regressor': [[0.0] * len(all_vertices) for _ in range(24)],  # 简化
        'weights': [[1.0] + [0.0] * 23 for _ in range(len(all_vertices))],  # 简化
        'posedirs': [[[0.0, 0.0, 0.0]] * 72 for _ in range(len(all_vertices))],  # 简化
        'shapedirs': [[[0.0, 0.0, 0.0]] * 10 for _ in range(len(all_vertices))],  # 简化
        'kintree_table': kintree_table,
        'J': joints,
        'num_vertices': len(all_vertices),
        'num_joints': 24,
    }

def main():
    parser = argparse.ArgumentParser(description='生成简化SMPL测试模型')
    parser.add_argument('--output', '-o', default='assets/models/smpl', help='输出目录')
    
    args = parser.parse_args()
    
    print("正在生成简化人体模型...")
    model_data = generate_simple_human_model()
    
    # 创建输出目录
    os.makedirs(args.output, exist_ok=True)
    
    # 保存模型
    output_path = os.path.join(args.output, 'SMPL_TEST.json')
    with open(output_path, 'w') as f:
        json.dump(model_data, f)
    
    file_size = os.path.getsize(output_path) / 1024  # KB
    print(f"\n生成完成!")
    print(f"  输出文件: {output_path}")
    print(f"  文件大小: {file_size:.2f} KB")
    print(f"  顶点数量: {model_data['num_vertices']}")
    print(f"  面片数量: {len(model_data['faces'])}")
    print(f"  关节数量: {model_data['num_joints']}")

if __name__ == '__main__':
    main()
