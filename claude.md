# Splittr Backend

Node.js + Express + MongoDB backend for a group expense splitting application.

---

## Tech Stack

- Node.js / Express.js
- MongoDB + Mongoose
- JWT Authentication
- Nodemailer (OTP email delivery)
- OTP Generator / CryptoJS
- CORS

---

## Folder Structure

```
src/
├── config/         # Environment + app configuration
├── controllers/    # Route business logic
├── middlewares/    # Express middlewares (auth)
├── models/         # Mongoose schemas
├── routes/         # Express routers
├── utilities/      # Shared helpers (activity, otp, token, logging, mail)
scripts/            # One-off DB maintenance scripts
index.js            # App entrypoint
```

---

## Environment Variables

```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/splitr
JWT_SECRET=your_secret
EMAIL=your_email
PASSWORD=your_email_password
```

---

## Running

```bash
npm install
node index.js          # or: nodemon index.js
```

---

## Core Domain Models

### User (`src/models/usermodel.js`)

```
email         String  required, unique
name          String
phone         String
country_code  String
upi_id        String
dp            String  (1–24, maps to avatar asset)
verified      Boolean
trips[]       ObjectId → Trip
fcm_tokens[]  String  (Firebase Cloud Messaging tokens)
created       Date
```

### Trip (`src/models/trip.js`)

```
code          String  unique 10-char alphanumeric join code
name          String
description   String
currency      String  default "INR"
created_by    ObjectId → User
users[]       ObjectId → TripUser
expenses[]    ObjectId → Expense
payments[]    ObjectId → Payment
created       Date
```

### TripUser (`src/models/trip_user.js`)

Junction between User and Trip. Stores a snapshot of the user's profile at join time.

```
trip                ObjectId → Trip   required
user                ObjectId → User
name                String
dp                  String
involved            Boolean           default true
membership_periods  [{ joined_at: Date, left_at: Date|null }]
```

`involved=false` is a soft-delete. `membership_periods` tracks every join/leave cycle and is used to scope activity visibility.

### Expense (`src/models/expense.js`)

```
trip         ObjectId → Trip
name         String
amount       Double
category     String  enum (38 values, default "general")
split_type   String  enum: equal | unequal | percent | shares
description  String
paid_by[]    [{ user: ObjectId → TripUser, amount: Double }]
paid_for[]   [{ user: ObjectId → TripUser, share_or_percent: Double, amount: Double }]
created      Date
```

### Payment (`src/models/payment.js`)

Settlement between two trip members.

```
trip         ObjectId → Trip
by           ObjectId → TripUser
to           ObjectId → TripUser
amount       Double
description  String
created      Date
```

### Activity (`src/models/activity.js`)

One record per notable event in a trip. Used for the activity feed.

```
trip          ObjectId → Trip   required
action_type   String  enum:
                trip_create, trip_name_edit,
                member_join, member_leave, member_add, member_remove,
                expense_create, expense_update, expense_delete,
                payment_create, payment_update, payment_delete
actor         ObjectId → TripUser   required
target_user   ObjectId → TripUser   nullable
entity_type   String  enum: trip | expense | payment
entity_id     ObjectId
title         String  human-readable summary
diff          Mixed   { before, after } snapshot, nullable
read_by[]     ObjectId → TripUser
created_at    Date
```

Index: `{ trip: 1, created_at: -1 }`

### Comment (`src/models/comment.js`)

Attached to an expense or payment. System-generated on every mutation; users can also add their own.

```
entity_type       String  enum: expense | payment
entity_id         ObjectId  (dynamic ref via entity_type_model)
entity_type_model String  enum: Expense | Payment
trip              ObjectId → Trip
type              String  enum: system | user
created_by        ObjectId → TripUser
title             String
body              String
diff              Mixed   snapshot stored on system update comments
created_at        Date
```

### Log (`src/models/log.js`)

General-purpose server log.

```
user      String
category  String  enum: log | bug/feature | support | feedback
message   String  required
date      Date
```

---

## Entity Relationship

