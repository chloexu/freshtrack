def test_register_returns_token(client):
    res = client.post("/auth/register", json={"email": "a@test.com", "password": "pass123"})
    assert res.status_code == 200
    data = res.json()
    assert "token" in data
    assert isinstance(data["token"], str)


def test_register_duplicate_email_returns_409(client):
    client.post("/auth/register", json={"email": "a@test.com", "password": "pass123"})
    res = client.post("/auth/register", json={"email": "a@test.com", "password": "other"})
    assert res.status_code == 409


def test_login_returns_token(client):
    client.post("/auth/register", json={"email": "a@test.com", "password": "pass123"})
    res = client.post("/auth/login", json={"email": "a@test.com", "password": "pass123"})
    assert res.status_code == 200
    assert "token" in res.json()


def test_login_wrong_password_returns_401(client):
    client.post("/auth/register", json={"email": "a@test.com", "password": "pass123"})
    res = client.post("/auth/login", json={"email": "a@test.com", "password": "wrong"})
    assert res.status_code == 401


def test_login_unknown_email_returns_401(client):
    res = client.post("/auth/login", json={"email": "nobody@test.com", "password": "x"})
    assert res.status_code == 401
