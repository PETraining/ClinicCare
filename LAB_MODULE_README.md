# Lab Management Module - Project Overview

## Quick Start for Team Members

**Project**: ClinicCare Lab Management System  
**Duration**: 2 weeks (Aug 6-20, 2026)  
**Team Size**: 4 members  
**Status**: Planning phase → Ready to start

---

## What's Being Built?

A complete lab management system that allows clinicians to:
- Order lab tests for patients
- Track sample collection
- Monitor test processing
- Review and acknowledge results

Lab technicians can:
- See pending tests
- Mark samples as collected
- Process tests
- Enter test results

**Why?** Today there's no way to order, track, or manage lab tests in ClinicCare. This is the first time labs exist in the system.

---

## Key Documents

| Document | Purpose | Audience |
|----------|---------|----------|
| **LAB_MODULE_PLAN.md** | Complete project plan with requirements, architecture, 2-week breakdown, and detailed tasks per role | Everyone (read once at start) |
| **LAB_MODULE_TASKS.md** | Hour-by-hour task breakdown with priorities, dependencies, and acceptance criteria | Project managers, team leads |
| **LAB_MODULE_TECH_SPEC.md** | Code examples, API specs, database schemas, and implementation details | Developers (reference while coding) |
| **LAB_MODULE_README.md** | This file - quick reference for the project | Everyone |

---

## Team Roles & Responsibilities

### Backend Developer (20 hours)
**Skills needed**: Python, FastAPI, SQLAlchemy, SQL

**What you'll build:**
- New `services/lab/` microservice
- Database models (Test, LabOrder, Sample, Result)
- REST API endpoints (CRUD for all entities)
- Service-to-service integration (Patient, Referral services)
- Seed data with 25+ common lab tests

**Key files to create:**
- `services/lab/main.py` - FastAPI app & endpoints
- `services/lab/models.py` - SQLAlchemy ORM
- `services/lab/schemas.py` - Pydantic validation
- `services/lab/db.py` - Database setup
- `services/lab/seed.py` - Initial data

**Success looks like:**
- All CRUD endpoints working
- Validation enforced
- Database relationships correct
- Service calls to other microservices working

---

### Frontend Developer 1 - Clinician Interface (20 hours)
**Skills needed**: Angular 18, TypeScript, RxJS, HTML/CSS

**What you'll build:**
- Lab module with routes `/lab/*`
- Lab order creation form (5-step wizard)
- Lab order list & detail views
- Test catalog browser
- Lab results viewer with abnormal flagging
- Integration into patient chart
- Integration into referral view

**Key components to create:**
- `lab.service.ts` - HTTP client service
- `create-lab-order.component.ts` - Form component
- `lab-orders-list.component.ts` - List component
- `lab-results.component.ts` - Results viewer

**Success looks like:**
- Can create a complete lab order end-to-end
- Results display with proper styling (abnormal/critical flags)
- Integrated into patient & referral workflows
- Styling matches app design

---

### Frontend Developer 2 - Lab Technician Interface (20 hours)
**Skills needed**: Angular 18, TypeScript, RxJS, HTML/CSS

**What you'll build:**
- Lab technician module with routes `/lab-tech/*`
- Technician dashboard (pending tests)
- Sample collection tracking UI
- Test processing workflow UI
- Result entry form (numeric + text)
- Sample label generation UI
- Bulk operations (optional MVP+)

**Key components to create:**
- `lab-tech.service.ts` - Shared service
- `technician-dashboard.component.ts` - Main dashboard
- `sample-collection.component.ts` - Sample tracking
- `result-entry.component.ts` - Result form

**Success looks like:**
- Technician can collect samples
- Can enter test results with validation
- Form auto-flags abnormal results
- Dashboard shows clear work queue

---

### QA / DevOps / Integration Lead (20 hours)
**Skills needed**: Testing strategy, Docker, manual testing, SQL

**What you'll build:**
- Test plan & test cases (50+ scenarios)
- Docker setup for Lab Service
- Manual API testing
- Database validation
- End-to-end workflow testing
- Deployment checklist
- Documentation

**Key deliverables:**
- Test case spreadsheet
- Docker Compose integration
- Bug reports (with reproduction steps)
- UAT sign-off document
- Deployment runbook

**Success looks like:**
- All critical paths tested
- No blockers for developers
- Environment stable (all services start)
- Bugs documented & prioritized
- Team confident in deployment

---

## 2-Week Timeline at a Glance

