import os
import logging

import httpx

logger = logging.getLogger(__name__)

DOCTORS_SERVICE_URL = os.environ.get("DOCTORS_SERVICE_URL", "http://localhost:8002")
NOTIFICATION_SERVICE_URL = os.environ.get("NOTIFICATION_SERVICE_URL", "http://localhost:8005")
PHARMACY_SERVICE_URL = os.environ.get("PHARMACY_SERVICE_URL", "http://localhost:8006")

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


async def create_prescription_from_referral(
    referral_id: int,
    patient_id: int,
    prescribing_doctor_id: int,
    medications: list = None,
) -> None:
    """
    Create a prescription in pharmacy service when referral is accepted.

    This is a fire-and-forget call: failures are logged but don't rollback the referral.
    """
    if medications is None:
        medications = []

    try:
        prescription_payload = {
            "ReferralId": referral_id,
            "PatientId": patient_id,
            "PrescribingDoctorId": prescribing_doctor_id,
            "Medications": medications,
        }
        resp = await _client.post(
            f"{PHARMACY_SERVICE_URL}/prescriptions",
            json=prescription_payload,
        )
        resp.raise_for_status()
        logger.info(f"Successfully created prescription for referral {referral_id}")
    except httpx.HTTPError as exc:
        # Logged, not raised: a pharmacy failure should not rollback a referral acceptance
        logger.warning(
            f"[referral] WARNING: failed to create prescription for referral {referral_id}: {exc} "
            f"(Continuing anyway - referral accepted locally)"
        )


class UpstreamUnavailable(Exception):
    pass
