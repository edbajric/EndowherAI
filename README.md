# EndowerAI

EndowerAI is a student-built full‑stack app for symptom tracking and analytics around Endometriosis and PCOS. It combines a modern web UI with a small ML backend to explore how longitudinal symptom data could support earlier pattern recognition and better self‑tracking.

> This is a graduation project, not a medical product. It does not provide diagnosis or treatment and is not a substitute for professional medical care.

---

## What it does

- Lets users log symptoms, lifestyle factors, and cycle events over time.
- Shows simple visualizations and summaries of their logs.
- Sends data to a FastAPI backend that runs ML models and explainability tools to highlight which features influence predictions.
- Provides an “AI assistant” interface that can answer questions about a user’s tracked data using an LLM API (e.g. OpenAI / Grok / HF).

---

## Tech Stack

**Frontend**

- Next.js (App Router) with TypeScript
- Tailwind CSS
- Supabase Auth (JWT) integration from the client

**Backend**

- FastAPI (Python) for REST endpoints
- Pydantic for request/response validation
- Supabase (PostgreSQL) as the main database
- JWT verification against Supabase in the backend

**Machine Learning & Analytics**

- scikit‑learn, pandas, numpy
- Models: Random Forest, AdaBoost, stacking ensembles
- Imbalance handling: SMOTE / SMOTE‑ENN
- Explainability: SHAP and LIME
- Feature selection: BorutaShap, RFE
- Cross‑validation: Repeated Stratified K‑Fold
- Privacy: pseudonymous UUID‑based user IDs instead of direct PII

---

## Repository Structure

```text
EndowherAI/
├─ frontend/           # Next.js app (patient dashboard & chat UI)
├─ backend/            # FastAPI app (ML inference + agents)
├─ machine-learning/   # Notebooks, models, and data (research area)
├─ supabase/           # DB schema & migrations
└─ DEVELOPMENT.md      # Detailed setup & run instructions
```

For how to run the frontend and backend locally (Node/Python commands, venv, etc.), see **DEVELOPMENT.md**.

---

## Status

- Project type: Bachelor graduation project (team)
- Focus: Learning to design a “real” health‑tech style architecture with reasonable privacy and ML practices, not shipping a production medical device.
- Future ideas: better evaluation on real clinical datasets, mobile‑first UX, and more robust monitoring/alerting for the ML side.