"""Coverage for the Insurance CRUD endpoints (services/patient/main.py:71-109)
that the in-progress insurance-crud-ui feature is wiring a frontend onto.
"""

VALID_PAYLOAD = {
    "InsurerName": "Acme Health",
    "PolicyNumber": "POL-100",
    "GroupNumber": "GRP-5",
    "MemberId": "MEM-42",
    "EffectiveDate": "2026-01-01",
    "TerminationDate": None,
}


def test_create_insurance_success(client, make_patient):
    patient = make_patient()
    resp = client.post(f"/patients/{patient.PatientId}/insurance", json=VALID_PAYLOAD)
    assert resp.status_code == 201
    body = resp.json()
    assert body["PatientId"] == patient.PatientId
    assert body["InsurerName"] == "Acme Health"


def test_create_insurance_404_when_patient_missing(client):
    resp = client.post("/patients/999999/insurance", json=VALID_PAYLOAD)
    assert resp.status_code == 404


def test_create_insurance_422_when_required_field_missing(client, make_patient):
    patient = make_patient()
    payload = dict(VALID_PAYLOAD)
    del payload["MemberId"]
    resp = client.post(f"/patients/{patient.PatientId}/insurance", json=payload)
    assert resp.status_code == 422


def test_list_insurance_scoped_to_patient(client, make_patient, make_insurance):
    patient_a = make_patient(name="Patient A")
    patient_b = make_patient(name="Patient B")
    make_insurance(patient_a.PatientId, PolicyNumber="A-POLICY")
    make_insurance(patient_b.PatientId, PolicyNumber="B-POLICY")

    resp = client.get(f"/patients/{patient_a.PatientId}/insurance")

    assert resp.status_code == 200
    policies = [row["PolicyNumber"] for row in resp.json()]
    assert policies == ["A-POLICY"]


def test_patient_detail_embeds_insurance(client, make_patient, make_insurance):
    patient = make_patient()
    make_insurance(patient.PatientId)

    resp = client.get(f"/patients/{patient.PatientId}")

    assert resp.status_code == 200
    assert len(resp.json()["insurance"]) == 1


def test_update_insurance_changes_fields(client, make_patient, make_insurance):
    patient = make_patient()
    insurance = make_insurance(patient.PatientId, PolicyNumber="OLD-POLICY")

    resp = client.put(
        f"/patients/{patient.PatientId}/insurance/{insurance.InsuranceId}",
        json={**VALID_PAYLOAD, "PolicyNumber": "NEW-POLICY"},
    )

    assert resp.status_code == 200
    assert resp.json()["PolicyNumber"] == "NEW-POLICY"


def test_update_insurance_omitted_optional_field_is_cleared(client, make_patient, make_insurance):
    """Contract test for context-map.md risk #2: InsuranceUpdate is a full
    replace, not a partial patch. If a caller (e.g. an edit form) submits a
    payload that leaves out an optional field the user didn't touch, that
    field is silently nulled out rather than preserved. This currently is
    the documented/intended contract — this test exists so that if a future
    change tries to make it partial-update semantics without updating the
    frontend accordingly (or vice versa), the mismatch is caught here.
    """
    patient = make_patient()
    insurance = make_insurance(patient.PatientId, GroupNumber="GRP-KEEP-ME")

    payload = dict(VALID_PAYLOAD)
    del payload["GroupNumber"]  # caller "forgets" to resend an optional field

    resp = client.put(
        f"/patients/{patient.PatientId}/insurance/{insurance.InsuranceId}",
        json=payload,
    )

    assert resp.status_code == 200
    assert resp.json()["GroupNumber"] is None


def test_update_insurance_404_when_insurance_not_for_that_patient(client, make_patient, make_insurance):
    patient_a = make_patient(name="Patient A")
    patient_b = make_patient(name="Patient B")
    insurance = make_insurance(patient_a.PatientId)

    resp = client.put(
        f"/patients/{patient_b.PatientId}/insurance/{insurance.InsuranceId}",
        json=VALID_PAYLOAD,
    )

    assert resp.status_code == 404


def test_delete_insurance_removes_record(client, make_patient, make_insurance):
    patient = make_patient()
    insurance = make_insurance(patient.PatientId)

    resp = client.delete(f"/patients/{patient.PatientId}/insurance/{insurance.InsuranceId}")
    assert resp.status_code == 204

    follow_up = client.get(f"/patients/{patient.PatientId}/insurance")
    assert follow_up.json() == []


def test_delete_insurance_404_when_already_gone(client, make_patient):
    patient = make_patient()
    resp = client.delete(f"/patients/{patient.PatientId}/insurance/999999")
    assert resp.status_code == 404


def test_create_multiple_insurance_per_patient_allowed_backend(client, make_patient, make_insurance):
    """The insurance-crud-ui feature enforces ONE insurance per patient at the frontend
    level (Add button hidden when insurance exists, etc.). However, the backend CRUD
    endpoints allow multiple insurances per patient — this is intentional.

    This test verifies the backend does not prevent multiple insurances. If the
    backend behavior changes to enforce uniqueness, this test will fail and alert
    us to update the frontend constraint documentation and enforcement logic.
    """
    patient = make_patient()
    insurance_1 = make_insurance(patient.PatientId, PolicyNumber="POLICY-1")

    # Create a second insurance for the same patient — backend allows it
    resp = client.post(
        f"/patients/{patient.PatientId}/insurance",
        json={**VALID_PAYLOAD, "PolicyNumber": "POLICY-2"}
    )
    assert resp.status_code == 201
    insurance_2_body = resp.json()
    assert insurance_2_body["InsuranceId"] != insurance_1.InsuranceId

    # Verify both exist in the backend
    list_resp = client.get(f"/patients/{patient.PatientId}/insurance")
    assert len(list_resp.json()) == 2
    policies = [p["PolicyNumber"] for p in list_resp.json()]
    assert "POLICY-1" in policies
    assert "POLICY-2" in policies


def test_patient_detail_returns_all_insurance_records(client, make_patient, make_insurance):
    """Verify that GET /patients/{id} returns ALL insurance records if multiple exist.
    The frontend will only display the first one (per one-insurance-per-patient UI
    constraint), but the backend returns all of them — this is correct behavior.
    """
    patient = make_patient()
    make_insurance(patient.PatientId, PolicyNumber="POLICY-1")
    make_insurance(patient.PatientId, PolicyNumber="POLICY-2")

    resp = client.get(f"/patients/{patient.PatientId}")

    assert resp.status_code == 200
    insurances = resp.json()["insurance"]
    assert len(insurances) == 2
