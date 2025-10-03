'use client';

import { useState, useEffect } from 'react';
import { 
  calculatePrice, 
  formatPrice, 
  PAYMENT_METHOD_NAMES,
  COURSE_CATEGORY_NAMES,
} from '@/lib/pricing';
import type { PaymentMethod, CourseCategory } from '@/types';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

interface PriceCalculatorProps {
  category: CourseCategory;
  courseName?: string;
  onChange?: (method: PaymentMethod, finalPrice: number) => void;
  showDetails?: boolean;
}

export function PriceCalculator({ 
  category, 
  courseName,
  onChange,
  showDetails = true 
}: PriceCalculatorProps) {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('wechat');
  const [priceInfo, setPriceInfo] = useState(calculatePrice(category, 'wechat'));

  useEffect(() => {
    const info = calculatePrice(category, selectedMethod);
    setPriceInfo(info);
    onChange?.(selectedMethod, info.finalPrice);
  }, [selectedMethod, category, onChange]);

  const handleMethodChange = (method: PaymentMethod) => {
    setSelectedMethod(method);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">
          💰 课程价格
          {courseName && <span className="text-sm font-normal text-gray-600 ml-2">- {courseName}</span>}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 课程类别 */}
        <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
          <div className="text-sm text-gray-600">课程类别</div>
          <div className="text-lg font-semibold text-blue-700">
            {COURSE_CATEGORY_NAMES[category]}
          </div>
        </div>

        {/* 支付方式选择 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            选择支付方式
          </label>
          <div className="grid grid-cols-1 gap-2">
            {(Object.entries(PAYMENT_METHOD_NAMES) as [PaymentMethod, string][]).map(([method, name]) => {
              const methodPrice = calculatePrice(category, method);
              const isSelected = selectedMethod === method;
              const savings = priceInfo.basePrice - methodPrice.finalPrice;

              return (
                <button
                  key={method}
                  onClick={() => handleMethodChange(method)}
                  className={`relative p-4 text-left border-2 rounded-lg transition ${
                    isSelected
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{name}</div>
                      {methodPrice.fee > 0 && (
                        <div className="text-xs text-gray-500 mt-1">
                          手续费 {(methodPrice.feeRate * 100).toFixed(1)}%
                        </div>
                      )}
                      {methodPrice.fee === 0 && savings > 0 && (
                        <div className="text-xs text-green-600 font-medium mt-1">
                          💰 省 {formatPrice(savings, 'CAD')}
                        </div>
                      )}
                    </div>
                    <div className="text-right ml-4">
                      <div className="text-lg font-bold text-gray-900">
                        {formatPrice(methodPrice.finalPrice, 'CAD')}
                      </div>
                      {methodPrice.fee > 0 && (
                        <div className="text-xs text-gray-500">
                          +{formatPrice(methodPrice.fee, 'CAD')} 手续费
                        </div>
                      )}
                    </div>
                  </div>
                  {isSelected && (
                    <div className="absolute top-2 right-2">
                      <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* 价格明细 */}
        {showDetails && (
          <div className="pt-4 border-t border-gray-200">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">基础价格</span>
                <span className="font-medium">{formatPrice(priceInfo.basePrice, 'CAD')}</span>
              </div>
              {priceInfo.fee > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">
                    支付手续费 ({(priceInfo.feeRate * 100).toFixed(1)}%)
                  </span>
                  <span className="font-medium text-orange-600">
                    +{formatPrice(priceInfo.fee, 'CAD')}
                  </span>
                </div>
              )}
              <div className="pt-2 border-t border-gray-200 flex justify-between">
                <span className="font-semibold text-gray-900">总计</span>
                <span className="text-2xl font-bold text-blue-600">
                  {formatPrice(priceInfo.finalPrice, 'CAD')}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* 省钱提示 */}
        {priceInfo.fee > 0 && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-start gap-2">
              <span className="text-green-600">💡</span>
              <div className="text-sm text-green-700">
                <strong>省钱提示：</strong>使用微信、支付宝或EMT支付可免手续费，
                节省 {formatPrice(priceInfo.fee, 'CAD')}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default PriceCalculator;

