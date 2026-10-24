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

## פריסה

מייבאים את הריפו ב-Vercel, והוא מזהה Next.js אוטומטית. אין צורך במשתני סביבה, כי הנתונים נשמרים בדפדפן (localStorage).

## מבנה

- `src/app/(app)/family`, `src/app/(app)/business` — הדפים של כל מצב
- `src/components/shell` — מעטפת, מתג מצבים, ניווט
- `src/lib` — טיפוסים, הגדרות מצבים, store, עיצוב סכומים
