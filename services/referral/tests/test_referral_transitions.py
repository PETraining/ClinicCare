"""Baseline coverage for the Draft -> Submitted -> Accepted -> Completed /
Rejected state machine (services/referral/main.py:105-140), independent of
authorization state.
"""


def test_submit_moves_draft_to_submitted(client, make_referral):
    referral = make_referral(status="Draft")
    resp = client.patch(f"/referrals/{referral.ReferralId}/submit")
    assert resp.status_code == 200
    assert resp.json()["Status"] == "Submitted"


def test_accept_moves_submitted_to_accepted(client, make_referral):
    referral = make_referral(status="Submitted")
    resp = client.patch(f"/referrals/{referral.ReferralId}/accept")
    assert resp.status_code == 200
    assert resp.json()["Status"] == "Accepted"


def test_reject_moves_submitted_to_rejected(client, make_referral):
    referral = make_referral(status="Submitted")
    resp = client.patch(f"/referrals/{referral.ReferralId}/reject")
    assert resp.status_code == 200
    assert resp.json()["Status"] == "Rejected"


def test_complete_moves_accepted_to_completed(client, make_referral):
    referral = make_referral(status="Accepted")
    resp = client.patch(f"/referrals/{referral.ReferralId}/complete")
    assert resp.status_code == 200
    assert resp.json()["Status"] == "Completed"


def test_accept_rejected_when_referral_not_submitted(client, make_referral):
    referral = make_referral(status="Draft")
    resp = client.patch(f"/referrals/{referral.ReferralId}/accept")
    assert resp.status_code == 400


def test_transition_404_when_referral_missing(client):
    resp = client.patch("/referrals/999999/submit")
    assert resp.status_code == 404
