# Patient Portal: Document & Form Management

**Feature Name**: Document & Form Management
**Sub-Feature of**: Patient Portal
**Assigned Team**: Engineer B
**Timeline**: 1–2 weeks (Days 1–7/10) — this is the heaviest of the three sub-features
**Status**: Pending Implementation
**Last grounded against repo**: 2026-08-13, branch `F5.2-imp`

## Ground truth this spec is based on (read this before coding)

- `services/document/models.py` currently stores **metadata only**: `Document(DocumentId, PatientId, ReferralId?, Type, UploadedDate, FileName)`. There is **no file storage, no upload endpoint, no download endpoint** — `POST /documents` in `services/document/main.py` just writes a `FileName` string; it never receives file bytes.
- `services/document/schemas.py` — `DocumentType` enum is currently `Lab Report | Imaging | Referral Letter | Discharge Summary`. There is **no "questionnaire" or "pre-visit form" type or model anywhere** in the codebase.
- The frontend `DocumentService` (`core/services/document.service.ts`) only supports `loadByPatient`/`loadByReferral` (GET, no upload). `DocumentsPanelComponent` is a read-only clinician-facing list — do not repurpose it for patient upload; build new, separate patient-facing components.
- The gateway already proxies the `documents` segment to the Document Service (8004) with no changes needed for JSON routes. Multipart/form-data uploads should also proxy fine because `gateway/main.py`'s `proxy()` forwards the raw request body and headers (minus hop-by-hop headers) — verify this in practice once the upload endpoint exists, since it's untested with binary/multipart bodies today.
- **This sub-feature is net-new plumbing, not a UI skin over existing APIs.** Real file storage and a whole Questionnaire subsystem must be built from scratch inside the Document Service.

## Overview

Patients can (1) download clinic-provided documents, (2) upload their own pre-visit forms as files, and (3) complete structured questionnaires in-app. All three flows write data that becomes visible to clinicians pre-appointment (existing clinician `DocumentsPanelComponent` already lists documents by patient/referral — patient-uploaded documents show up there for free once persisted with the right `PatientId`/`ReferralId`).

## Scope

### Phase 1 (Days 1–4): Backend — real file storage + Questionnaire subsystem

**Deliverables**:
- Extend `Document` model with enough fields to support patient uploads and real file storage (additive columns only — do not rename/remove existing fields, the clinician `DocumentsPanelComponent` depends on the current shape).
- New file upload endpoint (`multipart/form-data`) and a new download endpoint that streams bytes back.
- New `Questionnaire` (template) and `QuestionnaireResponse` (patient answers) models/endpoints, added to the Document Service (no new microservice/port — the gateway only knows about the 5 existing `SERVICE_MAP` segments plus whatever Sub-Feature 1 adds for `appointments`; adding a 6th service means a 6th port + a 6th gateway entry, which is more infra than this feature needs).
- Local disk storage under `services/document/storage/` for uploaded bytes.

**Files to Change**:
- `services/document/models.py` — add columns to `Document`:
  ```python
  StoragePath = Column(String, nullable=True)      # server-relative path to the file bytes; null for legacy metadata-only rows
  UploadedBy = Column(String, nullable=False, default="Clinician")  # "Clinician" | "Patient"
  ```
  Add two new tables:
  ```python
  class Questionnaire(Base):
      __tablename__ = "questionnaires"
      QuestionnaireId = Column(Integer, primary_key=True, index=True)
      Title = Column(String, nullable=False)
      Description = Column(String, nullable=True)
      QuestionsJson = Column(String, nullable=False)  # JSON-encoded list of {id, prompt, type}

  class QuestionnaireResponse(Base):
      __tablename__ = "questionnaire_responses"
      ResponseId = Column(Integer, primary_key=True, index=True)
      QuestionnaireId = Column(Integer, ForeignKey("questionnaires.QuestionnaireId"), nullable=False)
      PatientId = Column(Integer, nullable=False, index=True)
      ReferralId = Column(Integer, nullable=True, index=True)
      SubmittedAt = Column(DateTime, nullable=False)
      AnswersJson = Column(String, nullable=False)  # JSON-encoded {questionId: answer}
  ```
