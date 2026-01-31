'use client';

import { ModelUsage } from '@/types/dashboard';

interface Props {
    models: ModelUsage[];
}

export default function TopModels({ models }: Props) {
    return (
        <div className="bg-gray-50 dark:bg-[#161615] border border-gray-200 dark:border-[#272726] rounded-lg p-6">
            <h2 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-4">Model ที่ใช้บ่อย</h2>
            {models.length > 0 ? (
                <div className="space-y-3">
                    {models.map((model, i) => (
                        <div key={i} className="flex items-center justify-between">
                            <span className="text-sm text-gray-700 dark:text-gray-300">{model.model}</span>
                            <span className="text-xs text-gray-500">{model.count} ครั้ง</span>
                        </div>
                    ))}
                </div>
            ) : (
                <p className="text-sm text-gray-500">ยังไม่มีข้อมูล</p>
            )}
        </div>
    );
}
