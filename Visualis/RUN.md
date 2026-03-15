# איך להריץ ולהתנסות ב-Visualis

## אופציה 1: התנסות מהירה (רק Mock + Client) — מומלץ להתחלה

בלי Docker, בלי Python, בלי מודל AI. ה-Mock מחזיר HTML קבוע כך שתוכלי לראות את כל ה-flow ב-UI.

### דרישות
- **Node.js** (גרסה 18 או חדשה יותר) — [להורדה](https://nodejs.org/)

### שלבים (ב-PowerShell או CMD)

**1. להפעיל את שרת ה-Mock (פורט 4000)**

```powershell
cd c:\rivky\noa\base\Visualis\mocks
npm install
node server.js
```

השאירי את החלון פתוח. אמורה להופיע הודעה שהשרת רץ על פורט 4000.

**2. בחלון טרמינל שני — להפעיל את הלקוח (פורט 5173)**

```powershell
cd c:\rivky\noa\base\Visualis\client
npm install
npm run dev
```

**3. בדפדפן**

פתחי: **http://localhost:5173**

### מה לנסות ב-UI

1. **Package** — הקלידי לפחות 2 תווים (למשל `sa`) ובחרי חבילה מהרשימה (למשל "Sample Sales Package").
2. **Run parameters** — השאירי את ה-JSON כמו שהוא (או ערכי) ולחצי **Run package**.
3. **Cube & fields** — בחרי Cube (למשל `sales_cube`), הוסיפי הסבר לשדות (שם שדה + הסבר קצר), ולחצי **Next**.
4. **Prompt** — בחרי מודל (Default / MiniMax אם הוגדר), כתבי למשל: "Bar chart of amount by region" ולחצי **Generate HTML snippet**.
5. **Preview** — יופיעו תצוגה מקדימה, קוד, וכפתורי **Copy publish link** / **Open published page**. אפשר גם לשלוח **Feedback** (למשל "Make the bars blue") ולקבל snippet מעודכן.

---

## אופציה 2: עם שרת + Agent אמיתיים (Python + מודל)

כאן ה-Agent מייצר HTML אמיתי עם LangChain ומודל (vLLM מקומי או MiniMax בענן).

### דרישות
- **Node.js** (18+)
- **Python** (3.10+)
- **Docker Desktop** (אם רוצים Redis, MinIO ו-vLLM דרך Docker)
- אופציונלי: **MiniMax API key** (אם רוצים מודל MiniMax)

### 2א. הרצה עם Mock של flapi + מודל אמיתי (MiniMax)

בלי Docker: רק שרת Python, Agent ו-Client. ה-API של החבילות (flapi) עדיין mock.

**1. סביבה וירטואלית ותלויות Python**

```powershell
cd c:\rivky\noa\base\Visualis
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r server/requirements.txt
pip install -r agent/requirements.txt
```

**2. משתני סביבה (כולל API key של MiniMax)**

העתיקי `env.example` ל-`.env` **בתיקיית Visualis** (שורש הפרויקט):

```powershell
cd c:\rivky\noa\base\Visualis
copy env.example .env
```

פתחי את הקובץ `.env` וערכי את השורה של MiniMax:

```env
MINIMAX_BASE_URL=https://api.minimax.chat/v1
MINIMAX_API_KEY=המפתח-האמיתי-שקיבלת-מ-MiniMax
MINIMAX_MODEL=mini-max-01
```

השרת וה-Agent טוענים את `.env` אוטומטית בהפעלה (דרך `python-dotenv`), אז מספיק לשמור את הקובץ.  
שאר המשתנים (למשל `FLAPI_URL=http://localhost:4000` ל-mock) אפשר להשאיר כמו ב-`env.example`.

**3. הפעלת Redis (לפי Agent)**  
אם יש לך Redis מקומי על פורט 6379 — השאירי `REDIS_URL=redis://localhost:6379/0`.  
אם אין — הרצי Redis ב-Docker:

```powershell
docker run -d -p 6379:6379 redis:alpine
```

**4. הפעלת Mock של flapi (אם עדיין לא רץ)**

```powershell
cd c:\rivky\noa\base\Visualis\mocks
npm install
node server.js
```

**5. הפעלת Server ו-Agent**

בחלון אחד:

```powershell
cd c:\rivky\noa\base\Visualis
.\.venv\Scripts\Activate.ps1
$env:PYTHONPATH = "."
$env:FLAPI_URL = "http://localhost:4000"
$env:AGENT_URL = "http://127.0.0.1:8002"
$env:BASE_URL = "http://localhost:8000"
# אם יש MiniMax:
# $env:MINIMAX_BASE_URL = "https://api.minimax.chat/v1"
# $env:MINIMAX_API_KEY = "המפתח-שלך"
uvicorn server.app:app --host 0.0.0.0 --port 8000 --reload --app-dir .
```

בחלון שני:

```powershell
cd c:\rivky\noa\base\Visualis
.\.venv\Scripts\Activate.ps1
$env:PYTHONPATH = "."
# טעני כאן את .env או הגדירי MODEL_URL / MINIMAX_*
uvicorn agent.app:app --host 0.0.0.0 --port 8002 --reload --app-dir .
```

**6. Build של הלקוח והגשתו דרך השרת**

```powershell
cd c:\rivky\noa\base\Visualis\client
npm run build
```

העתיקי את התוכן של `client/dist` לתיקייה שהשרת מגיש (למשל `static/` ליד `server/`). ב-`server/app.py` משתמשים ב-`STATIC_DIR` — ברירת מחדל `../static` ביחס למיקום הקוד. צרי תיקייה `static` בתיקיית Visualis והעתיקי לתוכה את תוכן `client/dist` (כולל `assets` ו-`index.html`):

```powershell
mkdir c:\rivky\noa\base\Visualis\static 2>$null; Copy-Item -Recurse -Force c:\rivky\noa\base\Visualis\client\dist\* c:\rivky\noa\base\Visualis\static\
```

ואז הרצי שוב את השרת (שלב 5). פתחי בדפדפן: **http://localhost:8000**

במצב הזה כל הבקשות הולכות לשרת (פורט 8000); השרת עושה proxy ל-flapi mock (4000) ול-Agent (8002).

### 2ב. הרצה עם Docker (Redis, MinIO, Mock, ואופציונלי vLLM)

ב-Linux/Mac:

```bash
cd c:/rivky/noa/base/Visualis
./start-dev.sh
```

ב-Windows עם Docker Desktop — מאותה תיקייה:

```powershell
docker compose -f mocks/docker-compose.yaml -f mocks/docker-compose.models.yaml up -d redis-stack mocks minio
# אופציונלי: vllm-gemma (מודל מקומי) — רק אם יש מספיק זיכרון
# docker compose -f mocks/docker-compose.yaml -f mocks/docker-compose.models.yaml up -d redis-stack mocks minio vllm-gemma
```

אחר כך הרצי את השרת וה-Agent כמו ב-2א (עם `REDIS_URL`, `S3_*` וכו' לפי ה-`.env` או לפי מה ש-`start-dev.sh` כותב ל-`.dev-run/app.env`).

---

## סיכום כתובות

| מצב              | כתובת האפליקציה   | API / Mock        |
|------------------|--------------------|-------------------|
| רק Mock + Client | http://localhost:5173 | Mock על 4000   |
| Server + Agent   | http://localhost:8000  | Server 8000, Agent 8002, Flapi 4000 |

---

## בעיות נפוצות

- **"Failed to fetch" / CORS** — וודאי שה-Mock רץ על 4000 והלקוח על 5173 עם ה-proxy ב-Vite (או שהלקוח מוגש דרך השרת על 8000).
- **Generate נכשל** — במצב Mock זה לא אמור לקרות. במצב אמיתי: בדקי ש-Agent רץ על 8002 וש-Redis/S3 מוגדרים אם נדרש.
- **MiniMax לא מופיע בבחירת המודל** — וודאי ש-`MINIMAX_BASE_URL` ו-`MINIMAX_API_KEY` מוגדרים בשרת (או ב-.env שנטען לפני הפעלת השרת).
