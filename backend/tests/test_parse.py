import json
from unittest.mock import MagicMock, patch

from openai import APIError, RateLimitError


def _register(client, email="parser@test.com", password="pass"):
    res = client.post("/auth/register", json={"email": email, "password": password})
    return res.json()["token"]


def _headers(token):
    return {"Authorization": f"Bearer {token}"}


def _mock_openai_response(content: str) -> MagicMock:
    mock_response = MagicMock()
    mock_response.choices[0].message.content = content
    return mock_response


VALID_GPT_RESPONSE = json.dumps({
    "items": [
        {
            "name": "Strawberries",
            "quantity": "1 pint",
            "predicted_expiry_days": 5,
            "confidence": "high",
        },
        {
            "name": "Whole Milk",
            "quantity": "1 gallon",
            "predicted_expiry_days": 14,
            "confidence": "high",
        },
    ],
    "parse_notes": None,
})


def test_parse_receipt_happy_path(client):
    token = _register(client)
    mock_resp = _mock_openai_response(VALID_GPT_RESPONSE)

    with patch("app.routers.parse.client.chat.completions.create", return_value=mock_resp):
        res = client.post(
            "/parse/receipt",
            json={"image_base64": "ZmFrZWltYWdl"},
            headers=_headers(token),
        )

    assert res.status_code == 200
    data = res.json()
    assert len(data["items"]) == 2
    assert data["items"][0]["name"] == "Strawberries"
    assert data["items"][0]["predicted_expiry_days"] == 5
    assert data["items"][0]["confidence"] == "high"
    assert data["parse_notes"] is None


def test_parse_receipt_empty_base64_returns_400(client):
    token = _register(client)
    res = client.post(
        "/parse/receipt",
        json={"image_base64": ""},
        headers=_headers(token),
    )
    assert res.status_code == 400


def test_parse_receipt_openai_failure_returns_502(client):
    token = _register(client)
    api_error = APIError(
        message="upstream error",
        request=MagicMock(),
        body={},
    )
    with patch("app.routers.parse.client.chat.completions.create", side_effect=api_error):
        res = client.post(
            "/parse/receipt",
            json={"image_base64": "ZmFrZWltYWdl"},
            headers=_headers(token),
        )
    assert res.status_code == 502
    assert "parse" in res.json()["detail"].lower()


def test_parse_receipt_rate_limit_returns_429(client):
    token = _register(client)
    with patch(
        "app.routers.parse.client.chat.completions.create",
        side_effect=RateLimitError(
            message="rate limit",
            response=MagicMock(),
            body={},
        ),
    ):
        res = client.post(
            "/parse/receipt",
            json={"image_base64": "ZmFrZWltYWdl"},
            headers=_headers(token),
        )
    assert res.status_code == 429


def test_parse_receipt_malformed_json_returns_422(client):
    token = _register(client)
    mock_resp = _mock_openai_response("Here are your items: definitely not JSON")

    with patch("app.routers.parse.client.chat.completions.create", return_value=mock_resp):
        res = client.post(
            "/parse/receipt",
            json={"image_base64": "ZmFrZWltYWdl"},
            headers=_headers(token),
        )
    assert res.status_code == 422


def test_parse_receipt_requires_auth(client):
    res = client.post("/parse/receipt", json={"image_base64": "ZmFrZWltYWdl"})
    assert res.status_code == 403


def test_parse_receipt_invalid_schema_returns_422(client):
    """Valid JSON but missing required fields — Pydantic validation should fail."""
    token = _register(client, email="schema@test.com")
    mock_resp = _mock_openai_response(
        json.dumps({"items": [{"name": "Milk"}], "parse_notes": None})
    )

    with patch("app.routers.parse.client.chat.completions.create", return_value=mock_resp):
        res = client.post(
            "/parse/receipt",
            json={"image_base64": "ZmFrZWltYWdl"},
            headers=_headers(token),
        )
    assert res.status_code == 422
