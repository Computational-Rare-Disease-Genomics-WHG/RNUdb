# RNUdb Comprehensive Development Plan

## Phase 1: Approval System (High Priority)

### Database Schema Changes
1. **Add `pending_changes` table**
   - id (PK)
   - entity_type (gene|variant|literature|structure|bed_track)
   - entity_id
   - action (create|update|delete)
   - payload (JSON - the actual data)
   - requested_by (curator login)
   - requested_at (timestamp)
   - status (pending|approved|rejected)
   - reviewed_by (admin login)
   - reviewed_at (timestamp)
   - review_notes (text)
   - gene_id (for filtering by gene)

2. **Add `pending_change_literature_links` table**
   - pending_change_id
   - literature_id

3. **Update existing tables** - no changes needed, we store pending in separate table

### Backend API (api/routers/approvals.py)
- `POST /api/approvals` - Create pending change (curator)
- `GET /api/approvals` - List pending changes (admin/curator)
- `GET /api/approvals/pending` - List only pending (admin)
- `POST /api/approvals/{id}/approve` - Approve change (admin)
- `POST /api/approvals/{id}/reject` - Reject change (admin)
- `GET /api/approvals/{id}` - Get change details

### Frontend
- Curate.tsx: Replace direct mutations with "Submit for Approval" flow
- Admin Dashboard: Add "Pending Approvals" tab
- Admin Dashboard: Add "Audit Log" tab

### Test Framework
- tests/test_approvals.py - Full approval lifecycle tests
- tests/test_audit_log.py - Audit log tests
- tests/conftest.py - Shared fixtures (expanded)

## Phase 2: Audit Log Page
- Build audit_log query functions
- Create Admin Audit Log component
- Filter by user, entity, date range
- Show diff views

## Phase 3: API Docs Expansion
- Add all approval endpoints
- Add all audit log endpoints
- Add request/response examples
- Add authentication info

## Phase 4: Header Consistency
- Create reusable PageLayout component
- Apply to all pages
- Use composition pattern for flexibility

## Phase 5: RNA Structure Preview
- Reuse EditorCanvas or create read-only version
- Render structure data from API
- Show in modal or inline card

## Phase 6: Component Refactoring
- Extract reusable patterns from Curate.tsx
- Create generic DataTable, FormModal, ImportWizard
- Refactor to composition over configuration

## Execution Order:
1. Database migrations (pending_changes)
2. Backend API + tests
3. Frontend approval flow integration
4. Admin dashboard updates
5. Audit log page
6. API docs expansion
7. Header/PageLayout refactoring
8. RNA Structure preview
9. Component audit and refactoring
