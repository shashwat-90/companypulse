# CompanyPulse — Company Statistics Dashboard

A beginner-friendly full-stack dashboard built with **React + Vite**, **Python Flask**, and **SQLite**.

## Features
- Bright, responsive dashboard UI
- KPI cards: revenue, orders, active customers, employees
- Monthly revenue chart and employee-by-department chart
- Recent orders table
- Date filters for analytics
- Flask REST API backed by SQLite
- Sample data seeding
- Basic API tests with pytest
- Clear error/loading states in the frontend

> All records are fictional demo data. Revenue is calculated from completed orders only.

## Project structure
```text
companypulse/
├── backend/
│   ├── app.py
│   ├── seed.py
│   ├── requirements.txt
│   └── tests/
│       └── test_api.py
├── frontend/
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   └── src/
│       ├── main.jsx
│       ├── App.jsx
│       ├── api.js
│       └── styles.css
├── .gitignore
└── README.md
```

## Requirements
- Python 3.10+
- Node.js 18+
- npm

## 1. Run the backend

Open a terminal in `companypulse/backend`:

### Windows PowerShell
```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python seed.py
python app.py
```

### macOS/Linux
```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python seed.py
python app.py
```

The backend runs at `http://127.0.0.1:5000`.

Check it in a browser:
- `http://127.0.0.1:5000/api/health`
- `http://127.0.0.1:5000/api/dashboard/summary`

The SQLite database `companypulse.db` is created inside `backend/`.

## 2. Run the frontend

Open a second terminal in `companypulse/frontend`:

```bash
npm install
npm run dev
```

Open the local URL shown by Vite (usually `http://localhost:5173`).

## 3. Run backend tests

With the backend virtual environment active, from `companypulse/backend`:

```bash
pytest
```

## API endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/health` | Check backend status |
| GET | `/api/dashboard/summary` | KPI totals |
| GET | `/api/analytics/revenue?start_date=2026-01-01&end_date=2026-12-31` | Monthly completed-order revenue |
| GET | `/api/analytics/employees` | Employee count by department |
| GET | `/api/departments` | List departments |
| GET | `/api/employees` | List employees |
| POST | `/api/employees` | Add an employee |
| GET | `/api/orders?limit=8` | Recent orders |
| GET | `/api/reports/orders.csv` | Download order report |

## Example request

```http
GET http://127.0.0.1:5000/api/dashboard/summary
```

Example response:
```json
{
  "total_revenue": 485000.0,
  "total_orders": 320,
  "active_customers": 215,
  "active_employees": 48,
  "currency": "INR"
}
```

The actual values come from the seeded demo database and may differ from this illustrative response.

## Beginner-friendly architecture

1. React displays the dashboard.
2. React calls Flask endpoints using `fetch`.
3. Flask validates the request and runs database queries.
4. SQLite stores employees, departments, customers and orders.
5. Flask sends JSON back to React, and React updates the charts/cards.

## Interview talking points
- Why Flask? It is lightweight and easy to understand for a small REST API.
- Why SQLite? It is simple to run locally and requires no separate database server.
- Why separate frontend and backend? The UI and data logic have clear responsibilities.
- How is revenue calculated? It sums completed orders only.
- What would you improve next? Add login/roles, migrate to PostgreSQL, improve test coverage, and deploy the app.

## Notes
- This is a learning/portfolio starter, not a production system.
- The employee creation endpoint is a simple demo endpoint; authentication and authorization are not included.
- Keep secrets out of source control. No API keys are needed for this project.
