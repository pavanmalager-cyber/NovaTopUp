# NovaTopUp Player Verification API

Render Web Service: Root Directory `backend`; Build `pip install -r requirements.txt`; Start `gunicorn app:app`; Environment variable `FREEFIRE_API_KEY` = your private provider key.

After deployment, set `window.NOVATOPUP_API_BASE` in the frontend to the backend URL. Never put the provider key in frontend files.
