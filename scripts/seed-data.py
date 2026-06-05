import sqlite3
import uuid
from datetime import datetime

conn = sqlite3.connect('data/deskpet.db')
cursor = conn.cursor()

cursor.execute('''
INSERT OR IGNORE INTO users (id, device_id, nickname, created_at)
VALUES (?, ?, ?, ?)
''', (str(uuid.uuid4()), 'default-device', '新用户', datetime.now().isoformat()))

conn.commit()
conn.close()
print('Seed data inserted successfully')
