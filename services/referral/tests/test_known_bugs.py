"""Regression tests for defects already identified in validationresult.md and
teamupdates/insurance-authorization/plan.md ("Defects Found & Fixed").

Each test encodes the CORRECT behavior per the feature's own spec/checklist,
not what the code currently does — so these are expected to FAIL (xfail)
until the underlying defect is actually fixed. `strict=True` means the suite
will loudly tell you (an "XPASS" failure) the moment someone fixes the bug,
so the marker doesn't quietly go stale — remove it as part of that fix.

Do not "fix" these tests by loosening the assertion to match current
behavior; that defeats their purpose.
"""

import pytest


@pytest.mark.xfail(
    strict=True,
    reason=(
        "services/referral/main.py `_transition()` (used by both /submit and /accept) "
        "never inspects the referral's own Authorization row. plan.md's "
        "'Defects Found & Fixed' note for canAccept() explicitly flags this as "
        "'enforced client-side only ... the /referrals/{id}/accept endpoint does not "
        "itself validate authorization status.' This test will start passing once "
        "server-side enforcement is added."
    ),
)
def test_accept_blocked_when_own_authorization_is_denied(client, make_referral):
    referral = make_referral(status="Submitted", authorization_status="Denied")

    resp = client.patch(f"/referrals/{referral.ReferralId}/accept")

    assert resp.status_code in (400, 409), (
        "Accept should be rejected server-side when the referral's own authorization "
        f"is Denied (mirrors the frontend's canAccept() guard), got {resp.status_code}: {resp.text}"
    )


@pytest.mark.xfail(
    strict=True,
    reason=(
        "Same gap as accept: the frontend's canSubmit() blocks submitting a referral "
        "whose own authorization is Denied, but the PATCH /submit endpoint applies no "
        "such check server-side."
    ),
)
def test_submit_blocked_when_own_authorization_is_denied(client, make_referral):
    referral = make_referral(status="Draft", authorization_status="Denied")

    resp = client.patch(f"/referrals/{referral.ReferralId}/submit")

    assert resp.status_code in (400, 409), (
        f"Submit should be rejected when authorization is Denied, got {resp.status_code}: {resp.text}"
    )


@pytest.mark.xfail(
    strict=True,
    reason=(
        "validationresult.md 'PARTIAL: Notification Event Payload Missing old_status' — "
        "record_authorization_notification (services/referral/clients.py:33-38) only ever "
        "receives the NEW status, so old_status can never appear in the notification payload "
        "no matter what the previous status was."
    ),
)
def test_authorization_change_notification_includes_old_status(client, make_referral, notification_log):
    referral = make_referral(status="Submitted", authorization_status="Pending")

    resp = client.put(
        f"/referrals/{referral.ReferralId}/authorization",
        json={"Status": "Denied", "DecisionNotes": "insufficient documentation"},
    )
    assert resp.status_code == 200

    change_events = [n for n in notification_log if n["EventType"] == "AuthorizationUpdated"]
    assert change_events, "expected an AuthorizationUpdated notification to be recorded"
    assert "Pending" in change_events[-1]["Message"], (
        "notification payload should surface the prior status (old_status) alongside the "
        f"new one, got: {change_events[-1]}"
    )