- `services/document/schemas.py`:
  - Add `"Pre-Visit Form"` to the `DocumentType` enum (Title Case, matching existing style: `"Lab Report"`, `"Imaging"`, etc.).
  - Add `UploadedBy` enum (`Clinician`/`Patient`) and include on `DocumentRead`/`DocumentCreate`.
  - Add `QuestionnaireRead`, `QuestionnaireResponseCreate`, `QuestionnaireResponseRead` (PascalCase fields, `ConfigDict(from_attributes=True)`, matching existing style).
- `services/document/main.py`:
  - `POST /documents/upload` — `UploadFile` + form fields `PatientId`, `ReferralId` (optional), `Type`; writes bytes to `storage/`, creates a `Document` row with `UploadedBy="Patient"`, `StoragePath` set.
  - `GET /documents/{document_id}/download` — `FileResponse` streaming `StoragePath`; 404 if the row has no `StoragePath` (legacy metadata-only rows can't be downloaded).
  - `GET /questionnaires` — list active templates.
  - `POST /questionnaire-responses` — patient submits answers (`PatientId`, `QuestionnaireId`, `ReferralId?`, `AnswersJson`).
  - `GET /questionnaire-responses?patientId=` — list a patient's submitted responses.
- `services/document/seed.py`:
  - Seed 1–2 clinician-provided sample documents with a real `StoragePath` pointing at a small bundled sample file (e.g., a plain-text or PDF placeholder committed under `services/document/storage/seed/`), so "download a clinic document" is demonstrable out of the box.
  - Seed 1–2 `Questionnaire` templates, e.g. "Pre-Visit Symptom Checklist", "New Patient Intake" — **keep sample question content generic (symptoms, visit reason, preferred contact time); do not include any government ID, SSN, insurance policy number, or other sensitive-identifier fields in the seeded questions.**
- Add `services/document/storage/` (uploaded files) to `.gitignore`, but keep the small seed sample files committed.

### Phase 2 (Days 4–7): Frontend — upload, download, questionnaires

**Deliverables**:
- Patient-facing document list (download clinic docs, view own uploads with status).
- Upload form with an optional referral selector.
- Questionnaire list + fill-and-submit flow.

**Files to Change**:
- `frontend/src/app/core/models/document.model.ts` — extend `ClinicalDocument` with `StoragePath: string | null` and `UploadedBy: 'Clinician' | 'Patient'`, and add `'Pre-Visit Form'` to `DocumentType`. (Additive — existing clinician `DocumentsPanelComponent` keeps working.)
- `frontend/src/app/core/models/questionnaire.model.ts` — new (`Questionnaire`, `QuestionnaireResponse` interfaces).
- `frontend/src/app/core/services/patient-document.service.ts` — new (do not extend the existing `DocumentService` singleton in place; the patient portal needs `upload()`/`downloadUrl()` methods the clinician-facing service doesn't need, and keeping them separate avoids coupling the two UIs).
- `frontend/src/app/core/services/questionnaire.service.ts` — new.
- `frontend/src/app/features/patient-portal/documents/patient-documents.component.ts` (+ `.html`/`.css`) — new; lists clinic documents (download links) and the patient's own uploads (with status).
- `frontend/src/app/features/patient-portal/documents/upload-form.component.ts` (+ `.html`) — new; native `<input type="file">` + referral `<select>` populated via the **existing** `GET /api/referrals?patientId=` (Sub-Feature 1's endpoint, already live — no need to wait).
- `frontend/src/app/features/patient-portal/questionnaires/questionnaire-list.component.ts` — new.
- `frontend/src/app/features/patient-portal/questionnaires/questionnaire-detail.component.ts` (+ `.html`) — new; renders `QuestionsJson` as a simple form, posts to `POST /questionnaire-responses`.
- `frontend/src/app/app.routes.ts` — add children under the `patient-portal` route added by Sub-Feature 1:
  ```ts
  { path: 'documents', component: PatientDocumentsComponent },
  { path: 'documents/upload', component: UploadFormComponent },
  { path: 'questionnaires', component: QuestionnaireListComponent },
  { path: 'questionnaires/:id', component: QuestionnaireDetailComponent },
  ```

## Service Architecture Table

| Piece | Owning Service (port) | New/Existing |
| --- | --- | --- |
| Document metadata (list/create) | Document Service (8004) | Existing, but extended with new columns |
| File upload (`POST /documents/upload`) | Document Service (8004) | **New** |
| File download (`GET /documents/{id}/download`) | Document Service (8004) | **New** |
| Questionnaire templates + responses | Document Service (8004) | **New** — same service, no new port |
| Referral list for the upload form's dropdown | Referral Service (8003), via existing `GET /referrals?patientId=` | **Existing**, no waiting required |
| Gateway routing | API Gateway (8000) | No change — `documents` segment already proxies to 8004 |

## Success Criteria

- [ ] Patient can view and download at least one seeded clinic-provided document (real bytes returned, not just metadata).
- [ ] Patient can upload a file, optionally linked to one of their own referrals, and see it appear in "My Documents" with `UploadedBy = Patient`.
- [ ] Patient can list available questionnaires, fill one out, submit, and see it recorded (`GET /questionnaire-responses?patientId=` reflects the submission).
- [ ] Uploaded documents and questionnaire responses are attributed to the correct `PatientId` — verify isolation by switching patients.
- [ ] The existing clinician `DocumentsPanelComponent`/`DocumentService` still work unmodified against the extended `Document` model (new columns are additive with defaults).
- [ ] No sensitive identifier fields (SSN, government ID, insurance policy/member number, etc.) appear anywhere in seeded questionnaire content or sample documents.

## Open Questions (resolve conservatively, document the assumption taken)

1. **Where do "pre-visit forms" (uploaded files) and "questionnaires" (structured in-app forms) diverge?** The brief lists both as separate capabilities. Default taken here: uploads are unstructured files (`POST /documents/upload`, `Type = "Pre-Visit Form"`); questionnaires are structured Q&A stored as JSON, no file involved. If product actually wants uploaded PDFs *of* the questionnaire, that's a different flow — flag for product before building both in parallel.
2. **File size / type limits.** Not specified in the brief. Default: accept any file type, cap at a small size in the multipart handler (e.g., reject over ~10MB) to avoid the demo SQLite-adjacent disk filling up; document the limit in the API response on rejection.
3. **Questionnaire authoring.** No admin UI is in scope per the brief ("patients complete questionnaires" — nothing about clinicians building them). Default: templates are seed-data only for this MVP; a clinician-facing questionnaire builder is out of scope.
4. **Multipart proxying through the gateway.** `gateway/main.py`'s generic proxy has not been exercised with file uploads before. Verify manually (see below) before considering this endpoint done; if it breaks on large files or content-type handling, that's a gateway-level fix, not something to work around by bypassing the gateway from the frontend.

## Integration Notes (cross-feature dependencies)

- **Depends on Sub-Feature 1** only for the shared `PatientPortalShellComponent`/`patientAuthGuard` (so these pages render inside the same authenticated shell) — not for referral data, since `GET /api/referrals?patientId=` already exists and is stable today.
- **Feeds Sub-Feature 3**: once a document is uploaded or a questionnaire submitted, Sub-Feature 3's "next steps" messaging can reference it (e.g., "Insurance form received" once a matching `Document` row exists). This is a read-only dependency in the other direction — Sub-Feature 3 should query Document Service data, not vice versa.
- **No dependency on Notification Service** — document/questionnaire submission does not need to emit notifications per the brief; that's scoped to referral status changes (Sub-Feature 3).

## Manual Verification Steps

1. `curl http://localhost:8000/api/documents?patientId=1` — confirm seeded clinic document(s) appear with a non-null `StoragePath`.
2. `curl http://localhost:8000/api/documents/{id}/download -o out.pdf` — confirm real bytes come back.
3. In the browser, log in to `/patient-portal` as a seeded patient, go to Documents, upload a small test file linked to one of that patient's referrals, confirm it appears in the list.
4. Go to Questionnaires, fill out and submit the seeded template, confirm `GET /api/questionnaire-responses?patientId=` shows the submission.
5. Switch patients and confirm uploads/responses do not leak across patients.

---
_Context-map rewritten 2026-08-13 against actual repo structure (previous draft assumed a `PatientDocument` model and `services/api-gateway/` path that don't exist, and didn't account for the Document Service currently having no real file storage at all)._
