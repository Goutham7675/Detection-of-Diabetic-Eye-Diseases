EyeCare AI — Detection of Diabetic Eye Diseases
=============================================

This repository contains a Flask-based demo application for detecting common eye conditions (cataract, glaucoma, diabetic retinopathy, and normal) from fundus/retina images. The project includes a simple web UI, SQLite database for storing results and users, and CSV backups.

What this repo contains
- `app.py` — Main Flask application.
- `instance/database.db` — SQLite database used by the app (created at runtime).
- `static/uploads/` — Uploaded images and example images used by the demo.
- `data/users.csv`, `data/feedback.csv` — CSV backups for users and feedback.
- `eye_disease_model.pth` — Model file (the app uses a placeholder when PyTorch is not installed).
- `requirements.txt` — Python dependencies.

Quick start (Windows PowerShell)
1. Create and activate a virtual environment

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install -r requirements.txt
```

2. Start the app (development server)

```powershell
.\.venv\Scripts\Activate.ps1
python app.py
```

The app will run on http://127.0.0.1:5000 by default.

Endpoints and files
- Upload images via the web UI at `/upload` (requires registration/login).
- Detection results are saved in `instance/database.db` in the `detection_result` table and uploaded images are stored under `static/uploads/`.
- `data/users.csv` and `data/feedback.csv` contain CSV backups used by the app.

Notes & troubleshooting
- Model: The repository includes `eye_disease_model.pth`. The current `app.py` is written to work without PyTorch (it uses a placeholder random classifier). If you want to enable the real model, install PyTorch and uncomment the model-loading code in `app.py`. For CPU-only usage, install a CPU build of PyTorch.

- Production: The Flask development server is used for convenience. For production use, deploy via a WSGI server (Gunicorn/Waitress) and disable debug mode.

- Static file 404s: If you see missing CSS/JS, confirm that `static/` and `templates/` folders are in the repo root and paths in templates reference `url_for('static', filename='...')` where appropriate.

- Database and secrets: `app.py` currently generates a random `SECRET_KEY` at runtime. To persist sessions across restarts, set `SECRET_KEY` in environment variables or a config file.

What I changed
- Added this `README.md` file describing how to run and where results are stored.

If you'd like, I can also:
- Add a `.gitignore` (recommended: ignore `.venv/`, `instance/database.db`, and `uploads/`),
- Commit a small sample `.env.example` for environment variables,
- Enable model loading by adding PyTorch to `requirements.txt` and wiring the model in `app.py`.


License
- This repo does not include an explicit license file. Add one if you want to clarify reuse permissions.
