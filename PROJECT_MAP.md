# PROJECT MAP — Jawlah v3

## TECH_STACK

| Layer | Technology | Version |
|---|---|---|
| Frontend | Angular (standalone) | 22.0.1 |
| Language | TypeScript | 6.0.3 |
| Backend | Node.js + Express | 4.21.x |
| WhatsApp | whatsapp-web.js + Puppeteer | 1.26.x / 23.x |
| Database | Supabase (PostgreSQL) | 2.108.2 |
| Styling | SCSS (custom neubrutalism, no framework) | — |
| Package Manager | npm | 11.13.0 |

## SYSTEM_FLOW

```
مستخدم (Angular SPA)
  │
  ├── /students ← قائمة الطلاب مع فلترة وبحث
  │     ├── /students/new ← إضافة طالب
  │     ├── /students/:id ← تفاصيل الطالب + حضور
  │     └── /students/:id/edit ← تعديل طالب
  │
  ├── /attendance ← سجل الحضور مع فلترة
  │
  └── /messages/new ← إرسال رسالة واتساب (جديد)
        │
        │  0. شاشة إعداد واتساب (أول مرة)
        │     ├── GET /api/status ← polling كل 3 ثواني
        │     ├── إذا disconnected ← GET /api/qr → عرض QR مباشرة
        │     └── بعد المسح → connected → تظهر القائمة
        │
        │  1. اختيار طلاب (مع فلاتر + تحديد الكل)
        │  2. كتابة رسالة ({{nickname}} ← يُستبدل تلقائياً)
        │  3. POST /api/send → Backend
        │       │
        │       ├── يجلب nickname + parent_phone من Supabase
        │       ├── يستبدل {{nickname}} لكل طالب
        │       ├── يرسل عبر whatsapp-web.js (تأخير 45 ثانية)
        │       └── يرجع { sent, failed, results[] }
        │
        └── عرض النتائج (نجاح/فشل لكل طالب)

Backend (Express, port 3001):
  ├── GET  /api/status ← حالة اتصال واتساب
  ├── GET  /api/qr     ← QR code (base64 PNG)
  └── POST /api/send   ← إرسال رسالة
```

## ARCHITECTURE

```
src/
├── app/
│   ├── core/
│   │   ├── models/          ← Student, Attendance interfaces
│   │   ├── services/        ← Supabase, Students, Attendance, Messaging
│   │   └── utils/           ← phone.util (Jordanian)
│   ├── features/
│   │   └── students/
│   │       ├── pages/
│   │       │   ├── student-list/      ← قائمة الطلاب
│   │       │   ├── student-detail/    ← تفاصيل الطالب
│   │       │   ├── student-form/      ← إضافة/تعديل
│   │       │   ├── attendance-list/   ← سجل الحضور
│   │       │   └── send-message/      ← إرسال رسالة (NEW)
│   │       ├── components/
│   │       │   ├── student-card/
│   │       │   ├── student-avatar/
│   │       │   ├── student-attendance/
│   │       │   └── action-icon-button/
│   │       └── utils/        ← program, call-status, avatar, links, attendance
│   └── shared/
│       └── components/
│           └── confirm-dialog/
├── environments/             ← Supabase keys
└── styles/                   ← SCSS variables

backend/                      ← Node.js Express server (NEW)
└── src/
    ├── index.ts              ← Entry point
    ├── routes.ts             ← API endpoints
    ├── supabase.client.ts    ← Supabase admin client
    └── whatsapp.service.ts   ← whatsapp-web.js client
```

## ORPHANS & PENDING

- [x] ~~إضافة حقل `nickname` لجدول `students`~~ (تم)
- [x] ~~إنشاء Backend Node.js (Express + whatsapp-web.js)~~ (تم)
- [x] ~~صفحة إرسال رسالة مع فلاتر + تحديد كل + معاينة~~ (تم)
- [x] ~~إضافة مسار `/messages/new`~~ (تم)
- [ ] تنفيذ `alter table students add column nickname text;` في Supabase SQL Editor
- [ ] تشغيل `npm install` في مجلد `backend/` (يحتاج وقت لتحميل Chromium)
- [ ] فتح QR باول مرة: `GET /api/qr` بعد تشغيل `npm run dev` في backend/
- [x] ~~ربط QR في Angular (polling + عرض QR مباشر + badget متصل)~~
