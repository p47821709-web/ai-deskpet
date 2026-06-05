def test_generation(client):
    response = client.post("/api/v1/generations/create", json={"file_url": "test"})
    assert response.status_code == 200
