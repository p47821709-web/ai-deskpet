def test_list_pets(client):
    response = client.get("/api/v1/pets")
    assert response.status_code == 200
