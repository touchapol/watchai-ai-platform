# WatchAI - AI Platform (AI Trainee Exam)

แพลตฟอร์มแชท AI พัฒนาด้วย Next.js 15 รองรับผู้ให้บริการ AI ทั้ง Google Gemini และ OpenAI โปรเจคนี้สร้างขึ้นเพื่อทดสอบการพัฒนาเว็บแอปพลิเคชันเกี่ยวกับ AI Platform พร้อมฟีเจอร์ครบถ้วนสำหรับการจัดการผู้ใช้ ไฟล์ และการสนทนาด้วย AI

## ภาพรวม

WatchAI คือแพลตฟอร์มสนทนาที่ช่วยให้ผู้ใช้สามารถโต้ตอบกับโมเดล AI หลากหลายผ่านอินเทอร์เฟซที่ทันสมัยและ responsive รองรับการใช้งานทั้งบน Desktop และ Mobile พร้อมระบบจัดการสำหรับผู้ดูแลระบบ

## ฟีเจอร์หลัก

### การสนทนา AI
- **Multi-Model AI Chat** - รองรับโมเดลจาก Google Gemini และ OpenAI พร้อมการตอบกลับแบบ Streaming
- **ประวัติการสนทนา** - บันทึกประวัติแชททั้งหมด
- **แนบไฟล์** - อัพโหลดและแนบไฟล์ในการสนทนาเพื่อให้ AI วิเคราะห์
- **ค้นหาเว็บ** - AI สามารถค้นหาข้อมูลจากอินเทอร์เน็ตแบบ Real-time (Tested with Gemini)
- **อ้างอิงแหล่งที่มา** - แสดงแหล่งอ้างอิงอัตโนมัติจากผลการค้นหาเว็บ (Tested with Gemini)

### ระบบผู้ใช้
- **ระบบยืนยันตัวตน** - Authentication ด้วย JWT พร้อมจัดการ Session อย่างปลอดภัย
- **Session หลายอุปกรณ์** - ติดตามและจัดการการเข้าใช้งานจากหลายอุปกรณ์
- **แบ่งระดับสิทธิ์** - แยก Role เป็น User และ Admin

### จัดการไฟล์
- **File Manager** - ระบบจัดการไฟล์พร้อมรองรับโฟลเดอร์
- **Drag & Drop** - อัพโหลดไฟล์ง่ายๆ พร้อมแสดงความคืบหน้า
- **ดูตัวอย่างไฟล์** - เปิดดูรูปภาพและเอกสารได้ในเบราว์เซอร์
- **แก้ไขไฟล์ Text** - แก้ไขไฟล์ข้อความได้โดยตรง

### แผงควบคุมผู้ดูแล
- **จัดการผู้ใช้** - สร้าง แก้ไข และจัดการบัญชีผู้ใช้
- **จัดการ Provider** - ตั้งค่าผู้ให้บริการ AI และ API Key
- **วิเคราะห์การใช้งาน** - ติดตามการใช้ Token และสถิติระบบ
- **Knowledge Base** - รองรับ RAG (Retrieval-Augmented Generation)
- **บันทึก Log** - ระบบ Log ครบถ้วนทั้ง Event และ Security

### ฟีเจอร์เทคนิค
- **Long-Term Memory** - AI จดจำข้อมูลสำคัญข้ามการสนทนา
- **Dark Mode** - รองรับธีมมืดเต็มรูปแบบ
- **Responsive Design** - ใช้งานได้ดีทั้งบน Desktop และ Mobile
- **Real-time Streaming** - รับการตอบกลับ AI แบบ Real-time ผ่าน SSE

## เทคโนโลยีที่ใช้

| หมวดหมู่ | เทคโนโลยี |
|----------|-----------|
| Framework | Next.js 15 (App Router) |
| ภาษา | TypeScript |
| Styling | Tailwind CSS |
| Database | PostgreSQL (Prisma ORM) |
| NoSQL | MongoDB (Messages, Logs) |
| AI Providers | Google Gemini, OpenAI |
| Authentication | JWT + bcrypt |
| Charts | Recharts |

## เริ่มต้นใช้งาน

### สิ่งที่ต้องมี
- Node.js 18+ หรือ Bun
- PostgreSQL database
- MongoDB database
- API keys สำหรับ AI providers (Gemini และ/หรือ OpenAI)

### การติดตั้ง

1. Clone repository
```bash
git clone https://github.com/your-username/watchai.git
cd watchai
```

2. ติดตั้ง dependencies
```bash
bun install
# หรือ
npm install
```

