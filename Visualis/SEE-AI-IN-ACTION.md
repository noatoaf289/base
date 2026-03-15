# לראות את ה-AI בפעולה (MiniMax)

כשמריצים **רק Mock + Client** — מה שמוחזר הוא תבנית קבועה ("Generated stub..."), **בלי מודל אמיתי**.

כדי **שה-AI (MiniMax) ייצור HTML אמיתי** לפי הפרומפט, צריך להריץ את **השרת + ה-Agent** ולחבר את הלקוח אליהם.

---

## דרישות

- **Node.js** (18+)
- **Python** (3.10+)
- **Redis** — נדרש ל-Agent (לשמירת run ל-feedback). הכי פשוט: Docker.
- **מפתח MiniMax** — ב-`.env` בתיקיית Visualis (ראי למטה).

אין צורך ב-S3 או MinIO לראות את ה-preview; בלי S3 רק קישור ה-"Publish" לא יעבוד.

---

## שלב 1: Redis (פעם אחת)

ב-PowerShell (אם יש Docker):

```powershell
docker run -d -p 6379:6379 --name redis redis:alpine
```

אם אין Docker — התקיני Redis מקומית או השתמשי ב-Redis בענן והגדירי ב-`.env` את `REDIS_URL`.

---

## שלב 2: קובץ .env עם MiniMax

```powershell
cd c:\rivky\noa\base\Visualis
copy env.example .env
```

פתחי `.env` והגדירי (בלי רווחים מיותרים מסביב ל-`=`):

```env
MINIMAX_BASE_URL=https://api.minimax.chat/v1
MINIMAX_API_KEY=המפתח-האמיתי-שלך
MINIMAX_MODEL=mini-max-01
FLAPI_URL=http://localhost:4000
REDIS_URL=redis://localhost:6379/0
AGENT_URL=http://127.0.0.1:8002
BASE_URL=http://localhost:8000
```

שמרי את הקובץ.

---

## שלב 3: סביבה וירטואלית ותלויות Python (פעם ראשונה)

```powershell
cd c:\rivky\noa\base\Visualis
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r server/requirements.txt
pip install -r agent/requirements.txt
```

---

## שלב 4: להפעיל ארבע תהליכים

צריך **ארבע חלונות טרמינל** (או להריץ חלק ברקע).

### חלון 1 — Mock (flapi)

```powershell
cd c:\rivky\noa\base\Visualis\mocks
node server.js
```

השאירי רץ. אמור להופיע שרת על פורט 4000.

---

### חלון 2 — Agent (LangChain + MiniMax)

```powershell
cd c:\rivky\noa\base\Visualis
.\.venv\Scripts\Activate.ps1
$env:PYTHONPATH = "."
uvicorn agent.app:app --host 0.0.0.0 --port 8002 --reload --app-dir .
```

השאירי רץ. אמור להופיע שרת על פורט 8002. ה-`.env` נטען אוטומטית (כולל `MINIMAX_API_KEY`).

---

### חלון 3 — Server (מקשרת בין הלקוח ל-Agent ול-flapi)

```powershell
cd c:\rivky\noa\base\Visualis
.\.venv\Scripts\Activate.ps1
$env:PYTHONPATH = "."
uvicorn server.app:app --host 0.0.0.0 --port 8000 --reload --app-dir .
```

השאירי רץ. שרת על פורט 8000.

---

### חלון 4 — Client (מפנה ל-Server כדי לראות AI)

```powershell
cd c:\rivky\noa\base\Visualis\client
$env:VITE_PROXY_TARGET = "8000"
npm run dev
```

זה מריץ את הלקוח ומפנה את כל הבקשות ל-**פורט 8000** (השרת האמיתי) במקום ל-mock על 4000.

---

## שלב 5: לפתוח בדפדפן

גלשי ל: **http://localhost:5173**

עשי את אותו flow כמו קודם (Package → Run → Cube & fields → Prompt), ובשלב **Prompt** בחרי **MiniMax** ב-dropdown של המודל, כתבי למשל:

**"Create a simple HTML page with a bar chart of amount by region using the data in window.data"**

ולחצי **Generate HTML snippet**.

אם הכל מוגדר נכון — אחרי כמה שניות יופיע **HTML אמיתי** שה-AI יצר (ולא רק "Generated stub..."). אפשר גם לשלוח **Feedback** ולקבל גרסה מעודכנת.

---

## אם משהו לא עובד

- **"Generate failed" / 502** — וודאי ש-Agent רץ על 8002 ו-Redis רץ; וודאי ש-`MINIMAX_API_KEY` ב-`.env` נכון.
- **MiniMax לא מופיע ברשימת המודלים** — השרת (8000) קורא ל-`/api/models`; וודאי ש-`MINIMAX_BASE_URL` ו-`MINIMAX_API_KEY` מוגדרים ב-`.env` והפעלת מחדש את השרת.
- **עדיין רואים "Generated stub"** — וודאי שהלקוח רץ עם `VITE_PROXY_TARGET=8000` (חלון 4) ושה-Server רץ על 8000.
