import os

import httpx

DOCTORS_SERVICE_URL = os.environ.get("DOCTORS_SERVICE_URL", "http://localhost:8002")
NOTIFICATION_SERVICE_URL = os.environ.get("NOTIFICATION_SERVICE_URL", "http://localhost:8005")

_client = httpx.AsyncClient(timeout=5.0)


async def doctor_exists(doctor_id: int) -> bool:
    try:
        resp = await _client.get(f"{DOCTORS_SERVICE_URL}/doctors/{doctor_id}/exists")
        resp.raise_for_status()
    except httpx.HTTPError as exc:
        raise UpstreamUnavailable(f"Doctors Service unavailable: {exc}") from exc
    return resp.json()["exists"]


async def record_notification(referral_id: int, event_type: str, message: str) -> None:
    try:
        resp = await _client.post(
            f"{NOTIFICATION_SERVICE_URL}/notifications",
            json={"ReferralId": referral_id, "EventType": event_type, "Message": message},
        )
        resp.raise_for_status()
    except httpx.HTTPError as exc:
        # Logged, not raised: a notification-logging failure should not roll
        # back a referral status transition that has already been committed.
        print(f"[referral] WARNING: failed to record notification for referral {referral_id}: {exc}")


class UpstreamUnavailable(Exception):
    pass
