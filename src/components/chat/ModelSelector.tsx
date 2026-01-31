'use client';

import { Model } from './types';

interface ModelSelectorProps {
    models: Model[];
    loading?: boolean;
    selectedModel: string;
    onSelectModel: (id: string) => void;
    showDropdown: boolean;
    onToggleDropdown: () => void;
}

export function ModelSelector({
    models,
    loading,
    selectedModel,
    onSelectModel,
    showDropdown,
    onToggleDropdown
}: ModelSelectorProps) {
    const currentModel = models.find(m => m.id === selectedModel) || models[0];

    if (loading) {
        return (
            <div className="flex items-center text-xs text-gray-400">
                <span className="material-symbols-outlined text-[16px] mr-1 animate-spin">progress_activity</span>
                กำลังโหลด...
            </div>
        );
    }

    if (models.length === 0) {
        return (
            <div className="flex items-center text-xs text-amber-600 dark:text-amber-400">
                <span className="material-symbols-outlined text-[16px] mr-1">warning</span>
                ยังไม่มี Model
            </div>
        );
    }

    return (
        <>
            {showDropdown && <div className="fixed inset-0 z-40" onClick={onToggleDropdown} />}
            <div className="relative z-50">
                <button
                    type="button"
                    onClick={onToggleDropdown}
                    className="flex items-center space-x-1 text-xs font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 cursor-pointer bg-white dark:bg-[#161616] px-3 py-1.5 rounded-full border border-gray-200 dark:border-[#262626] hover:border-gray-300 dark:hover:border-gray-600 transition-colors"
                >
                    <span>{currentModel?.name || 'เลือกโมเดล'}</span>
                    <span className="material-symbols-outlined text-[16px]">
                        {showDropdown ? 'expand_less' : 'expand_more'}
                    </span>
                </button>

                {showDropdown && (
                    <div className="absolute bottom-full left-0 mb-2 w-64 bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#262626] rounded-xl shadow-lg overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-200">
                        <div className="p-2 border-b border-gray-200 dark:border-[#262626]">
                            <span className="text-xs font-medium text-gray-500 dark:text-gray-400 px-2">เลือกโมเดล</span>
                        </div>
                        <div className="max-h-60 overflow-y-auto">
                            {models.map((model) => (
                                <button
                                    key={model.id}
                                    type="button"
                                    onClick={() => {
                                        onSelectModel(model.id);
                                        onToggleDropdown();
                                    }}
                                    className={`w-full flex items-center justify-between px-4 py-3 hover:bg-gray-100 dark:hover:bg-[#262626] transition-all duration-150 active:scale-[0.98] active:bg-gray-200 dark:active:bg-[#333] ${selectedModel === model.id ? 'bg-gray-100 dark:bg-[#262626]' : ''
                                        }`}
                                >
                                    <div className="text-left">
                                        <p className="text-sm font-medium text-gray-900 dark:text-white">{model.name}</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">{model.description}</p>
                                    </div>
                                    {selectedModel === model.id && (
                                        <span className="material-symbols-outlined text-[18px] text-green-500">check</span>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}
