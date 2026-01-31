'use client';

interface Props {
    totalChats: number;
    todayChats: number;
    totalFiles: number;
}

export default function StatsCards({ totalChats, todayChats, totalFiles }: Props) {
    const stats = [
        { label: 'สนทนาทั้งหมด', value: totalChats },
        { label: 'สนทนาวันนี้', value: todayChats },
        { label: 'ไฟล์ทั้งหมด', value: totalFiles }
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {stats.map((stat, i) => (
                <div
                    key={i}
                    className="bg-gray-50 dark:bg-[#161615] border border-gray-200 dark:border-[#272726] rounded-lg p-4"
                >
                    <div className="text-2xl font-semibold text-gray-900 dark:text-white">
                        {stat.value}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">{stat.label}</div>
                </div>
            ))}
        </div>
    );
}
