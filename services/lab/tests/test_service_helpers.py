import asyncio

import httpx
import pytest

import main


class FakeResponse:
    def __init__(self, status_code, json_data=None, text=""):
        self.status_code = status_code
        self._json_data = json_data or {}
        self.text = text

    def json(self):
        return self._json_data


class FakeAsyncClient:
    """Stands in for httpx.AsyncClient so we can exercise main.py's
    verify_*/notify_lab_event helpers directly, without the mocking used
    in test_main.py that bypasses their bodies entirely."""

    def __init__(self, get_result=None, post_result=None, raise_exc=None):
        self._get_result = get_result
        self._post_result = post_result
        self._raise_exc = raise_exc

    async def __aenter__(self):
        return self

    async def __aexit__(self, *args):
        return False

    async def get(self, *args, **kwargs):
        if self._raise_exc:
            raise self._raise_exc
        return self._get_result

    async def post(self, *args, **kwargs):
        if self._raise_exc:
            raise self._raise_exc
        return self._post_result


def make_client_factory(**kwargs):
    def factory(*args, **_kwargs):
        return FakeAsyncClient(**kwargs)
    return factory


# ============ verify_patient_exists ============

def test_verify_patient_exists_true(monkeypatch):
    monkeypatch.setattr(httpx, "AsyncClient", make_client_factory(get_result=FakeResponse(200)))
    assert asyncio.run(main.verify_patient_exists(1)) is True


def test_verify_patient_exists_404(monkeypatch):
    monkeypatch.setattr(httpx, "AsyncClient", make_client_factory(get_result=FakeResponse(404)))
    assert asyncio.run(main.verify_patient_exists(1)) is False


def test_verify_patient_exists_unexpected_status(monkeypatch):
    monkeypatch.setattr(httpx, "AsyncClient", make_client_factory(get_result=FakeResponse(500)))
    assert asyncio.run(main.verify_patient_exists(1)) is False


def test_verify_patient_exists_connect_error(monkeypatch):
    monkeypatch.setattr(
        httpx, "AsyncClient",
        make_client_factory(raise_exc=httpx.ConnectError("down")),
    )
    with pytest.raises(main.HTTPException) as exc_info:
        asyncio.run(main.verify_patient_exists(1))
    assert exc_info.value.status_code == 503


def test_verify_patient_exists_unexpected_exception(monkeypatch):
    monkeypatch.setattr(
        httpx, "AsyncClient",
        make_client_factory(raise_exc=ValueError("boom")),
    )
    with pytest.raises(main.HTTPException) as exc_info:
        asyncio.run(main.verify_patient_exists(1))
    assert exc_info.value.status_code == 500


# ============ verify_doctor_exists ============

def test_verify_doctor_exists_true(monkeypatch):
    monkeypatch.setattr(
        httpx, "AsyncClient",
        make_client_factory(get_result=FakeResponse(200, {"exists": True})),
    )
    assert asyncio.run(main.verify_doctor_exists(1)) is True


def test_verify_doctor_exists_false_when_flag_false(monkeypatch):
    monkeypatch.setattr(
        httpx, "AsyncClient",
        make_client_factory(get_result=FakeResponse(200, {"exists": False})),
    )
    assert asyncio.run(main.verify_doctor_exists(1)) is False


def test_verify_doctor_exists_unexpected_status(monkeypatch):
    monkeypatch.setattr(httpx, "AsyncClient", make_client_factory(get_result=FakeResponse(500)))
    assert asyncio.run(main.verify_doctor_exists(1)) is False


def test_verify_doctor_exists_connect_error(monkeypatch):
    monkeypatch.setattr(
        httpx, "AsyncClient",
        make_client_factory(raise_exc=httpx.ConnectError("down")),
    )
    with pytest.raises(main.HTTPException) as exc_info:
        asyncio.run(main.verify_doctor_exists(1))
    assert exc_info.value.status_code == 503


def test_verify_doctor_exists_unexpected_exception(monkeypatch):
    monkeypatch.setattr(
        httpx, "AsyncClient",
        make_client_factory(raise_exc=ValueError("boom")),
    )
    with pytest.raises(main.HTTPException) as exc_info:
        asyncio.run(main.verify_doctor_exists(1))
    assert exc_info.value.status_code == 500


# ============ verify_referral_exists ============

def test_verify_referral_exists_true(monkeypatch):
    monkeypatch.setattr(httpx, "AsyncClient", make_client_factory(get_result=FakeResponse(200)))
    assert asyncio.run(main.verify_referral_exists(1)) is True


def test_verify_referral_exists_404(monkeypatch):
    monkeypatch.setattr(httpx, "AsyncClient", make_client_factory(get_result=FakeResponse(404)))
    assert asyncio.run(main.verify_referral_exists(1)) is False


def test_verify_referral_exists_unexpected_status(monkeypatch):
    monkeypatch.setattr(httpx, "AsyncClient", make_client_factory(get_result=FakeResponse(500)))
    assert asyncio.run(main.verify_referral_exists(1)) is False


def test_verify_referral_exists_connect_error(monkeypatch):
    monkeypatch.setattr(
        httpx, "AsyncClient",
        make_client_factory(raise_exc=httpx.ConnectError("down")),
    )
    with pytest.raises(main.HTTPException) as exc_info:
        asyncio.run(main.verify_referral_exists(1))
    assert exc_info.value.status_code == 503


def test_verify_referral_exists_unexpected_exception(monkeypatch):
    monkeypatch.setattr(
        httpx, "AsyncClient",
        make_client_factory(raise_exc=ValueError("boom")),
    )
    with pytest.raises(main.HTTPException) as exc_info:
        asyncio.run(main.verify_referral_exists(1))
    assert exc_info.value.status_code == 500


# ============ notify_lab_event ============

def test_notify_lab_event_success(monkeypatch):
    monkeypatch.setattr(httpx, "AsyncClient", make_client_factory(post_result=FakeResponse(201)))
    assert asyncio.run(main.notify_lab_event("lab_order_created", 1, "hello")) is True


def test_notify_lab_event_rejected_by_service(monkeypatch):
    monkeypatch.setattr(
        httpx, "AsyncClient",
        make_client_factory(post_result=FakeResponse(400, text="bad request")),
    )
    assert asyncio.run(main.notify_lab_event("lab_order_created", 1, "hello")) is False


def test_notify_lab_event_swallows_exceptions(monkeypatch):
    monkeypatch.setattr(
        httpx, "AsyncClient",
        make_client_factory(raise_exc=RuntimeError("network down")),
    )
    assert asyncio.run(main.notify_lab_event("lab_order_created", 1, "hello")) is False
