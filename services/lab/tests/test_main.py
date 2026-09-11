from unittest.mock import AsyncMock, patch

import pytest
from fastapi.testclient import TestClient

import main

SEEDED_TEST_COUNT = 27


@pytest.fixture()
def client():
    # Use as a context manager so FastAPI's startup lifespan (which seeds the
    # test catalog via seed_if_empty) actually runs before requests are made.
    with TestClient(main.app) as test_client:
        yield test_client


@pytest.fixture(autouse=True)
def mock_external_services():
    """Stub out Lab Service's calls to Patient/Doctors/Referral/Notification
    services so tests don't depend on those services running."""
    with patch("main.verify_patient_exists", new=AsyncMock(return_value=True)) as patient_mock, \
         patch("main.verify_doctor_exists", new=AsyncMock(return_value=True)) as doctor_mock, \
         patch("main.verify_referral_exists", new=AsyncMock(return_value=True)) as referral_mock, \
         patch("main.notify_lab_event", new=AsyncMock(return_value=True)) as notify_mock:
        yield {
            "patient": patient_mock,
            "doctor": doctor_mock,
            "referral": referral_mock,
            "notify": notify_mock,
        }


def create_test(client, **overrides):
    payload = {
        "test_code": "ZZZ",
        "test_name": "Test Definition",
        "sample_type": "blood",
        "processing_time_days": 1,
        "specialty": "General",
    }
    payload.update(overrides)
    response = client.post("/tests", json=payload)
    assert response.status_code == 201, response.text
    return response.json()


def create_order(client, test_ids, **overrides):
    payload = {
        "patient_id": 1,
        "ordered_by": 1,
        "priority": "routine",
        "test_ids": test_ids,
    }
    payload.update(overrides)
    response = client.post("/orders", json=payload)
    assert response.status_code == 201, response.text
    return response.json()


# ============ HEALTH CHECK ============

def test_health_check_reports_seeded_catalog(client):
    response = client.get("/health")
    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "healthy"
    assert body["database"]["connected"] is True
    assert body["database"]["tests"] == SEEDED_TEST_COUNT


# ============ TEST CATALOG ============

def test_list_tests_returns_seeded_catalog(client):
    response = client.get("/tests")
    assert response.status_code == 200
    assert len(response.json()) == SEEDED_TEST_COUNT


def test_list_tests_filters_by_specialty(client):
    response = client.get("/tests", params={"specialty": "Hematology"})
    assert response.status_code == 200
    results = response.json()
    assert len(results) == 6
    assert all(t["specialty"] == "Hematology" for t in results)


def test_list_tests_paginates(client):
    response = client.get("/tests", params={"skip": 0, "limit": 5})
    assert response.status_code == 200
    assert len(response.json()) == 5


def test_get_test_by_id(client):
    response = client.get("/tests/1")
    assert response.status_code == 200
    assert response.json()["test_id"] == 1


def test_get_test_by_id_not_found(client):
    response = client.get("/tests/999999")
    assert response.status_code == 404


def test_get_test_by_code(client):
    response = client.get("/tests/code/CBC")
    assert response.status_code == 200
    assert response.json()["test_code"] == "CBC"


def test_get_test_by_code_not_found(client):
    response = client.get("/tests/code/NOPE")
    assert response.status_code == 404


def test_create_test_success(client):
    created = create_test(client, test_code="NEW1", test_name="New Test")
    assert created["test_code"] == "NEW1"
    assert created["test_id"] is not None


def test_create_test_duplicate_code_rejected(client):
    create_test(client, test_code="DUP1")
    response = client.post("/tests", json={
        "test_code": "DUP1",
        "test_name": "Duplicate",
        "sample_type": "blood",
    })
    assert response.status_code == 400


def test_create_test_rejects_non_positive_processing_time(client):
    response = client.post("/tests", json={
        "test_code": "BADP",
        "test_name": "Bad Processing Time",
        "sample_type": "blood",
        "processing_time_days": 0,
    })
    assert response.status_code == 400


