def _register(client, email="user@test.com", password="pass"):
    res = client.post("/auth/register", json={"email": email, "password": password})
    return res.json()["token"]


def _headers(token):
    return {"Authorization": f"Bearer {token}"}


def _item_payload(name="Apples", qty="6", days_from_now=7):
    return {
        "items": [{
            "name": name,
            "quantity": qty,
            "purchase_date": "2026-05-03",
            "predicted_expiry": "2026-05-10",
        }]
    }


def test_get_items_empty(client):
    token = _register(client)
    res = client.get("/items", headers=_headers(token))
    assert res.status_code == 200
    assert res.json() == []


def test_create_items(client):
    token = _register(client)
    res = client.post("/items", headers=_headers(token), json=_item_payload())
    assert res.status_code == 200
    assert len(res.json()) == 1
    item = res.json()[0]
    assert item["name"] == "Apples"
    assert item["status"] == "in_fridge"
    assert "id" in item


def test_created_items_appear_in_get(client):
    token = _register(client)
    client.post("/items", headers=_headers(token), json=_item_payload())
    res = client.get("/items", headers=_headers(token))
    assert len(res.json()) == 1
    assert res.json()[0]["name"] == "Apples"


def test_patch_status_consumed(client):
    token = _register(client)
    item_id = client.post("/items", headers=_headers(token), json=_item_payload()).json()[0]["id"]
    res = client.patch(f"/items/{item_id}", headers=_headers(token), json={"status": "consumed"})
    assert res.status_code == 200
    assert res.json()["status"] == "consumed"
    assert res.json()["status_at"] is not None


def test_consumed_item_hidden_from_get(client):
    token = _register(client)
    item_id = client.post("/items", headers=_headers(token), json=_item_payload()).json()[0]["id"]
    client.patch(f"/items/{item_id}", headers=_headers(token), json={"status": "consumed"})
    res = client.get("/items", headers=_headers(token))
    assert res.json() == []


def test_delete_item(client):
    token = _register(client)
    item_id = client.post("/items", headers=_headers(token), json=_item_payload()).json()[0]["id"]
    res = client.delete(f"/items/{item_id}", headers=_headers(token))
    assert res.status_code == 204
    assert client.get("/items", headers=_headers(token)).json() == []


def test_items_isolated_between_users(client):
    token1 = _register(client, "u1@test.com")
    token2 = _register(client, "u2@test.com")
    client.post("/items", headers=_headers(token1), json=_item_payload())
    res = client.get("/items", headers=_headers(token2))
    assert res.json() == []


def test_get_items_requires_auth(client):
    res = client.get("/items")
    assert res.status_code == 403


def test_patch_other_users_item_returns_404(client):
    token1 = _register(client, "u1@test.com")
    token2 = _register(client, "u2@test.com")
    item_id = client.post("/items", headers=_headers(token1), json=_item_payload()).json()[0]["id"]
    res = client.patch(f"/items/{item_id}", headers=_headers(token2), json={"status": "consumed"})
    assert res.status_code == 404
