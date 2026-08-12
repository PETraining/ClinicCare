# Patient Portal: Document & Form Management

**Feature Name**: Document & Form Management  
**Sub-Feature of**: Patient Portal  
**Assigned Team**: Team Member 2  
**Timeline**: 1 week  
**Status**: Pending Implementation

## Overview

Patients can download clinic-provided documents (e.g., instructions, educational materials, pre-visit forms) and upload their own documents (e.g., pre-visit forms filled out, insurance cards, medical history). Patients can also view a list of forms they've submitted and their status (received, reviewed, etc.).

**Key flows**:
- Patient views list of available documents to download (sent by clinic staff)
- Patient downloads a document (PDF, etc.)
- Patient uploads a pre-visit form or questionnaire
- Patient sees confirmation that document was received
- Clinic staff can see submitted documents in the referral or patient record (integration handled by Sub-Feature 3)

## Scope

### Phase 1: Backend Services & Data Model
Establish document storage and APIs for upload/download.

**Deliverables**:
- Document Service (8004): Add endpoints for patient upload and download
- Patient Service (8001): Track submitted documents and their status
- API Gateway: Proxy `/api/patient-portal/documents/*` routes
- Seed data: Populate sample documents and forms for demo patient

**Files to Change**:
- `services/document/models.py`: Add `PatientDocument` model (tracks uploads; separate from clinic-managed documents)
  - Fields: id, patient_id, referral_id (FK, nullable), file_name, file_path, upload_date, status (enum: pending, received, reviewed, rejected)
  - Relationship: FK to Patient, optional FK to Referral
- `services/document/schemas.py`: Add `PatientDocumentUploadSchema` (request), `PatientDocumentViewSchema` (response)
- `services/document/main.py`:
  - `POST /patient-documents/upload` — Accept file upload with optional referral_id, patient_id from auth
  - `GET /patient-documents/{patient_id}` — List all documents submitted by patient
  - `GET /patient-documents/{patient_id}/{doc_id}` — Download a specific document
- `services/document/seed.py`: Add sample forms or templates for demo
- `services/api-gateway/main.py`: Add proxy routes for `/api/patient-portal/documents/*`

### Phase 2: Frontend UI Components
Build upload and download UI.

**Deliverables**:
- Document list component (shows available forms and uploaded documents side by side)
- Upload form component (file picker, referral selector, submit button)
- Document card component (name, upload date, status, download link)
- Integration with Patient Portal shell from Sub-Feature 1
- Toast/notification feedback on successful upload or error

**Files to Change**:
- `frontend/src/app/features/patient-portal/document-management/document-management.component.ts`: Main container
- `frontend/src/app/features/patient-portal/document-management/document-management.component.html`: Layout
- `frontend/src/app/features/patient-portal/upload-form/upload-form.component.ts`: Handle file selection and submit
- `frontend/src/app/features/patient-portal/upload-form/upload-form.component.html`: File input, referral picker, submit button
- `frontend/src/app/features/patient-portal/document-card/document-card.component.ts`: Display one document with actions
- `frontend/src/app/features/patient-portal/document-card/document-card.component.html`: Card template
- `frontend/src/app/features/patient-portal/services/document.service.ts`: HTTP calls for upload/download
- `frontend/src/app/app.routes.ts`: Add `/patient-portal/documents` route

## Service Architecture

| Component | Service | Responsibility |
| --- | --- | --- |
| Patient document storage | Document 8004 | Store uploaded files; track metadata and status |
| Patient context | Patient 8001 | Track which documents patient submitted (read-only integration) |
| File upload/download | Document 8004 | Handle multipart form data; serve files |
| API Routing | API Gateway | Proxy `/api/patient-portal/documents/*` |
| Auth & Patient Context | API Gateway + Auth Guard | Ensure only logged-in patient accesses their documents |
| UI for upload/list | Angular Frontend | Display forms, handle file input, show status |

## Success Criteria

