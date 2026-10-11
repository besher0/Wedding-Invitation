# نشر منصة ليلتنا على Render

الملف `render.yaml` ينشئ خدمتين: React Static Site و NestJS Web Service، ويستخدم قاعدة Neon الموجودة بدل إنشاء PostgreSQL جديد على Render.

## خطوات النشر

1. من Neon أعد تعيين كلمة المرور المكشوفة سابقاً وأنشئ رابط اتصال **جديد**. احتفظ به سراً.
2. افتح https://dashboard.render.com/select-repo?type=blueprint أو من لوحة Render اختر **New → Blueprint**، واربط GitHub واختر `besher0/Wedding-Invitation` مع الفرع `main`. يقرأ Render ملف `render.yaml`.
3. عند طلب متغيرات البيئة، ضع:
   - `DATABASE_URL`: رابط Neon الجديد الكامل مع `sslmode=require`.
   - `CORS_ORIGIN`: رابط موقع Static Site النهائي، مثل `https://wedding-invitation-web.onrender.com` (بدون شرطة مائلة أخيرة).
   - `VITE_API_URL`: رابط Web Service API النهائي متبوعاً بـ `/api`، مثل `https://wedding-invitation-api.onrender.com/api`.
   - `JWT_SECRET`: يتم إنشاؤه تلقائياً عند أول إنشاء للـ Blueprint.
4. إذا لم تعرف عنواني الخدمتين قبل إنشائهما: أنشئ الخدمات، ثم راجع الروابط النهائية في Render واضبط `CORS_ORIGIN` في خدمة API و`VITE_API_URL` في خدمة الواجهة، وأعد نشر الخدمات (**Clear build cache & deploy** للواجهة إذا لزم).
5. افحص `https://YOUR-API.onrender.com/api/health/live` ثم `/api/health/ready`. الثانية تتأكد من اتصال Neon.
6. افتح رابط الواجهة وسجّل مستخدماً تجريبياً، ثم أنشئ دعوة واحفظها وانشرها. اختبر `/invite/<slug>` في نافذة خاصة.

## أوامر Render

- Backend root: `apps/api`
- Backend build: `npm install && npx prisma generate && npm run build`
- Backend start: `npx prisma migrate deploy && node dist/main.js`
- Frontend build: `npm install && npm run build`
- Frontend publish dir: `dist`
- SPA rewrite: `/* → /index.html`

**تحذير:** Start Command يشغّل `prisma migrate deploy` تلقائياً على قاعدة Neon؛ راجع مخطط Migration وتأكد أن الرابط يخص قاعدة البيانات الصحيحة، وخذ Snapshot قبل أول نشر. لا تستخدم قاعدة تحتوي على بيانات مهمة بدون مراجعة.

## محددات هذه النسخة

- رابط الدعوة متاح بعد النشر؛ الأغاني والصور ما زالت غير مرفوعة على استضافة دائمة.
- لا يوجد Rate Limiting أو تأكيد بريد أو استعادة كلمة مرور حتى الآن.
- خطة Render المجانية قد تكون أبطأ عند أول طلب بعد الخمول؛ راجع خصائص وخيارات خطتك.
- بناء واجهة Vite يضم `VITE_API_URL` وقت البناء؛ تغيير المتغير يحتاج إعادة بناء الواجهة.
- لا تنشر كلمة مرور Neon أو `JWT_SECRET` في README أو GitHub أو Screenshots.
