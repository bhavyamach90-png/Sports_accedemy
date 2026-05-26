import json
import os
import sqlite3
from datetime import datetime, timezone
from pathlib import Path

from flask import Flask, jsonify, render_template, request

BASE_DIR = Path(__file__).resolve().parent

# Support correct folders (templates/, static/, data/) OR flat GitHub upload
if (BASE_DIR / "templates" / "index.html").exists():
    TEMPLATE_DIR = BASE_DIR / "templates"
    STATIC_DIR = BASE_DIR / "static"
    SPORTS_JSON = BASE_DIR / "data" / "sports.json"
    DB_PATH = BASE_DIR / "data" / "registrations.db"
else:
    TEMPLATE_DIR = BASE_DIR
    STATIC_DIR = BASE_DIR
    SPORTS_JSON = BASE_DIR / "sports.json"
    DB_PATH = BASE_DIR / "registrations.db"

DATA_DIR = DB_PATH.parent
DATA_DIR.mkdir(parents=True, exist_ok=True)

app = Flask(
    __name__,
    template_folder=str(TEMPLATE_DIR),
    static_folder=str(STATIC_DIR),
)
app.secret_key = os.environ.get("SECRET_KEY", "change-me-in-production-use-env-var")


def load_sports():
    if not SPORTS_JSON.exists():
        raise FileNotFoundError(f"Sports data not found: {SPORTS_JSON}")
    with open(SPORTS_JSON, encoding="utf-8") as f:
        return json.load(f)


def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    with get_db() as conn:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS registrations (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                created_at TEXT NOT NULL,
                full_name TEXT NOT NULL,
                email TEXT NOT NULL,
                phone TEXT NOT NULL,
                age INTEGER,
                sport_id TEXT NOT NULL,
                sport_name TEXT NOT NULL,
                timing_slot TEXT NOT NULL,
                fee_plan TEXT NOT NULL,
                notes TEXT
            )
            """
        )


init_db()


@app.route("/health")
def health():
    return jsonify(
        {
            "ok": True,
            "sports_json": str(SPORTS_JSON),
            "templates": str(TEMPLATE_DIR),
        }
    )


@app.route("/")
def index():
    return render_template("index.html", sports=load_sports())


@app.route("/api/sports")
def api_sports():
    return jsonify(load_sports())


@app.route("/api/register", methods=["POST"])
def register():
    data = request.get_json(silent=True) or request.form
    required = ("full_name", "email", "phone", "sport_id", "timing_slot", "fee_plan")
    missing = [f for f in required if not (data.get(f) or "").strip()]
    if missing:
        return jsonify({"ok": False, "error": f"Missing fields: {', '.join(missing)}"}), 400

    sports = {s["id"]: s for s in load_sports()}
    sport_id = data["sport_id"].strip()
    sport = sports.get(sport_id)
    if not sport:
        return jsonify({"ok": False, "error": "Invalid sport selected"}), 400

    age_raw = (data.get("age") or "").strip()
    age = int(age_raw) if age_raw.isdigit() else None

    with get_db() as conn:
        conn.execute(
            """
            INSERT INTO registrations
            (created_at, full_name, email, phone, age, sport_id, sport_name,
             timing_slot, fee_plan, notes)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                datetime.now(timezone.utc).isoformat(timespec="seconds"),
                data["full_name"].strip(),
                data["email"].strip(),
                data["phone"].strip(),
                age,
                sport_id,
                sport["name"],
                data["timing_slot"].strip(),
                data["fee_plan"].strip(),
                (data.get("notes") or "").strip() or None,
            ),
        )

    return jsonify(
        {
            "ok": True,
            "message": f"Registration received for {sport['name']}. We will contact you shortly.",
        }
    )


@app.route("/admin")
def admin_redirect():
    return admin_registrations()


@app.route("/admin/registrations")
def admin_registrations():
    with get_db() as conn:
        rows = conn.execute(
            "SELECT * FROM registrations ORDER BY id DESC LIMIT 200"
        ).fetchall()
    return render_template("admin.html", registrations=rows)


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5050))
    app.run(debug=True, host="127.0.0.1", port=port)
