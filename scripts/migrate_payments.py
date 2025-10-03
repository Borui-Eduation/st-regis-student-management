#!/usr/bin/env python3
"""
支付数据迁移脚本
将enrollment中的payment信息迁移到独立的payments集合

使用方法:
python scripts/migrate_payments.py [--dry-run]
"""

import sys
import os
from datetime import datetime

# 添加项目根目录到路径
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from google.cloud import firestore
from google.oauth2 import service_account

# Firebase配置
SERVICE_ACCOUNT_FILE = 'borui-education-4fd6c77422e0.json'

def init_firestore():
    """初始化Firestore客户端"""
    credentials = service_account.Credentials.from_service_account_file(
        SERVICE_ACCOUNT_FILE
    )
    # 使用命名数据库 'studentapp'
    return firestore.Client(credentials=credentials, database='studentapp')

def migrate_payments(dry_run=False):
    """
    迁移支付数据
    
    Args:
        dry_run: 如果为True，只显示将要迁移的数据，不实际写入
    """
    db = init_firestore()
    
    print("=" * 60)
    print("支付数据迁移脚本")
    print("=" * 60)
    
    # 检查是否自动确认
    auto_confirm = '--yes' in sys.argv or '-y' in sys.argv
    
    if dry_run:
        print("🔍 DRY RUN 模式 - 不会实际修改数据库")
    else:
        print("⚠️  LIVE 模式 - 将会修改数据库")
        if not auto_confirm:
            confirm = input("确认继续? (yes/no): ")
            if confirm.lower() != 'yes':
                print("取消迁移")
                return
        else:
            print("✅ 自动确认 - 开始执行")
    
    print("\n步骤1: 读取所有enrollments...")
    enrollments_ref = db.collection('enrollments')
    enrollments = enrollments_ref.stream()
    
    enrollment_count = 0
    payment_count = 0
    skip_count = 0
    error_count = 0
    
    for enrollment_doc in enrollments:
        enrollment_count += 1
        enrollment_data = enrollment_doc.to_dict()
        enrollment_id = enrollment_doc.id
        
        # 检查是否已经有payment字段
        if 'payment' not in enrollment_data:
            skip_count += 1
            continue
        
        payment_info = enrollment_data['payment']
        
        # 检查是否已经迁移过（通过查询payments集合）
        existing_payment = db.collection('payments')\
            .where('enrollmentId', '==', enrollment_id)\
            .limit(1)\
            .get()
        
        if len(list(existing_payment)) > 0:
            print(f"  ℹ️  跳过 {enrollment_id} - 已存在payment记录")
            skip_count += 1
            continue
        
        # 构建新的payment文档
        try:
            payment_data = {
                'enrollmentId': enrollment_id,
                'studentId': enrollment_data.get('studentId', ''),
                
                # 金额信息
                'amount': payment_info.get('amount', 0),
                'basePrice': payment_info.get('basePrice', 0),
                'paymentFee': payment_info.get('paymentFee', 0),
                'finalAmount': payment_info.get('finalPrice', payment_info.get('amount', 0)),
                'currency': payment_info.get('currency', 'CAD'),
                
                # 支付方式
                'method': payment_info.get('method', 'manual'),
                'transactionId': payment_info.get('transactionId'),
                
                # 状态
                'status': 'completed' if payment_info.get('paid', False) else 'pending',
                
                # 时间
                'paidAt': payment_info.get('paidAt'),
                
                # 附加信息
                'notes': f"从enrollment {enrollment_id} 迁移",
                
                # 元数据
                'createdAt': enrollment_data.get('createdAt', firestore.SERVER_TIMESTAMP),
                'updatedAt': firestore.SERVER_TIMESTAMP,
            }
            
            if not dry_run:
                # 创建payment文档
                payment_ref = db.collection('payments').document()
                payment_ref.set(payment_data)
                print(f"  ✅ 创建 payment: {payment_ref.id} for enrollment: {enrollment_id}")
            else:
                print(f"  🔍 [DRY RUN] 将创建 payment for enrollment: {enrollment_id}")
                print(f"     状态: {payment_data['status']}, 金额: {payment_data['finalAmount']} {payment_data['currency']}")
            
            payment_count += 1
            
        except Exception as e:
            error_count += 1
            print(f"  ❌ 错误处理 enrollment {enrollment_id}: {str(e)}")
    
    print("\n" + "=" * 60)
    print("迁移统计:")
    print(f"  总enrollments: {enrollment_count}")
    print(f"  成功迁移: {payment_count}")
    print(f"  跳过: {skip_count}")
    print(f"  错误: {error_count}")
    print("=" * 60)
    
    if not dry_run and payment_count > 0:
        print("\n✅ 迁移完成!")
        print("⚠️  注意: enrollment中的payment字段仍然保留")
        print("   可以在确认迁移成功后手动删除")
    elif dry_run:
        print("\n🔍 DRY RUN 完成 - 没有修改数据库")
        print("   如果结果正确，请运行: python scripts/migrate_payments.py")

if __name__ == '__main__':
    # 检查命令行参数
    dry_run = '--dry-run' in sys.argv
    
    try:
        migrate_payments(dry_run=dry_run)
    except Exception as e:
        print(f"\n❌ 迁移失败: {str(e)}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

