from datetime import datetime


def date_subdir() -> str:
    '''Return a date-based subdirectory path like "2026/06".'''
    now = datetime.now()
    return f'{now.year}/{now.month:02d}'