```
WEEK 1: Foundation
├─ Days 1-2: Setup, Schema Design, Planning (16 hours)
├─ Days 3-5: Core APIs & Clinician UI (32 hours)
└─ Friday: Mid-sprint review, adjust if needed

WEEK 2: Workflows & Completion
├─ Days 6-7: Sample Collection & Processing (24 hours)
├─ Days 8-9: Results & Integration (24 hours)
└─ Day 10: Final testing, bug fixes, deployment prep (16 hours)

Total: 80 hours (20 per person)
```

### Key Milestones

| Date | Milestone | Go/No-Go |
|------|-----------|----------|
| Aug 8 (EOD) | Schema designed, API endpoints spec'd, modules scaffolded | Go |
| Aug 9 (EOD) | All CRUD endpoints working, frontend forms taking shape | Go |
| Aug 13 (EOD) | Order → Collect → Process workflow 80% complete | Go |
| Aug 15 (EOD) | Results submitted & displayed, all integrations working | Go |
| Aug 20 (EOD) | UAT sign-off, ready for production | Release! |

---

## What You Need Before Starting

**For Everyone:**
- [ ] Read `LAB_MODULE_PLAN.md` - Understand the big picture
- [ ] Read your role's section in `LAB_MODULE_TASKS.md` - Know your tasks
- [ ] Setup local environment: `docker-compose up`
- [ ] Verify all services start without errors
- [ ] Slack/Teams channel for daily standups

**For Backend:**
- [ ] FastAPI & SQLAlchemy examples ready
- [ ] Know the existing service structure (see CLAUDE.md)
- [ ] httpx for service-to-service calls
- [ ] SQL client for database inspection

**For Frontend:**
- [ ] Angular 18 standalone components comfortable
- [ ] Reactive Forms (FormBuilder, FormGroup)
- [ ] RxJS observables familiar
- [ ] HTTP client patterns

**For QA:**
- [ ] Postman or curl ready for API testing
- [ ] Git for pushing test documentation
- [ ] Docker Compose knowledge
- [ ] Test case template created

---

## Critical Success Factors

### 🔴 Must Have (All Critical Tasks)
1. Lab service running & API endpoints working
2. Database schema correct with proper relationships
3. Order creation workflow end-to-end
4. Sample collection & status tracking
5. Result entry & validation
6. Results visible in UI
7. No crashes on service startup

### 🟠 Should Have (High Priority)
1. Service integrations (Patient/Referral/Notification)
2. Abnormal/critical result flagging
3. Status history audit trail
4. Integration into patient chart
5. Integration into referral view
6. Consistent styling

### 🟡 Nice to Have (Medium Priority - Phase 2)
1. Bulk result entry
2. Result trend visualization
3. Email notifications
4. Advanced filtering
5. Performance metrics dashboard

---

## Daily Standup Template

**Time**: 10 minutes  
**Attendees**: Entire team

```
[Each person, ~2 min]:
1. What did I complete yesterday? (✅ task ID: Task Name)
2. What will I do today? (→ task ID: Task Name)
3. Any blockers? (🚫 issue)

[Tech Lead - 2 min]:
- Overall progress vs plan
- Risk flags
- Adjustments needed
```

---

## Git Workflow

```bash
# Create feature branch for your component
git checkout -b feature/lab-module-{your-initials}

# Daily commits
git commit -m "Lab: {Component} - {What you did}"

# Examples:
git commit -m "Lab: Backend - Create Test model and seed data"
git commit -m "Lab: Frontend1 - Build lab order creation form steps 1-3"
git commit -m "Lab: QA - Create test plan spreadsheet"

# Push daily so team can review
git push origin feature/lab-module-{your-initials}

# Create PR when feature complete (not before!)
```

---

## How to Track Progress

### Task Board (Recommended: GitHub Projects)

- Create columns: "TODO", "In Progress", "Testing", "Done"
- Move task card as you work
- Update daily with % complete

### Spreadsheet Alternative

| Task ID | Title | Owner | Status | Hours | Comments |
|---------|-------|-------|--------|-------|----------|
| P-201 | Test Catalog API | Backend | 🟡 In Progress (1/3h) | 3 | Basic CRUD working, filtering next |
| F1-201 | Lab Order List | Frontend1 | 🟡 In Progress (2/3h) | 3 | Layout done, API integration in progress |

---

## Common Questions

### Q: What if a task takes longer than estimated?
**A**: Flag it immediately in standup. Move it to "blocked" and pair program if needed. Move next tasks forward.

### Q: Can I work on another person's task?
**A**: Yes! If someone is blocked. Pair program first 15 min to sync up, then take over.

