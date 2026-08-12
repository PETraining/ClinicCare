# Patient Portal: Referral Progress Tracking

**Feature Name**: Referral Progress Tracking  
**Sub-Feature of**: Patient Portal  
**Assigned Team**: Team Member 3  
**Timeline**: 1 week  
**Status**: Pending Implementation

## Overview

Patients can track the progress of their referrals in real-time. A timeline view shows:
- Each status change (e.g., "Approved by Insurance" on date X, "Scheduled with Dr. Y" on date Z)
- Notifications when referral status changes
- Next steps or action items (e.g., "Please upload insurance card before appointment")
- Estimated timeline to specialist appointment (if available)

This sub-feature also integrates with the Notification Service to send patients notifications when their referral status changes.

## Scope

### Phase 1: Backend Services & Timeline Model
Establish a referral timeline/history and notification trigger system.

**Deliverables**:
- Referral Service (8003): Add endpoint to retrieve referral status history
- Add `ReferralStatusHistory` model to track status changes over time
- Notification Service (8005): Add logic to emit notification when referral status changes
- API Gateway: Proxy `/api/patient-portal/referral-tracking/*` routes
- Seed data: Populate test status history for demo patient's referrals

**Files to Change**:
- `services/referral/models.py`: Add `ReferralStatusHistory` model
  - Fields: id, referral_id (FK), old_status, new_status, changed_at, changed_by (nullable, clinic staff), reason (nullable)
  - Relationship: FK to Referral with cascade delete
- `services/referral/schemas.py`: Add `ReferralStatusHistorySchema` and `ReferralTrackingSchema`
- `services/referral/main.py`:
  - `GET /referral-tracking/{referral_id}` — Get full status history and timeline for a referral
  - `POST /referral-status/{referral_id}` — (Internal) Create a status change event (called when clinic updates referral)
    - Trigger notification to patient via NotificationService
- `services/referral/clients.py`: Add client method to call NotificationService for status change events
- `services/notification/main.py`: Add `POST /notify/referral-status-change` endpoint to send notification to patient
- `services/notification/schemas.py`: Add `ReferralStatusNotificationSchema`
- `services/referral/seed.py`: Populate ReferralStatusHistory entries for demo referrals
- `services/api-gateway/main.py`: Add proxy route `/api/patient-portal/referral-tracking/{referral_id}`

### Phase 2: Frontend UI Components
Build a timeline/tracking view with notifications.

**Deliverables**:
- Referral tracking detail component (shows timeline for one referral)
- Timeline event component (displays one status change with date/reason)
- Status badge with next steps messaging
- Notification bell/inbox component (optional, shows recent notifications)
- Integration with Patient Portal shell from Sub-Feature 1
- Real-time or periodic update of status (polling or WebSocket if available)

**Files to Change**:
- `frontend/src/app/features/patient-portal/referral-tracking/referral-tracking.component.ts`: Main tracking view
- `frontend/src/app/features/patient-portal/referral-tracking/referral-tracking.component.html`: Timeline layout
- `frontend/src/app/features/patient-portal/timeline-event/timeline-event.component.ts`: Display one status change
- `frontend/src/app/features/patient-portal/timeline-event/timeline-event.component.html`: Event card template
- `frontend/src/app/features/patient-portal/next-steps/next-steps.component.ts`: Show action items
- `frontend/src/app/features/patient-portal/next-steps/next-steps.component.html`: Action item list
- `frontend/src/app/features/patient-portal/notification-inbox/notification-inbox.component.ts`: List recent notifications (optional)
- `frontend/src/app/features/patient-portal/notification-inbox/notification-inbox.component.html`: Notification list (optional)
- `frontend/src/app/features/patient-portal/services/referral-tracking.service.ts`: HTTP service for tracking data
- `frontend/src/app/app.routes.ts`: Add `/patient-portal/referral-tracking/:referralId` route

## Service Architecture

| Component | Service | Responsibility |
| --- | --- | --- |
| Status history storage | Referral 8003 | Store and expose referral status changes |
| Status history logic | Referral 8003 | Determine status change events; timestamp them |
| Notification events | Referral 8003 | Call NotificationService when status changes |
| Notification delivery | Notification 8005 | Send email/push notification to patient |
| API Routing | API Gateway | Proxy `/api/patient-portal/referral-tracking/*` |
| Auth & Patient Context | API Gateway + Auth Guard | Ensure patient can only view their own referral tracking |
| UI rendering | Angular Frontend | Display timeline, status, next steps, notifications |

## Success Criteria

