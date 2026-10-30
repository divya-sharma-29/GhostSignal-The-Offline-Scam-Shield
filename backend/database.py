"""Small SQLite store for privacy-minimized scan metadata."""
from __future__ import annotations

import sqlite3
from contextlib import contextmanager

from backend.config import DATABASE_FILE, DATA_DIR


@contextmanager
def connect():
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    connection = sqlite3.connect(DATABASE_FILE, timeout=5)
    connection.row_factory = sqlite3.Row
    try:
        connection.execute("PRAGMA journal_mode=WAL")
        yield connection
        connection.commit()
    finally:
        connection.close()


def initialize() -> None:
    with connect() as db:
        db.execute("""CREATE TABLE IF NOT EXISTS scans (
            id TEXT PRIMARY KEY, scan_type TEXT NOT NULL, risk_level TEXT NOT NULL,
            risk_score INTEGER NOT NULL, timestamp TEXT NOT NULL,
            rule_version TEXT NOT NULL, ai_model_version TEXT
        )""")


def save_scan(item: dict) -> None:
    with connect() as db:
        db.execute("INSERT OR REPLACE INTO scans VALUES (?, ?, ?, ?, ?, ?, ?)", (
            item["id"], item["scan_type"], item["risk_level"], item["risk_score"],
            item["timestamp"], item["rule_version"], item.get("ai_model_version"),
        ))


def list_scans(limit: int = 100) -> list[dict]:
    with connect() as db:
        rows = db.execute("SELECT * FROM scans ORDER BY timestamp DESC LIMIT ?", (limit,)).fetchall()
        return [dict(row) for row in rows]


def clear_scans() -> int:
    with connect() as db:
        cursor = db.execute("DELETE FROM scans")
        return cursor.rowcount