def test_create_test_rejects_inverted_range(client):
    response = client.post("/tests", json={
        "test_code": "BADR",
        "test_name": "Bad Range",
        "sample_type": "blood",
        "normal_range_min": 10,
        "normal_range_max": 5,
    })
    assert response.status_code == 400


def test_update_test_partial_update(client):
    created = create_test(client, test_code="UPD1")
    response = client.patch(f"/tests/{created['test_id']}", json={"test_name": "Renamed"})
    assert response.status_code == 200
    assert response.json()["test_name"] == "Renamed"
    assert response.json()["test_code"] == "UPD1"


def test_update_test_not_found(client):
    response = client.patch("/tests/999999", json={"test_name": "X"})
    assert response.status_code == 404


def test_update_test_rejects_duplicate_code(client):
    create_test(client, test_code="CODE1")
    other = create_test(client, test_code="CODE2")
    response = client.patch(f"/tests/{other['test_id']}", json={"test_code": "CODE1"})
    assert response.status_code == 400


def test_update_test_rejects_inverted_range(client):
    created = create_test(client, test_code="UPDR1", normal_range_min=1, normal_range_max=10)
    response = client.patch(f"/tests/{created['test_id']}", json={"normal_range_max": 0})
    assert response.status_code == 400


def test_update_test_rejects_non_positive_processing_time(client):
    created = create_test(client, test_code="UPDP1")
    response = client.patch(f"/tests/{created['test_id']}", json={"processing_time_days": 0})
    assert response.status_code == 400


def test_delete_test_success(client):
    created = create_test(client, test_code="DEL1")
    response = client.delete(f"/tests/{created['test_id']}")
    assert response.status_code == 204
    assert client.get(f"/tests/{created['test_id']}").status_code == 404


def test_delete_test_not_found(client):
    response = client.delete("/tests/999999")
    assert response.status_code == 404


def test_delete_test_blocked_when_used_in_order(client):
    created = create_test(client, test_code="INUSE1")
    create_order(client, [created["test_id"]])
    response = client.delete(f"/tests/{created['test_id']}")
    assert response.status_code == 400


# ============ LAB ORDERS ============

def test_create_order_success(client, mock_external_services):
    order = create_order(client, [1, 2], clinical_indication="Routine checkup")
    assert order["status"] == "placed"
    assert len(order["order_tests"]) == 2
    mock_external_services["patient"].assert_awaited_once_with(1)
    mock_external_services["doctor"].assert_awaited_once_with(1)
    mock_external_services["notify"].assert_awaited_once()


def test_create_order_rejects_empty_test_ids(client):
    response = client.post("/orders", json={
        "patient_id": 1,
        "ordered_by": 1,
        "priority": "routine",
        "test_ids": [],
    })
    assert response.status_code == 400


def test_create_order_rejects_invalid_priority(client):
    response = client.post("/orders", json={
        "patient_id": 1,
        "ordered_by": 1,
        "priority": "urgent",
        "test_ids": [1],
    })
    assert response.status_code == 400


def test_create_order_rejects_duplicate_test_ids(client):
    response = client.post("/orders", json={
        "patient_id": 1,
        "ordered_by": 1,
        "priority": "routine",
        "test_ids": [1, 1],
    })
    assert response.status_code == 400


def test_create_order_rejects_unknown_patient(client, mock_external_services):
    mock_external_services["patient"].return_value = False
    response = client.post("/orders", json={
        "patient_id": 999,
        "ordered_by": 1,
        "priority": "routine",
        "test_ids": [1],
    })
    assert response.status_code == 400


def test_create_order_rejects_unknown_doctor(client, mock_external_services):
    mock_external_services["doctor"].return_value = False
    response = client.post("/orders", json={
        "patient_id": 1,
        "ordered_by": 999,
        "priority": "routine",
        "test_ids": [1],
    })
    assert response.status_code == 400


def test_create_order_rejects_unknown_test(client):
    response = client.post("/orders", json={
        "patient_id": 1,
        "ordered_by": 1,
        "priority": "routine",
        "test_ids": [999999],
    })
    assert response.status_code == 400