3. ตั้งค่า environment variables
```bash
cp .env.example .env.local
```

แก้ไขไฟล์ `.env.local`:
```env
DATABASE_URL="postgresql://..."
MONGODB_URI="mongodb://..."
JWT_SECRET="your-secret-key"
ENCRYPTION_KEY="your-encryption-key"
```

4. สร้าง database
```bash
bunx prisma migrate deploy
bunx prisma generate
```

5. รัน development server
```bash
bun run dev
# หรือ
npm run dev
```

6. เปิด [http://localhost:3000](http://localhost:3000) และทำตามขั้นตอน Setup เริ่มต้น

## โครงสร้างโปรเจค

```
src/
├── app/                    # Next.js App Router pages
│   ├── api/               # API routes
│   ├── admin/             # แผงควบคุมผู้ดูแล
│   ├── chat/              # หน้าแชท
│   ├── dashboard/         # แดชบอร์ดผู้ใช้
│   ├── files/             # จัดการไฟล์
│   └── login/             # หน้าเข้าสู่ระบบ
├── components/            # React components
│   ├── admin/            # Components สำหรับ Admin
│   ├── chat/             # Components สำหรับ Chat
│   ├── dashboard/        # Components สำหรับ Dashboard
│   └── files/            # Components สำหรับ File Manager
├── lib/                   # Utility libraries
│   ├── auth.ts           # ระบบยืนยันตัวตน
│   ├── db.ts             # Prisma client
│   ├── mongodb.ts        # MongoDB connection
│   └── logger.ts         # ระบบบันทึก Log
└── types/                # TypeScript type definitions
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - เข้าสู่ระบบ
- `POST /api/auth/register` - สมัครสมาชิก
- `POST /api/auth/logout` - ออกจากระบบ
- `GET /api/auth/me` - ดึงข้อมูลผู้ใช้ปัจจุบัน

### Chat
- `POST /api/chat` - ส่งข้อความและรับคำตอบจาก AI (SSE streaming)
- `GET /api/conversations` - รายการสนทนาทั้งหมด
- `GET /api/conversations/[id]` - ดึงสนทนาพร้อมข้อความ

### Files
- `GET /api/files` - รายการไฟล์ของผู้ใช้
- `POST /api/files/upload` - อัพโหลดไฟล์
- `GET /api/files/[id]` - ดาวน์โหลดไฟล์
- `DELETE /api/files/[id]` - ลบไฟล์

### Admin
- `GET /api/admin/overview` - สถิติระบบ
- `GET /api/admin/users` - รายการผู้ใช้
- `GET /api/admin/providers` - รายการ AI providers
- `POST /api/admin/providers` - เพิ่ม AI provider

## Environment Variables

| ตัวแปร | คำอธิบาย |
|--------|---------|
| `DATABASE_URL` | Connection string สำหรับ PostgreSQL |
| `MONGODB_URI` | Connection string สำหรับ MongoDB |
| `JWT_SECRET` | Secret key สำหรับสร้าง JWT tokens |
| `ENCRYPTION_KEY` | Key สำหรับเข้ารหัส API keys |

## Build และ Deploy

### Production Build (แบบปกติ)
```bash
bun run build
bun start
```

### Docker (ใช้ Database ภายนอก)
วิธีนี้ใช้กรณีที่มี PostgreSQL และ MongoDB อยู่แล้ว

1. ตั้งค่า `.env.local` ให้ชี้ไปยัง database ของคุณ

2. Build และรัน
```bash
docker compose up -d --build
```

### Docker (พร้อม Database ในตัว)
วิธีนี้จะรัน PostgreSQL และ MongoDB ไปด้วยใน Docker และ migrate database อัตโนมัติ

```bash
docker compose -f docker-compose.full.yml up -d --build
```

รอสักครู่ให้ database พร้อม แล้ว app จะ migrate และ start อัตโนมัติ

ตั้งค่า default (สามารถแก้ไขได้ใน `docker-compose.full.yml`):
- PostgreSQL: `watchai:watchai123@localhost:5432/watchai`
- MongoDB: `watchai:watchai123@localhost:27017/watchai`

### หยุดการทำงาน
```bash
# แบบใช้ DB ภายนอก
docker compose down

# แบบรวม DB
docker compose -f docker-compose.full.yml down
```

## License

โปรเจคนี้สร้างขึ้นเป็นส่วนหนึ่งของการสอบ AI Trainee

## ผู้พัฒนา

Watcharachai Wanpheng + AI Assistant