```
User
  └─> TripUser (per trip snapshot + membership periods)
        └─> Trip
              ├─> Expense   (paid_by/paid_for ref TripUser)
              ├─> Payment   (by/to ref TripUser)
              ├─> Activity  (actor/target_user ref TripUser)
              └─> Comment   (created_by ref TripUser, entity_id ref Expense|Payment)
```

**Critical**: Expenses, Payments, Activities, and Comments all reference `TripUser`, NOT `User`.

---

## Authentication

JWT is read from the `Authorization` header (raw token, no `Bearer` prefix currently). The middleware verifies the token and attaches the full User document to `req.user`.

### OTP Login

1. `POST /auth/otp-login` — generates OTP, emails hash
2. `POST /auth/otp-verify` — verifies OTP hash, issues JWT

### OAuth Login

1. `POST /auth/oauth-login` — verifies externally-issued JWT-compatible token, issues app JWT

---

## API Reference

### Auth — `/auth`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/oauth-login` | — | OAuth login / register |
| POST | `/otp-login` | — | Request OTP email |
| POST | `/otp-verify` | — | Verify OTP, get JWT |
| POST | `/oauth-register` | ✓ | Complete registration (name, phone, upi_id) |
| POST | `/update-profile` | ✓ | Update profile fields |
| POST | `/get-friends` | ✓ | Find users by phone contacts |
| POST | `/fcm-token` | ✓ | Add or remove FCM token `{ token, action: "add"\|"remove" }` |

### Trip — `/trip`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/new` | ✓ | Create trip |
| GET | `/` | ✓ | Get all user trips (includes `unread_activity_count` per trip) |
| GET | `/:id` | ✓ | Get single trip |
| POST | `/join` | ✓ | Join trip by code |
| POST | `/:id/leave` | ✓ | Leave trip |
| POST | `/:id/add` | ✓ | Add existing user by user_id |
| POST | `/:id/add-new` | ✓ | Add user by email (creates account if needed) |
| POST | `/:id/add-multiple` | ✓ | Batch add users by user_id[] |
| POST | `/:id/remove-multiple` | ✓ | Batch remove users by user_id[] |
| POST | `/:id/edit` | ✓ | Rename trip |
| DELETE | `/:id` | ✓ | Delete trip (cascades expenses, payments, activities, comments) |

### Expense — `/expense`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/new` | ✓ | Create expense |
| POST | `/update` | ✓ | Update expense (body includes `id`) |
| DELETE | `/:id` | ✓ | Delete expense |

### Payment — `/payment`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/new` | ✓ | Create payment |
| POST | `/:id` | ✓ | Update payment |
| DELETE | `/:id` | ✓ | Delete payment |

### Comment — `/comment`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/:entity_type/:entity_id` | ✓ | Get comments for an expense or payment |
| POST | `/new` | ✓ | Add user comment `{ entity_type, entity_id, trip, title, body }` |
| DELETE | `/:id` | ✓ | Delete own comment (system comments cannot be deleted) |

### Activity — `/activity`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/` | ✓ | Get activities across all trips. Query params: `from` (ISO date), `page`, `limit` (default 50). Returns `{ data[], unread_count, pagination }`. Each item has a `read` boolean. |
| POST | `/:id/read` | ✓ | Mark activity as read |
| GET | `/:id` | ✓ | Get activity detail (includes `diff`) |

---

## Activity System

### How it works

Every mutation (create/update/delete expense or payment, join/leave/add/remove member, create/rename/delete trip) calls `createActivity(...)` in `src/utilities/activity.js`. Expense and payment mutations also call `createSystemComment(...)` which creates an undeletable audit record on the entity.

### Membership-scoped visibility

Users only see activities that occurred while they were a member of the trip. This is enforced via `TripUser.membership_periods`: an array of `{ joined_at, left_at }` pairs, one per join/leave cycle.

`buildMembershipFilter(periods)` in `src/utilities/activity.js` converts these periods into a MongoDB `$or` date range filter applied to `Activity.created_at`.

