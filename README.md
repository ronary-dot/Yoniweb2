# Yoniweb2

אפליקציית Web לניהול תקציב, עם שני מצבים: **משפחה** ו**עסק**. האפיון המלא נמצא ב-[`docs/SPEC.md`](docs/SPEC.md).

## פיתוח

```bash
npm install
npm run dev        # http://localhost:3000
```

| פקודה | מה היא עושה |
| --- | --- |
| `npm run build` | בילד פרודקשן |
| `npm run typecheck` | בדיקת TypeScript |
| `npm run lint` | ESLint |
| `npm test` | בדיקות יחידה (Vitest) ללוגיקה ב-`src/lib/domain` |
| `npm run test:e2e` | בדיקות קצה לקצה (Playwright, דסקטופ ומובייל) מול בילד פרודקשן |

## פריסה

מייבאים את הריפו ב-Vercel, והוא מזהה Next.js אוטומטית. אין צורך במשתני סביבה, כי הנתונים נשמרים בדפדפן (localStorage).

## מה יש באפליקציה

- **שני מצבים** — משפחה ועסק, מעבר בלחיצה או ב-`Ctrl/⌘ + .`
- **דמו חי** — "טען נתוני דמו" במסך הפתיחה, או `/?demo=1`
- **משפחה** — תנועות, תקציבים, חוגים, קניות, יעדי חיסכון, תובנות
- **עסק** — לקוחות וחשבוניות, תחזית תזרים ל-90 יום עם "מה אם", תובנות
- **דוחות**, **⌘K** לחיפוש ופקודות (כולל "הוצאה 120 סופר"), **מצב כהה**, **התקנה למסך הבית**

## מבנה

- `src/app/(app)/family`, `src/app/(app)/business` — הדפים של כל מצב
- `src/components/shell` — מעטפת, מתג מצבים, ניווט
- `src/components` — רכיבי UI לפי תחום (transactions, budgets, goals, business, reports, charts)
- `src/lib/domain` — לוגיקה טהורה ונבדקת: מחזורים, תקציבים, תזרים, חשבוניות, תובנות
- `src/lib/demo` — מחולל נתוני הדמו
- `tests/unit`, `tests/e2e` — בדיקות