- [ ] Patient can click "View Progress" on a referral from Sub-Feature 1 dashboard
- [ ] Tracking page shows a timeline of status changes for that referral
- [ ] Each timeline event displays: date, status changed from → to, reason/notes (if available)
- [ ] Page shows "Next Steps" messaging based on current status (e.g., "Please upload insurance card")
- [ ] API enforces that patient can only view tracking for their own referrals
- [ ] When a clinic staff member updates a referral status (outside this portal), a notification is sent to the patient
- [ ] Patient sees notification (if notification inbox is implemented)
- [ ] Seed data includes status history for at least 2 demo referrals (e.g., pending → approved → scheduled)
- [ ] Timeline is responsive and readable on mobile and desktop
- [ ] (Optional) Real-time updates: if status changes while patient is viewing, timeline updates automatically

## Files to Change Summary

**Backend**:
- services/referral/models.py (1 new model: ReferralStatusHistory)
- services/referral/schemas.py (2 new schemas)
- services/referral/main.py (2 new endpoints)
- services/referral/clients.py (1 new method to call NotificationService)
- services/notification/main.py (1 new endpoint to send notification)
- services/notification/schemas.py (1 new schema)
- services/referral/seed.py (seed status history)
- services/api-gateway/main.py (1 new proxy route)

**Frontend**:
- frontend/src/app/features/patient-portal/referral-tracking/referral-tracking.component.ts
- frontend/src/app/features/patient-portal/referral-tracking/referral-tracking.component.html
- frontend/src/app/features/patient-portal/timeline-event/timeline-event.component.ts
- frontend/src/app/features/patient-portal/timeline-event/timeline-event.component.html
- frontend/src/app/features/patient-portal/next-steps/next-steps.component.ts
- frontend/src/app/features/patient-portal/next-steps/next-steps.component.html
- frontend/src/app/features/patient-portal/notification-inbox/notification-inbox.component.ts (optional)
- frontend/src/app/features/patient-portal/notification-inbox/notification-inbox.component.html (optional)
- frontend/src/app/features/patient-portal/services/referral-tracking.service.ts
- frontend/src/app/app.routes.ts (1 route addition)

## Open Questions

1. **Next Steps Logic**: How are "Next Steps" determined from status? Assumed based on a mapping table (status → action text) in the frontend; implementor can define this in a constant or fetch from backend.

2. **Status Change Trigger**: Who/what triggers a status change event? Assumed clinic staff update the referral via a separate admin interface; the Referral Service's existing update logic should be hooked to trigger a notification.

3. **Notification Channel**: How are notifications delivered (email, push, in-app, SMS)? Assumed handled by NotificationService 8005 (already exists); this sub-feature just calls it.

4. **Real-Time Updates**: Should the patient portal use WebSocket or polling for live updates? Assumed polling (simpler for MVP, can be enhanced with WebSocket later).

5. **Estimated Timeline**: Should the system predict estimated appointment date? Assumed no for MVP; if a tentative appointment is scheduled, show its date.

## Integration Notes

This sub-feature builds on Sub-Feature 1 (Referral View):
- Uses referral IDs and referral data from Sub-Feature 1
- Patient navigates from referral card → tracking detail page

This sub-feature integrates with Sub-Feature 2 (Document Management):
- "Next Steps" messaging might include "Upload insurance card" → links to document upload in Sub-Feature 2
- Could show "Uploaded documents: insurance card, pre-visit form" on the tracking page

**Shared Data Contract**:
- Referral ID (from Sub-Feature 1)
- Status enum (pending, approved, scheduled, completed, canceled)
- Timestamp (ISO 8601 for status changes)
- Notification schema (patient_id, referral_id, message, timestamp)

## Manual Verification Steps

1. **Start services**: Run `./start_all.sh`
2. **Log in as patient**: Navigate to `/patient-portal` as demo patient
3. **Navigate to referral tracking**: Click "View Progress" on a referral, or go to `/patient-portal/referral-tracking/{referralId}`
4. **Check timeline**: Verify status change history appears with dates and status transitions
5. **Check next steps**: Verify appropriate action messages appear based on current status
6. **Verify notifications**: 
   - Manually update a referral status via database or admin API (e.g., change from "pending" to "approved")
   - Check that patient receives notification (check email, or notification inbox if implemented)
7. **Test pagination/responsiveness**: Ensure timeline is readable with many status changes
8. **Test auth boundary**: Log in as different patient; verify they cannot view other patient's referral tracking
9. **Verify API calls**: Open browser DevTools; check `/api/patient-portal/referral-tracking/{referralId}` response
10. **Test real-time updates** (if implemented): Open tracking page; update status in background; verify page updates

---
_Implementation status: Pending_