**Backward compatibility**: If a TripUser has no `membership_periods` recorded, the filter returns `{}` (no restriction), so old data still appears. Run the backfill script to populate historical periods.

### Backfill script

For existing TripUsers created before `membership_periods` was added:

```bash
# Dry run (inspect output only)
node scripts/backfill_membership_periods.js

# Apply changes
DRY_RUN=false node scripts/backfill_membership_periods.js
```

The script approximates `joined_at` as the trip's `created` date.

---

## Utilities

| File | Purpose |
|------|---------|
| `src/utilities/activity.js` | `createActivity`, `createSystemComment`, `findTripUser`, `snapshotExpense`, `snapshotPayment`, `buildMembershipFilter` |
| `src/utilities/otp.js` | OTP generation, email delivery, hash verification |
| `src/utilities/token.js` | JWT generation and OAuth token verification |
| `src/utilities/logging.js` | Colour-coded console logger (info/warning/error/success/debug/verbose) |
| `src/utilities/mail.js` | Nodemailer transport wrapper |

---

## Known Issues / Technical Debt

### Security

- **Hardcoded JWT fallback** in `src/config/config.js` — must be removed before production.
- **No `Bearer` prefix support** — `authMiddleware` reads `req.headers['authorization']` as a raw token.
- **No ownership validation** — any trip member can delete/rename a trip or remove other members. Admin roles not yet implemented.

### Correctness

- **`async forEach` in `deleteTrip`** — `trip.users/expenses/payments.forEach(async ...)` does not await. Cascading deletes on trip deletion are fire-and-forget. Replace with `for...of` or `Promise.all`.
- **No MongoDB transactions** — trip deletion and related cascades are non-atomic. A crash mid-delete can leave orphaned documents.
- **Client-trusted split amounts** — expense split calculations are sent from the client and stored as-is. No server-side verification.

### Missing Features

- Request validation layer (e.g. joi, zod)
- Centralized error handling middleware
- Pagination on trip/expense/payment list endpoints
- Rate limiting
- Refresh tokens
- Push notification delivery (FCM tokens stored but not used)

---

## Development Conventions

- Controllers call utility functions; business logic lives in `src/utilities/`.
- All activity creation and system comment creation goes through `src/utilities/activity.js` — do not call `Activity.create()` or `Comment.create()` directly in controllers.
- When adding any action that modifies a trip, call `createActivity(...)` after the main mutation succeeds.
- When a user joins or leaves a trip (any path), push to `tripUser.membership_periods` or close the open period.
- Use `.deleteOne()` / `findByIdAndDelete()` instead of the deprecated `.delete()` / `.remove()`.
- Prefer `for...of` over `forEach` for async iteration.

### Database

- Use `.lean()` for read-only queries.
- Always check `ObjectId` validity before querying.
- Suggested indexes: `User.email`, `User.phone`, `Trip.code`, `Activity.{ trip, created_at }` (already defined in schema).

---

## Notes For AI Coding Agents

### Critical relationships

```
User
  └─> TripUser  ← membership_periods tracks every join/leave
        └─> Trip
              ├─> Expense   ← paid_by/paid_for reference TripUser IDs
              ├─> Payment   ← by/to reference TripUser IDs
              ├─> Activity  ← actor/target_user reference TripUser IDs
              └─> Comment   ← created_by references TripUser ID
```

Never reference `User` directly from Expense, Payment, Activity, or Comment. Always go through `TripUser`.

### Membership periods rule

Any code path that sets `tripUser.involved = true` must also push `{ joined_at: new Date(), left_at: null }` to `tripUser.membership_periods`.

Any code path that sets `tripUser.involved = false` must also find the open period (`left_at === null`) and set `left_at = new Date()`.

### Adding a new action type

1. Add the string to `Activity.action_type` enum in `src/models/activity.js`.
2. Call `createActivity(...)` from the relevant controller after the mutation.
3. If the action modifies an expense or payment, also call `createSystemComment(...)`.

### Activity visibility contract

Activities are only shown to users during the periods they were members. Do not bypass `buildMembershipFilter` when querying activities for a user.
