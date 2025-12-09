import mysql.connector

DB_CONFIG = {
    "host": "aribert.helioho.st",       # ej: aribert.helioho.st
    "user": "aribert_kunnskap1",
    "password": "123456789",
    "database": "aribert_KUNNSKAP"
}

def get_connection():
    return mysql.connector.connect(**DB_CONFIG)