### Q: What if the backend isn't done when frontend needs it?
**A**: Mock the service response in Angular HTTP. When real API ready, swap out the mock. Example:
```typescript
// Temporary mock service
mockGetTests(): Observable<Test[]> {
  return of([{test_id: 1, test_name: 'Test 1', ...}]);
}
```

### Q: How do I test the API if it's not deployed?
**A**: Run locally:
```bash
cd services/lab
pip install -r requirements.txt
python main.py
# Service runs on localhost:8006
```

### Q: Do we need unit tests for this sprint?
**A**: No. Focus on functionality. Add unit tests in Phase 2. Manual testing + QA is sufficient.

### Q: What happens if we can't finish in 2 weeks?
**A**: Prioritize by the **Critical** tasks above. Defer Phase 2 features. Replan on Day 10.

---

## Deployment Checklist

Before going live, QA must verify:

- [ ] All services start cleanly: `docker-compose up`
- [ ] Lab Service responds on port 8006
- [ ] Gateway routes to Lab Service correctly
- [ ] No errors in logs after 5 min
- [ ] Can create order from frontend (no crashes)
- [ ] Can mark sample collected
- [ ] Can submit result
- [ ] Result appears in UI with correct formatting
- [ ] No hardcoded localhost URLs (all use env vars)
- [ ] All tests seeded (25+ in database)
- [ ] CORS configured for gateway
- [ ] Database initialized on service startup
- [ ] Error responses are meaningful (not 500 errors)

---

## Resources & References

### ClinicCare Architecture
See [CLAUDE.md](./CLAUDE.md) for:
- Overall microservices architecture
- Frontend structure (core/ vs features/)
- Service communication patterns
- Quick commands to run services

### Lab Module Details
- [LAB_MODULE_PLAN.md](./LAB_MODULE_PLAN.md) - Full requirements & architecture
- [LAB_MODULE_TASKS.md](./LAB_MODULE_TASKS.md) - Task breakdown by hour
- [LAB_MODULE_TECH_SPEC.md](./LAB_MODULE_TECH_SPEC.md) - Code examples & specs

### External References
- [FastAPI Docs](https://fastapi.tiangolo.com/)
- [SQLAlchemy Docs](https://docs.sqlalchemy.org/)
- [Angular 18 Standalone API](https://angular.io/guide/standalone-components)
- [RxJS Operators](https://rxjs.dev/api)

---

## Help & Support

### Getting Stuck?
1. **Check the tech specs** - [LAB_MODULE_TECH_SPEC.md](./LAB_MODULE_TECH_SPEC.md) has code examples
2. **Look at existing services** - Patterns in `services/patient/` or `services/doctors/` apply to Lab Service
3. **Ask in standup** - 10 min call might save you 1 hour of debugging
4. **Pair program** - 15 min with a teammate often unblocks you

### Found a Bug?
1. Document it: What did you do? What happened? What should happen?
2. Create GitHub issue or add to shared doc
3. Flag in standup
4. QA verifies & adds to bug log

### Design Question?
- Ask in standup or async in Slack
- Tech Lead makes final call
- Document decision in PR description

---

## Success Metrics

**Sprint is successful if:**
- ✅ All critical tasks (🔴) completed
- ✅ 80%+ of high tasks (🟠) completed
- ✅ Zero critical bugs remaining
- ✅ Code reviewed & merged
- ✅ UAT sign-off obtained
- ✅ Documentation complete
- ✅ Team confident in shipping

**We're NOT doing this sprint if:**
- ❌ Schema not finalized by Day 2
- ❌ More than 3 critical bugs found
- ❌ Service integration fails mid-week
- ❌ Team capacity drops below 3 members

---

## Next Steps

1. **Today**: Read [LAB_MODULE_PLAN.md](./LAB_MODULE_PLAN.md) → understand requirements
2. **Tomorrow**: Read your role section in [LAB_MODULE_TASKS.md](./LAB_MODULE_TASKS.md) → know your tasks
3. **Day 1 Standup**: Discuss any questions, confirm start date
4. **Day 1 Evening**: Setup done, Day 2 planning meeting scheduled
5. **Day 2**: Begin implementation following task breakdown

---

## Project Contact

**Tech Lead**: [Assign tech lead]  
**Backend Owner**: [Assign]  
**Frontend Owner**: [Assign]  
**QA Owner**: [Assign]

Slack Channel: `#lab-module-dev`  
Daily Standup: [Time] [Link]  
Sprint Review: [Date] [Link]

---

**Good luck! 🚀**

This is a greenfield feature - you're building something new that will have real impact for clinicians and patients. Be proud of the work!
