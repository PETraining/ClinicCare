import httpx
import logging
from typing import Optional, Dict, Any

logger = logging.getLogger(__name__)

# Service URLs (can be overridden via environment variables)
PATIENT_SERVICE_URL = "http://patient-service:8001"
NOTIFICATION_SERVICE_URL = "http://notification-service:8005"


async def update_patient_medication(
    patient_id: int,
    medication_data: Dict[str, Any],
    timeout: float = 5.0,
) -> bool:
    """
    Update patient's medication list after dispensing.

    Args:
        patient_id: Patient ID
        medication_data: Medication data to add/update (Name, Dosage, Active, etc.)
        timeout: Request timeout in seconds

    Returns:
        True if successful, False if failed (logs error but doesn't raise)
    """
    try:
        async with httpx.AsyncClient(timeout=timeout) as client:
            url = f"{PATIENT_SERVICE_URL}/patients/{patient_id}/medications"
            response = await client.post(url, json=medication_data)

            if response.status_code in (200, 201):
                logger.info(f"Successfully updated medication for patient {patient_id}")
                return True
            else:
                logger.warning(
                    f"Failed to update patient medication: "
                    f"Status {response.status_code}, Response: {response.text}"
                )
                return False
    except httpx.TimeoutException:
        logger.warning(
            f"Timeout updating patient medication for patient {patient_id} "
            f"(Patient service may be slow or unavailable)"
        )
        return False
    except Exception as e:
        logger.warning(
            f"Error updating patient medication for patient {patient_id}: {str(e)} "
            f"(Continuing anyway - prescription recorded locally)"
        )
        return False


async def record_notification(
    referral_id: int,
    event_type: str,
    message: str,
    timeout: float = 5.0,
) -> bool:
    """
    Record notification event in notification service (optional).

    Args:
        referral_id: Referral ID for the notification
        event_type: Type of event (e.g., "PrescriptionDispensed")
        message: Event message
        timeout: Request timeout in seconds

    Returns:
        True if successful, False if failed (logs warning but doesn't raise)
    """
    try:
        async with httpx.AsyncClient(timeout=timeout) as client:
            url = f"{NOTIFICATION_SERVICE_URL}/notifications"
            payload = {
                "ReferralId": referral_id,
                "EventType": event_type,
                "Message": message,
            }
            response = await client.post(url, json=payload)

            if response.status_code in (200, 201):
                logger.info(f"Successfully recorded notification for referral {referral_id}")
                return True
            else:
                logger.warning(
                    f"Failed to record notification: "
                    f"Status {response.status_code}, Response: {response.text}"
                )
                return False
    except Exception as e:
        logger.warning(f"Error recording notification: {str(e)} (Continuing anyway)")
        return False
