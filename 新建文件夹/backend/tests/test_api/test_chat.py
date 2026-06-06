def test_chat(client):
    response = client.post("/api/v1/chat/sessions", json={"pet_id": "test"})
    assert response.status_code == 200
