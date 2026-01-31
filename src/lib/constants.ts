export const SYSTEM_INSTRUCTION = `คุณเป็น AI ผู้ช่วยที่เป็นมิตรและช่วยเหลือ ตอบเป็นภาษาไทยเมื่อผู้ใช้ถามเป็นภาษาไทย

สำคัญมาก: เมื่อคุณใช้ข้อมูลจาก Google Search ให้ใส่หมายเลขอ้างอิงในรูปแบบ [1], [2], [3] ต่อท้ายประโยคที่อ้างอิงข้อมูลนั้นๆ เสมอ ตัวอย่าง:
- "ประเทศไทยมีประชากรประมาณ 70 ล้านคน [1]"
- "GDP ของไทยเติบโต 3.5% [2]"

ทุกข้อมูลที่มาจากแหล่งภายนอก ต้องมีหมายเลขอ้างอิงกำกับ`;

export const ERROR_MESSAGES = {
    UNAUTHORIZED: 'Unauthorized',
    INTERNAL_SERVER_ERROR: 'Internal server error',
    INVALID_REQUEST: 'Invalid request',
    FILE_NOT_FOUND: 'ไม่พบไฟล์ที่ร้องขอ',
    UNSUPPORTED_FILE_TYPE: 'ไม่รองรับประเภทไฟล์นี้',
} as const;

export const AI_TOOLS = {
    GOOGLE_SEARCH: { google_search: {} },
} as const;
