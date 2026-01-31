'use client';

import Link from 'next/link';

const TERMS_SECTIONS = [
    {
        title: '1. การยอมรับข้อตกลง',
        content: 'การใช้งาน WatchAI Platform ถือว่าท่านยอมรับข้อตกลงและเงื่อนไขการใช้งานทั้งหมด หากท่านไม่ยอมรับข้อตกลงเหล่านี้ กรุณาหยุดใช้งานแพลตฟอร์มนี้',
    },
    {
        title: '2. การใช้งาน AI และ LLM',
        content: 'ท่านตกลงที่จะใช้งาน AI และ Large Language Model (LLM) อย่างรับผิดชอบ ห้ามใช้งานเพื่อวัตถุประสงค์ที่ผิดกฎหมาย หรือสร้างเนื้อหาที่เป็นอันตราย',
    },
    {
        title: '3. ความเป็นส่วนตัวและข้อมูล',
        content: 'เราให้ความสำคัญกับความเป็นส่วนตัวของท่าน ข้อมูลที่ท่านอัปโหลดหรือสนทนากับ AI จะถูกเก็บรักษาอย่างปลอดภัยและไม่แบ่งปันกับบุคคลที่สาม',
    },
    {
        title: '4. การจัดการไฟล์',
        content: 'ท่านมีสิทธิ์ในไฟล์ที่ท่านอัปโหลด แต่ท่านตกลงให้เราใช้ไฟล์เหล่านั้นเพื่อประมวลผลและตอบคำถามของท่านผ่าน AI',
    },
    {
        title: '5. การใช้ Token',
        content: 'การใช้งาน AI จะมีการนับ Token การใช้งาน ท่านสามารถตรวจสอบปริมาณการใช้งานได้ทั้งรายข้อความ รายวัน รายสัปดาห์ และรายเดือน',
    },
    {
        title: '6. ความรับผิดชอบ',
        content: 'AI อาจให้คำตอบที่ไม่ถูกต้องหรือไม่สมบูรณ์ ท่านควรตรวจสอบข้อมูลก่อนนำไปใช้งาน เราไม่รับผิดชอบต่อความเสียหายที่เกิดจากการใช้คำตอบของ AI',
    },
    {
        title: '7. การเปลี่ยนแปลงข้อตกลง',
        content: 'เราขอสงวนสิทธิ์ในการเปลี่ยนแปลงข้อตกลงการใช้งานได้ตลอดเวลา การใช้งานต่อหลังจากมีการเปลี่ยนแปลงถือว่าท่านยอมรับข้อตกลงใหม่',
    },
];

function TermsSection({ title, content }: { title: string; content: string }) {
    return (
        <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">{title}</h2>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">{content}</p>
        </section>
    );
}

export default function TermsPage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-[#0A0A0A] dark:to-[#161616] py-12 px-4">
            <div className="max-w-3xl mx-auto">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">ข้อตกลงการใช้งาน</h1>
                    <p className="text-gray-600 dark:text-gray-400">Terms of Service - WatchAI Platform</p>
                </div>

                <div className="bg-white dark:bg-[#1A1A1A] rounded-2xl shadow-lg p-8 space-y-6">
                    {TERMS_SECTIONS.map((section, index) => (
                        <TermsSection key={index} title={section.title} content={section.content} />
                    ))}

                    <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
                        <p className="text-sm text-gray-500">อัปเดตล่าสุด: มกราคม 2026</p>
                    </div>
                </div>

                <div className="mt-8 text-center">
                    <Link href="/register" className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
                        <span className="material-symbols-outlined text-[20px]">arrow_back</span>
                        กลับไปหน้าสมัครสมาชิก
                    </Link>
                </div>
            </div>
        </div>
    );
}