def test_create_order_rejects_unknown_referral(client, mock_external_services):
    mock_external_services["referral"].return_value = False
    response = client.post("/orders", json={
        "patient_id": 1,
        "ordered_by": 1,
        "referral_id": 555,
        "priority": "routine",
        "test_ids": [1],
    })
    assert response.status_code == 400


def test_create_order_verifies_provided_referral(client, mock_external_services):
    order = create_order(client, [1], referral_id=555)
    assert order["referral_id"] == 555
    mock_external_services["referral"].assert_awaited_once_with(555)


def test_list_orders_filters_by_patient_id(client):
    create_order(client, [1], patient_id=42)
    create_order(client, [2], patient_id=43)
    response = client.get("/orders", params={"patient_id": 42})
    assert response.status_code == 200
    results = response.json()
    assert len(results) == 1
    assert results[0]["patient_id"] == 42


def test_list_orders_filters_by_referral_status_and_priority(client):
    create_order(client, [1], referral_id=777, priority="stat")
    response = client.get("/orders", params={"referral_id": 777, "status": "placed", "priority": "stat"})
    assert response.status_code == 200
    results = response.json()
    assert len(results) == 1
    assert results[0]["referral_id"] == 777
    assert results[0]["priority"] == "stat"


def test_get_order_not_found(client):
    response = client.get("/orders/999999")
    assert response.status_code == 404


def test_update_order_not_found(client):
    response = client.patch("/orders/999999", json={"status": "collected"})
    assert response.status_code == 404


def test_update_order_clinical_indication(client):
    order = create_order(client, [1])
    response = client.patch(f"/orders/{order['order_id']}", json={"clinical_indication": "Follow-up"})
    assert response.status_code == 200
    assert response.json()["clinical_indication"] == "Follow-up"


def test_update_order_status(client):
    order = create_order(client, [1])
    response = client.patch(f"/orders/{order['order_id']}", json={"status": "collected"})
    assert response.status_code == 200
    assert response.json()["status"] == "collected"


def test_update_order_rejects_invalid_status(client):
    order = create_order(client, [1])
    response = client.patch(f"/orders/{order['order_id']}", json={"status": "bogus"})
    assert response.status_code == 400


# ============ ORDER TESTS & SAMPLE COLLECTION ============

def test_get_order_tests(client):
    order = create_order(client, [1, 2])
    response = client.get(f"/orders/{order['order_id']}/tests")
    assert response.status_code == 200
    assert len(response.json()) == 2


def test_get_order_tests_order_not_found(client):
    response = client.get("/orders/999999/tests")
    assert response.status_code == 404


def test_collect_sample_success(client):
    order = create_order(client, [1])
    response = client.post(f"/orders/{order['order_id']}/collect", json={"collected_by": 5})
    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "collected"
    assert body["collected_by"] == 5
    assert body["sample_label"].startswith("LAB-")


def test_collect_sample_is_idempotent(client):
    order = create_order(client, [1])
    first = client.post(f"/orders/{order['order_id']}/collect", json={"collected_by": 5})
    second = client.post(f"/orders/{order['order_id']}/collect", json={"collected_by": 9})
    assert first.status_code == 200
    assert second.status_code == 200
    assert second.json()["sample_label"] == first.json()["sample_label"]


def test_collect_sample_order_not_found(client):
    response = client.post("/orders/999999/collect", json={"collected_by": 5})
    assert response.status_code == 404


def test_collect_sample_missing_sample_record(client):
    order = create_order(client, [1])
    # LabSample is always auto-created alongside a LabOrder; simulate the
    # defensive "no sample found" branch by removing it directly via the DB.
    db = main.SessionLocal()
    try:
        db.query(main.models.LabSample).filter(
            main.models.LabSample.order_id == order["order_id"]
        ).delete()
        db.commit()
    finally:
        db.close()

    response = client.post(f"/orders/{order['order_id']}/collect", json={"collected_by": 5})
    assert response.status_code == 400


