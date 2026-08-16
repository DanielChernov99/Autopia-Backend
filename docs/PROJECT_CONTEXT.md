# Autopia Project Context

## Product

- Vehicle-ownership companion for keeping essential car information in one place.
- Focus: individual vehicle ownership, not fleet administration.
- Core areas:
  - User vehicles and their identifying and operational details.
  - Maintenance history: service events, work, mileage, and costs.
  - Date-, mileage-, and recurrence-based reminders.
  - Vehicle-related information and documents.

## Domain

`User -> Vehicles -> vehicle-scoped data`

- A User owns one or more Vehicles.
- Maintenance records and Reminders belong to a Vehicle.
- Other vehicle information and documents remain attached to their Vehicle.
- Histories and schedules are interpreted in the context of one specific car.

## Product context

- Israel-first product.
- Support Israeli vehicle identifiers and local terminology.
- Use New Israeli Shekels (NIS) where monetary values are relevant.
- Vehicle details may be enriched from Israeli government data sources.
- Keep retrieved government-source data distinguishable from user-maintained information.

## Backend stack

- Node.js runtime.
- Express HTTP API.
- MongoDB with Mongoose for persistence.
- Zod for accepted API input and normalization.
