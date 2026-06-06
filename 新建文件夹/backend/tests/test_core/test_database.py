def test_database():
    from app.core.database import engine
    assert engine is not None
