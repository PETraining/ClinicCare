"""Baseline coverage for the Authorization endpoints (services/referral/main.py:152-199).

These lock in the behavior validationresult.md already marked PASS, so a future
change can't silently regress the parts of this feature that work today.
"""


def test_create_authorization_success(client, make_referral):
    referral = make_referral(status="Submitted")

    resp = client.post(
        f"/referrals/{referral.ReferralId}/authorization",
        json={"Status": "Pending", "DecisionNotes": None},
    )

    assert resp.status_code == 201
    body = resp.json()
    assert body["ReferralId"] == referral.ReferralId
    assert body["Status"] == "Pending"
    assert body["DecisionDate"] is None  # Pending never gets a decision date


def test_create_authorization_sets_decision_date_for_non_pending_status(client, make_referral):
    referral = make_referral(status="Submitted")

    resp = client.post(
        f"/referrals/{referral.ReferralId}/authorization",
        json={"Status": "Approved", "DecisionNotes": "ok"},
    )

    assert resp.status_code == 201
    assert resp.json()["DecisionDate"] is not None


def test_create_authorization_rejects_duplicate(client, make_referral):
    referral = make_referral(status="Submitted", authorization_status="Pending")

    resp = client.post(
        f"/referrals/{referral.ReferralId}/authorization",
        json={"Status": "Approved"},
    )

    assert resp.status_code == 400


def test_create_authorization_404_when_referral_missing(client):
    resp = client.post("/referrals/999999/authorization", json={"Status": "Pending"})
    assert resp.status_code == 404


def test_get_authorization_404_when_none_on_record(client, make_referral):
    referral = make_referral(status="Draft")
    resp = client.get(f"/referrals/{referral.ReferralId}/authorization")
    assert resp.status_code == 404


def test_update_authorization_changes_status_and_notes(client, make_referral):
    referral = make_referral(status="Submitted", authorization_status="Pending")

    resp = client.put(
        f"/referrals/{referral.ReferralId}/authorization",
        json={"Status": "Denied", "DecisionNotes": "insufficient documentation"},
    )

    assert resp.status_code == 200
    body = resp.json()
    assert body["Status"] == "Denied"
    assert body["DecisionNotes"] == "insufficient documentation"
    assert body["DecisionDate"] is not None


def test_update_authorization_404_when_none_exists(client, make_referral):
    referral = make_referral(status="Submitted")
    resp = client.put(
        f"/referrals/{referral.ReferralId}/authorization",
        json={"Status": "Approved"},
    )
    assert resp.status_code == 404
