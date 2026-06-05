def test_memories(client):
    response = client.get("/api/v1/memories?pet_id=test")
    assert response.status_code == 200
