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
- Firebase Admin SDK (FCM push notifications)

---

## Folder Structure

```
src/
├── config/         # Environment + app configuration
├── controllers/    # Route business logic
├── middlewares/    # Express middlewares (auth)
├── models/         # Mongoose schemas
├── routes/         # Express routers
├── services/       # External service integrations (FCM)
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

`involved=false` is a soft-delete. `membership_periods` tracks every join/leave cycle.

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

One record **per recipient user** per event — fan-out model. Every event in a trip produces N Activity documents (one per involved member at the time of the event).

```
user          ObjectId → User       required  (the recipient)
trip          ObjectId → Trip       required
action_type   String  enum:
                trip_create, trip_name_edit,
                member_join, member_leave, member_add, member_remove,
                expense_create, expense_update, expense_delete,
                payment_create, payment_update, payment_delete,
                expense_comment, payment_comment
entity_type   String  enum: trip | expense | payment   required
entity_id     ObjectId  required
category      String  nullable  (expense category, for UI grouping)
title         String  required  human-readable summary (personalised per recipient)
subtitle      String  nullable  financial line, e.g. "You owe 50" or "You get back 100"
net           String  enum: "+" | "-" | "0"   required
read          Boolean default false
created_at    Date
```

Indexes: `{ user, created_at: -1 }`, `{ user, read }`, `{ user, trip, read }`, `{ trip }`

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
              ├─> Activity  (user refs User; entity_id refs Expense|Payment|Trip)
              └─> Comment   (created_by ref TripUser, entity_id ref Expense|Payment)
```

**Critical**: Expenses, Payments, and Comments reference `TripUser`, NOT `User`. Activity records reference `User` directly (the recipient) but all other actor/target info is encoded in the rendered `title`/`subtitle`.

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
| GET | `/` | ✓ | Get activities for the current user. Query params: `offset` (default 0), `limit` (default 20). Returns `{ status, data[], pagination: { offset, limit, total } }`. Each item has a `read` boolean, `net` (+/-/0), `title`, `subtitle`, `category`. |
| POST | `/:id/read` | ✓ | Mark activity as read |

---

## Activity System

### Fan-out model

Every mutation (create/update/delete expense or payment, join/leave/add/remove member, create/rename/delete trip, add comment) calls `recordActivity(...)` in `src/utilities/activity.js`.

`recordActivity` fans out one Activity document per involved trip member at the time of the event. Each document is personalised: `title` and `subtitle` use "You" when the recipient is the actor or payer. `net` signals whether the event is financially positive (`+`), negative (`-`), or neutral (`0`) for that recipient.

After inserting Activity rows, `recordActivity` fires-and-forgets `sendActivityNotifications` from `src/services/fcm.js`, which sends FCM push notifications and auto-prunes dead tokens from `User.fcm_tokens`.

Expense and payment mutations additionally call `createSystemComment(...)` to leave an undeletable audit record on the entity.

### `recordActivity` signature

```js
recordActivity({
  action_type,           // string — see Activity.action_type enum
  trip_id,               // ObjectId
  actor_user_id,         // ObjectId (User)
  entity_id,             // ObjectId
  entity_type,           // "trip" | "expense" | "payment"
  payload,               // { expense?, payment?, entity?, target_user_id?, before?, after?, body? }
  extra_recipient_user_ids, // ObjectId[] — include users who left but should still see the event
})
```

### Row rendering

`src/utilities/activity_render.js` contains `renderActivityRows(ctx)`. It takes a context object (trip, actor, target, by, to, expense, payment, recipients, …) and returns an array of Activity-shaped objects ready for `insertMany`. Each `action_type` has its own render function that personalises `title`, `subtitle`, and `net` per recipient.

---

## Utilities & Services

| File | Purpose |
|------|---------|
| `src/utilities/activity.js` | `recordActivity`, `createSystemComment`, `snapshotExpense`, `snapshotPayment` |
| `src/utilities/activity_render.js` | `renderActivityRows` — builds personalised Activity rows per recipient |
| `src/services/fcm.js` | `sendActivityNotifications` — sends FCM multicast, prunes dead tokens |
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
- **`membership_periods` not maintained** — `joinTrips`, `addToTrip`, `leaveTrip`, and related paths set `involved` but do not update `membership_periods`. The field exists on TripUser but is currently stale.

### Missing Features

- Request validation layer (e.g. joi, zod)
- Centralized error handling middleware
- Pagination on trip/expense/payment list endpoints
- Rate limiting
- Refresh tokens
- `GET /activity/:id` detail endpoint (route exists in router import but handler `getActivityDetail` is not implemented)

---

## Development Conventions

- Controllers call utility functions; business logic lives in `src/utilities/`.
- All activity creation goes through `recordActivity(...)` in `src/utilities/activity.js` — do not call `Activity.create()` or `Activity.insertMany()` directly in controllers.
- All system comment creation goes through `createSystemComment(...)` — do not call `Comment.create()` directly in controllers.
- When adding any action that modifies a trip, call `recordActivity(...)` after the main mutation succeeds. Wrap in `safeRecord` (try/catch) so activity failures don't break the main response.
- When an expense or payment is created or updated, also call `createSystemComment(...)` for the audit trail.
- Use `.deleteOne()` / `findByIdAndDelete()` instead of the deprecated `.delete()` / `.remove()`.
- Prefer `for...of` over `forEach` for async iteration.

### Database

- Use `.lean()` for read-only queries.
- Always check `ObjectId` validity before querying.
- Suggested indexes: `User.email`, `User.phone`, `Trip.code`, `Activity.{ user, created_at }` (already defined in schema).

---

## Notes For AI Coding Agents

### Critical relationships

```
User
  └─> TripUser  ← membership_periods exists but is currently not maintained
        └─> Trip
              ├─> Expense   ← paid_by/paid_for reference TripUser IDs
              ├─> Payment   ← by/to reference TripUser IDs
              ├─> Activity  ← user field references User ID (recipient)
              └─> Comment   ← created_by references TripUser ID
```

Never reference `User` directly from Expense, Payment, or Comment. Always go through `TripUser`. Activity is the exception — its `user` field is the recipient `User._id`.

### Activity fan-out contract

`recordActivity` creates one Activity document per trip member who is currently `involved`. Activities are personalised at write time; there is no post-hoc filtering. Do not query activities for a user across trip membership windows — every Activity row already belongs to exactly one user.

### Adding a new action type

1. Add the string to `Activity.action_type` enum in `src/models/activity.js`.
2. Add a render function in `src/utilities/activity_render.js` and add a `case` in `renderActivityRows`.
3. Call `recordActivity(...)` (wrapped in `safeRecord`) from the relevant controller after the mutation.
4. If the action modifies an expense or payment, also call `createSystemComment(...)`.

### `extra_recipient_user_ids`

Pass user IDs here when a user who just left a trip should still receive the activity (e.g. `member_leave`, `member_remove`). They are de-duplicated against the `involved` list automatically.
