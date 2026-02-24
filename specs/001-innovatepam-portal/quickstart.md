# Quickstart: InnovatEPAM Portal

## Prerequisites
- Node.js 20+
- npm 10+

## 1) Install dependencies
```bash
npm install
```

## 2) Configure environment
Create environment files for backend/frontend (example keys):
- Backend:
  - `PORT`
  - `DATABASE_PATH` (e.g., `./data/app.db`)
  - `UPLOAD_DIR` (e.g., `./backend/uploads`)
  - `JWT_SECRET`
  - `ALLOWED_EMAIL_DOMAINS` (comma-separated)
- Frontend:
  - `VITE_API_BASE_URL`

## 3) Initialize storage
- Ensure SQLite DB path exists.
- Ensure uploads directory exists:
```bash
mkdir -p backend/uploads
```

## 4) Run in development
```bash
npm run dev
```
Expected:
- Backend API starts (Express).
- Frontend starts (Vite).

## 5) TDD-first workflow
For each story, write tests first and confirm they fail before implementation.

## 6) Run tests
```bash
npm run test:unit
npm run test:integration
npm run test:e2e
```

## 7) Validate core flows
1. Register with approved corporate domain email.
2. Login and logout.
3. Submit idea with optional file (PDF/DOCX/PPTX/PNG/JPG, <=10 MB).
4. Verify submitter private listing default and optional sharing.
5. Login as evaluator/admin, move status to `Under Review`, then `Accepted/Rejected` with comment.
6. Validate stale update receives refresh/retry response.

## 8) Coverage gate
```bash
npm run test:coverage
```
Ensure changed production code remains >=80% line coverage.
