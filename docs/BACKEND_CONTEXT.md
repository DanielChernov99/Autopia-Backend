# Autopia Backend Context

## Request and data flow

`route -> Zod validation -> controller -> data-access layer -> MongoDB`

- **Route:** defines the HTTP contract and attaches input validation.
- **Zod:** replaces raw request input with validated, normalized values.
- **Controller:** coordinates the request and API response.
- **Data-access layer:** performs database operations and owner-scoped lookups.
- **Mongoose:** defines persisted document structure and integrity constraints.

## Authentication and ownership

- Authenticated identity: `req.user.id`.
- Never accept ownership or user IDs from writable request bodies.
- Vehicle reads and mutations must use one owner-scoped database query:
  - `_id: vehicleId`
  - `owner: req.user.id`
- Prefer the owner-scoped operation over fetching by ID and checking afterward.
  - Keeps authorization coupled to the database operation.
  - Avoids revealing whether another user's resource exists.
- Maintenance, Reminder, and other vehicle-scoped authorization is derived through the parent Vehicle.
- Access to nested data requires ownership of that parent Vehicle.

## User account

- Account routes: `/api/auth/signup`, `/api/auth/login`, `/api/auth/userinfo`, `/api/auth/password`.
- The authenticated account is always `req.user.id`; a user is never addressed by a body or route parameter.
- Editable profile fields: `firstName`, `lastName`, `email`.
- Passwords change through their own route and schema, never through the profile payload.
  - A profile schema that accepted a password would let one payload mix hashed and unhashed writes.
- Password change requires the current password and verifies it against the stored hash.
  - Verification is application logic, not Zod: it compares against stored state.
- `passwordHash` is `select: false`; load it explicitly for verification and never return it.
- Email is unique globally; translate the duplicate-key failure into a conflict.
- Changing a password does not invalidate issued tokens.
  - There is no `passwordChangedAt` or token version, so session revocation is not available.
  - Adding it requires both a User field and a check in the auth middleware.

## Nested vehicle resources

- Route shape: `/api/vehicles/:vehicleId/...`.
- Validate `vehicleId` as a route parameter.
- Treat the route parameter as the sole source of the stored Vehicle relationship.
- Do not duplicate `vehicleId` or `vehicle` in writable request bodies.
- Assign the relationship in application code after parent ownership is established.

## Manually created Reminders

- Frontend payload: user-editable reminder data only.
- Backend-controlled values:
  - `vehicle = req.params.vehicleId`
  - `source = "manual"`
- `systemKey` is internal metadata for backend-created system reminders.
- Add system-reminder behavior through a backend workflow; do not widen the manual client schema.

## Validation boundaries

### Zod

- Request shape and required fields.
- Type validation and coercion.
- Normalization and enum validation.
- Cross-field rules based only on the current payload.
- Examples: paired fields, non-empty updates, and scheduling requirements.

### Not Zod

- Ownership and authorization.
- Referenced-resource existence.
- Uniqueness.
- Comparisons against stored state, including mileage.
- Resource-state transitions.

### Persistence and application logic

- Application/data-access logic handles decisions requiring identity or database state.
- Mongoose protects persisted document structure, including non-HTTP writes.
- MongoDB indexes and database operations enforce DB-level integrity constraints.

## Shared constants and data integrity

- Reuse shared domain constants in both Zod and Mongoose.
- Do not maintain duplicate enum value lists for the same domain concept.
- Vehicle license plates are unique **per owner**, not globally.
- Preserve the compound owner-and-license-plate unique index.
- Translate relevant duplicate-key failures into an expected HTTP conflict.

## Error handling

- Expected HTTP failures: `AppError` with a status and optional details.
- Unmatched routes: not-found handler.
- Final processing: global error middleware.
- The global handler owns the API error shape and production-safe handling of unexpected errors.

## Layering guardrail

- Do not introduce a service layer unless concrete orchestration or reuse requires it.
