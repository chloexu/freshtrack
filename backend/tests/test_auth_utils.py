import os
os.environ.setdefault("DATABASE_URL", "postgresql://freshtrack:freshtrack@localhost:5432/test_freshtrack")
os.environ.setdefault("JWT_SECRET", "test-secret")

from app.auth import hash_password, verify_password, create_token


def test_hash_and_verify():
    hashed = hash_password("mypassword")
    assert hashed != "mypassword"
    assert verify_password("mypassword", hashed)


def test_wrong_password_fails():
    hashed = hash_password("correct")
    assert not verify_password("wrong", hashed)


def test_create_token_returns_string():
    token = create_token("some-user-id")
    assert isinstance(token, str)
    assert len(token) > 20