# ============ STATUS TRANSITIONS ============

def test_update_test_status_valid_transition(client):
    order = create_order(client, [1])
    client.post(f"/orders/{order['order_id']}/collect", json={"collected_by": 5})
    response = client.patch(
        f"/orders/{order['order_id']}/tests/1/status",
        json={"new_status": "in_progress", "changed_by": 5},
    )
    assert response.status_code == 200
    body = response.json()
    assert body["old_status"] == "sample_collected"
    assert body["new_status"] == "in_progress"


def test_update_test_status_rejects_invalid_status_value(client):
    order = create_order(client, [1])
    response = client.patch(
        f"/orders/{order['order_id']}/tests/1/status",
        json={"new_status": "bogus"},
    )
    assert response.status_code == 400


def test_update_test_status_rejects_illegal_transition(client):
    order = create_order(client, [1])
    # Sample not yet collected: "ordered" cannot jump straight to "in_progress"
    response = client.patch(
        f"/orders/{order['order_id']}/tests/1/status",
        json={"new_status": "in_progress"},
    )
    assert response.status_code == 400


def test_update_test_status_order_not_found(client):
    response = client.patch(
        "/orders/999999/tests/1/status",
        json={"new_status": "in_progress"},
    )
    assert response.status_code == 404


def test_update_test_status_test_not_in_order(client):
    order = create_order(client, [1])
    response = client.patch(
        f"/orders/{order['order_id']}/tests/2/status",
        json={"new_status": "in_progress"},
    )
    assert response.status_code == 404


def test_get_order_history_reflects_transitions(client):
    order = create_order(client, [1])
    client.post(f"/orders/{order['order_id']}/collect", json={"collected_by": 5})
    response = client.get(f"/orders/{order['order_id']}/history")
    assert response.status_code == 200
    history = response.json()
    assert len(history) == 1
    assert history[0]["new_status"] == "sample_collected"


def test_get_order_history_order_not_found(client):
    response = client.get("/orders/999999/history")
    assert response.status_code == 404


# ============ TEST RESULTS ============

def test_submit_test_result_order_not_found(client):
    response = client.post(
        "/orders/999999/tests/1/result",
        json={"result_value": "5.0"},
    )
    assert response.status_code == 404


def test_submit_test_result_test_not_in_order(client):
    order = create_order(client, [1])
    response = client.post(
        f"/orders/{order['order_id']}/tests/2/result",
        json={"result_value": "5.0"},
    )
    assert response.status_code == 404


def test_submit_test_result_requires_sample_collected(client):
    order = create_order(client, [1])
    response = client.post(
        f"/orders/{order['order_id']}/tests/1/result",
        json={"result_value": "5.0"},
    )
    assert response.status_code == 400


def test_submit_test_result_non_numeric_uses_provided_flags(client):
    order = create_order(client, [1])
    client.post(f"/orders/{order['order_id']}/collect", json={"collected_by": 5})
    response = client.post(
        f"/orders/{order['order_id']}/tests/1/result",
        json={"result_value": "positive", "is_abnormal": True, "is_critical": False},
    )
    assert response.status_code == 200
    body = response.json()
    assert body["result_value"] == "positive"
    assert body["is_abnormal"] is True
    assert body["is_critical"] is False


def test_submit_test_result_success_flags_normal(client):
    # GLU (test_id 7) normal range 70-100
    order = create_order(client, [7])
    client.post(f"/orders/{order['order_id']}/collect", json={"collected_by": 5})
    response = client.post(
        f"/orders/{order['order_id']}/tests/7/result",
        json={"result_value": "90"},
    )
    assert response.status_code == 200
    body = response.json()
    assert body["is_abnormal"] is False
    assert body["is_critical"] is False


