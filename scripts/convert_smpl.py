#!/usr/bin/env python3
"""
SMPL模型下载和转换脚本

使用方法:
1. 访问 https://smpl.is.tue.mpg.de 注册账号
2. 下载SMPL模型文件 (Python版本)
3. 运行此脚本转换为JSON格式

依赖安装:
pip install numpy pickle5

运行:
python scripts/download_and_convert_smpl.py --input path/to/SMPL_MALE.pkl --output assets/models/smpl/
"""

import argparse
import json
import os
import sys

def convert_pkl_to_json(pkl_path: str, output_dir: str, gender: str = 'neutral'):
    """将SMPL pkl文件转换为JSON格式"""
    try:
        import pickle
        import numpy as np
    except ImportError:
        print("请安装依赖: pip install numpy")
        sys.exit(1)

    print(f"正在加载 {pkl_path}...")
    
    with open(pkl_path, 'rb') as f:
        data = pickle.load(f, encoding='latin1')
    
    print("正在转换数据...")
    
    # 提取关键矩阵
    output = {
        'vertices_template': np.array(data['v_template']).tolist(),
        'faces': np.array(data['f']).tolist(),
        'joint_regressor': np.array(data['J_regressor'].todense()).tolist(),
        'weights': np.array(data['weights']).tolist(),
        'posedirs': np.array(data['posedirs']).tolist(),
        'shapedirs': np.array(data['shapedirs']).tolist(),
        'kintree_table': np.array(data['kintree_table']).tolist(),
        'J': np.array(data['J']).tolist(),
        'num_vertices': 6890,
        'num_joints': 24,
    }
    
    # 创建输出目录
    os.makedirs(output_dir, exist_ok=True)
    
    # 保存JSON文件
    output_path = os.path.join(output_dir, f'SMPL_{gender.upper()}.json')
    print(f"正在保存到 {output_path}...")
    
    with open(output_path, 'w') as f:
        json.dump(output, f)
    
    # 打印统计信息
    file_size = os.path.getsize(output_path) / (1024 * 1024)  # MB
    print(f"\n转换完成!")
    print(f"  输出文件: {output_path}")
    print(f"  文件大小: {file_size:.2f} MB")
    print(f"  顶点数量: {output['num_vertices']}")
    print(f"  关节数量: {output['num_joints']}")
    print(f"  面片数量: {len(output['faces'])}")
    
    return output_path

def download_smpl_model():
    """打印下载说明"""
    print("""
=== SMPL模型下载说明 ===

1. 访问SMPL官方网站: https://smpl.is.tue.mpg.de
2. 注册账号并登录
3. 下载SMPL模型 (Python版本):
   - SMPL_MALE.pkl (男性模型)
   - SMPL_FEMALE.pkl (女性模型)
   - SMPL_NEUTRAL.pkl (中性模型)

4. 下载后运行此脚本进行转换:
   python scripts/download_and_convert_smpl.py --input SMPL_NEUTRAL.pkl --output assets/models/smpl/

注意: SMPL模型仅供非商业研究使用
""")

def main():
    parser = argparse.ArgumentParser(description='SMPL模型转换工具')
    parser.add_argument('--input', '-i', help='输入的pkl文件路径')
    parser.add_argument('--output', '-o', default='assets/models/smpl', help='输出目录')
    parser.add_argument('--gender', '-g', choices=['male', 'female', 'neutral'], 
                       default='neutral', help='模型性别')
    parser.add_argument('--info', action='store_true', help='显示下载说明')
    
    args = parser.parse_args()
    
    if args.info:
        download_smpl_model()
        return
    
    if not args.input:
        print("错误: 请指定输入文件路径")
        print("使用 --info 查看下载说明")
        sys.exit(1)
    
    if not os.path.exists(args.input):
        print(f"错误: 文件不存在: {args.input}")
        sys.exit(1)
    
    try:
        output_path = convert_pkl_to_json(args.input, args.output, args.gender)
        print(f"\n下一步: 将 {output_path} 复制到项目的 assets/models/smpl/ 目录")
    except Exception as e:
        print(f"转换失败: {e}")
        sys.exit(1)

if __name__ == '__main__':
    main()