- [ ] Patient can navigate to "Documents" section in patient portal
- [ ] Patient sees list of available forms (seeded or provided by clinic)
- [ ] Patient can select a file from their computer and upload it
- [ ] Patient can optionally associate upload with a referral (using referral ID)
- [ ] Patient sees confirmation message after successful upload
- [ ] Uploaded document appears in "My Documents" list with upload date and status
- [ ] Patient can download any of their submitted documents
- [ ] API enforces that a patient can only upload/download their own documents
- [ ] Uploaded documents are stored persistently and can be retrieved by clinicians (verified in Sub-Feature 3 validation)
- [ ] File size limits are enforced (e.g., max 10 MB per file)

## Files to Change Summary

**Backend**:
- services/document/models.py (1 new model: PatientDocument)
- services/document/schemas.py (2 new schemas)
- services/document/main.py (3 new endpoints)
- services/document/seed.py (seed sample forms)
- services/api-gateway/main.py (2–3 new proxy routes)

**Frontend**:
- frontend/src/app/features/patient-portal/document-management/document-management.component.ts
- frontend/src/app/features/patient-portal/document-management/document-management.component.html
- frontend/src/app/features/patient-portal/upload-form/upload-form.component.ts
- frontend/src/app/features/patient-portal/upload-form/upload-form.component.html
- frontend/src/app/features/patient-portal/document-card/document-card.component.ts
- frontend/src/app/features/patient-portal/document-card/document-card.component.html
- frontend/src/app/features/patient-portal/services/document.service.ts
- frontend/src/app/app.routes.ts (1 route addition)

## Open Questions

1. **File Storage Backend**: Where are files stored (local filesystem under `services/document/uploads/`, S3, or other)? Assumed local filesystem for MVP; implementor should follow existing Document Service pattern if one exists.

2. **Allowed File Types**: Should the upload accept only PDFs, or any file? Assumed any file type for MVP; clinic can set restrictions server-side (e.g., check mimetype in POST handler).

3. **Pre-Visit Form Template**: Is there a template form patients download before filling out? Assumed optional; if required, populate in seed.py.

4. **Document Status Enum**: What are the exact status values (pending, received, reviewed, rejected)? Assumed based on typical workflow; implementor should verify and add to models.py.

5. **Notification on Upload**: Should the patient receive an email/push notification when their document is received or reviewed? Assumed no for MVP; handled in Sub-Feature 3 (referral tracking) with notification system.

6. **Multiple File Upload**: Can patient upload multiple files at once or one at a time? Assumed one at a time for MVP; can be enhanced later with drag-drop multi-file.

## Integration Notes

This sub-feature builds on Sub-Feature 1 (Referral View):
- Patient can optionally link uploaded documents to a referral (select referral from dropdown in upload form)
- Referral ID from Sub-Feature 1 is used to associate documents

This sub-feature feeds into Sub-Feature 3 (Referral Tracking):
- Uploaded documents should be visible to clinicians when viewing a referral
- Document status updates (e.g., "Reviewed") trigger notifications in Sub-Feature 3

**Shared Data Contract**:
- Referral ID (optional, for linking documents to referrals)
- Patient ID (matched from logged-in user)
- Document metadata (file name, upload date, status)

## Manual Verification Steps

1. **Start services**: Run `./start_all.sh`
2. **Log in as patient**: Navigate to `/patient-portal` as demo patient
3. **Navigate to Documents**: Click "Documents" or go to `/patient-portal/documents`
4. **Check available forms**: Verify sample forms appear if seeded
5. **Upload a file**: Click upload button, select a test file (e.g., PDF), optionally pick a referral, submit
6. **Verify upload success**: Check for confirmation message and document appears in "My Documents" list
7. **Download document**: Click download link; verify file downloads correctly
8. **Check file persistence**: Restart service; re-login; verify uploaded documents still appear
9. **Test auth boundary**: Log in as different patient; verify they cannot see other patient's documents
10. **Verify API calls**: Open browser DevTools; check `/api/patient-portal/documents/upload` and `/api/patient-portal/documents/{patient_id}` calls and responses

---
_Implementation status: Pending_