def test_submit_test_result_flags_critical_and_notifies(client, mock_external_services):
    # GLU normal range 70-100; 400 is > 1.5x max (150) => critical
    order = create_order(client, [7])
    client.post(f"/orders/{order['order_id']}/collect", json={"collected_by": 5})
    response = client.post(
        f"/orders/{order['order_id']}/tests/7/result",
        json={"result_value": "400"},
    )
    assert response.status_code == 200
    body = response.json()
    assert body["is_abnormal"] is True
    assert body["is_critical"] is True
    mock_external_services["notify"].assert_awaited()
    args, kwargs = mock_external_services["notify"].call_args
    assert args[0] == "lab_result_critical"


def test_submit_test_result_rejects_blank_value(client):
    order = create_order(client, [1])
    client.post(f"/orders/{order['order_id']}/collect", json={"collected_by": 5})
    response = client.post(
        f"/orders/{order['order_id']}/tests/1/result",
        json={"result_value": "   "},
    )
    assert response.status_code == 400


def test_order_status_recomputes_to_completed_when_all_tests_done(client):
    order = create_order(client, [1])
    client.post(f"/orders/{order['order_id']}/collect", json={"collected_by": 5})
    client.post(f"/orders/{order['order_id']}/tests/1/result", json={"result_value": "5.0"})
    response = client.get(f"/orders/{order['order_id']}")
    assert response.json()["status"] == "completed"


def test_get_order_results(client):
    order = create_order(client, [1])
    client.post(f"/orders/{order['order_id']}/collect", json={"collected_by": 5})
    client.post(f"/orders/{order['order_id']}/tests/1/result", json={"result_value": "5.0"})
    response = client.get(f"/orders/{order['order_id']}/results")
    assert response.status_code == 200
    assert len(response.json()) == 1


def test_get_order_results_order_not_found(client):
    response = client.get("/orders/999999/results")
    assert response.status_code == 404


def test_review_result(client):
    order = create_order(client, [1])
    client.post(f"/orders/{order['order_id']}/collect", json={"collected_by": 5})
    submitted = client.post(f"/orders/{order['order_id']}/tests/1/result", json={"result_value": "5.0"}).json()
    response = client.patch(f"/results/{submitted['result_id']}/review", json={"reviewed_by": 7})
    assert response.status_code == 200
    assert response.json()["reviewed_by"] == 7


def test_review_result_not_found(client):
    response = client.patch("/results/999999/review", json={"reviewed_by": 7})
    assert response.status_code == 404


# ============ STATISTICS ============

def test_get_lab_statistics(client):
    create_order(client, [1])
    response = client.get("/stats")
    assert response.status_code == 200
    body = response.json()
    # Other tests in this session add to the catalog via POST /tests, so only
    # assert the seeded floor rather than an exact count.
    assert body["tests"]["catalog_total"] >= SEEDED_TEST_COUNT
    assert body["orders"]["total"] >= 1


def test_health_check_reports_unhealthy_on_db_error(client):
    def broken_get_db():
        class BrokenSession:
            def query(self, *args, **kwargs):
                raise RuntimeError("db unavailable")
        yield BrokenSession()

    main.app.dependency_overrides[main.get_db] = broken_get_db
    try:
        response = client.get("/health")
    finally:
        main.app.dependency_overrides.pop(main.get_db, None)
    # NOTE: main.py's error path does `return {...}, 503` which FastAPI does not
    # interpret as (body, status_code) — it serializes the tuple as a 2-element
    # JSON array and the HTTP status stays 200. Asserting today's actual
    # behavior here; see PR notes for the suggested fix.
    assert response.status_code == 200
    body = response.json()
    assert body[0]["status"] == "unhealthy"
    assert body[1] == 503


def test_on_startup_logs_and_survives_seed_error(monkeypatch):
    def broken_seed(db):
        raise RuntimeError("seed failed")

    monkeypatch.setattr(main, "seed_if_empty", broken_seed)
    # Must not raise even though seeding fails internally.
    main.on_startup()


def test_get_specialty_stats(client):
    order = create_order(client, [1])  # CBC -> Hematology
    response = client.get("/orders/stats/specialty/Hematology")
    assert response.status_code == 200
    body = response.json()
    assert body["specialty"] == "Hematology"
    assert body["total_orders"] >= 1
