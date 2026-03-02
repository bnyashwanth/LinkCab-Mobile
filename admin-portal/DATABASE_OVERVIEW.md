# LinkCab Database Schema Architecture

This document provides an in-depth overview of the entire PostgreSQL database architecture driving LinkCab. The database is hosted on Supabase, leveraging native PostgreSQL features like foreign keys, triggers, constraints, and JSON fields.

---

## 🏗 Schema Overview

LinkCab centers around 6 primary tables representing the entire lifecycle of a ride-sharing ecosystem:

1. `users` - All authenticated profiles.
2. `announcements` - Rides offered by drivers.
3. `requests` - Seat requests made by passengers to join an announcement.
4. `matches` - Successful unions between a driver and a passenger for an announcement.
5. `transactions` - The financial records dictating the movement of funds for fees and rides.
6. `wallets` - Balances tied to user accounts for quick transactions.

---

## 🗄️ Tables Breakdown

### 1. `users`

The core entity storing profile data and state flags. Every user authenticated through Supabase Auth automatically gets a record here via a trigger.

| Column           | Type           | Constraints        | Description                                                                     |
| ---------------- | -------------- | ------------------ | ------------------------------------------------------------------------------- |
| `id`             | `UUID`         | Primary Key        | Linked to `auth.users` UUID.                                                    |
| `email`          | `VARCHAR(255)` | `UNIQUE, NOT NULL` | Login identifier.                                                               |
| `full_name`      | `VARCHAR(255)` |                    | Dispay name.                                                                    |
| `phone`          | `VARCHAR(20)`  |                    | Contact number for matching.                                                    |
| `avatar_url`     | `TEXT`         |                    | Supabase storage URL.                                                           |
| `kyc_status`     | `VARCHAR(20)`  | `CHECK`            | State of eKYC (`pending`, `submitted`, `under_review`, `verified`, `rejected`). |
| `kyc_documents`  | `JSONB`        |                    | Complex object storing ID and Selfie URLs.                                      |
| `wallet_balance` | `DECIMAL`      | Default `0.00`     | Real-time tracking of liquid funds.                                             |
| `trust_score`    | `DECIMAL`      | Default `0.00`     | Rated reputation for safety metrics.                                            |

### 2. `announcements`

Created by **Drivers** when they are offering seats along a specific route. Represent the root nodes of potential rides.

| Column               | Type      | Constraints      | Description                                    |
| -------------------- | --------- | ---------------- | ---------------------------------------------- |
| `user_id`            | `UUID`    | `FK -> users.id` | The driver making the announcement.            |
| `title`              | `VARCHAR` | `NOT NULL`       | Description of the trip (e.g., "Airport Run"). |
| `departure_location` | `VARCHAR` | `NOT NULL`       | Starting point.                                |
| `destination`        | `VARCHAR` | `NOT NULL`       | Drop-off point.                                |
| `travel_date`        | `DATE`    | `NOT NULL`       |                                                |
| `travel_time`        | `TIME`    | `NOT NULL`       |                                                |
| `seats_available`    | `INTEGER` | Default `1`      | Capacity of the vehicle remaining.             |
| `price_per_seat`     | `DECIMAL` | `NOT NULL`       | Set price dictating ride costs.                |
| `status`             | `VARCHAR` | `CHECK`          | `active`, `completed`, or `cancelled`.         |

### 3. `requests`

Created by **Passengers** asking to buy a seat on a specific `announcement`.

| Column            | Type      | Constraints              | Description                                        |
| ----------------- | --------- | ------------------------ | -------------------------------------------------- |
| `user_id`         | `UUID`    | `FK -> users.id`         | The passenger making the request.                  |
| `announcement_id` | `UUID`    | `FK -> announcements.id` | The ride being targeted.                           |
| `status`          | `VARCHAR` | `CHECK`                  | `pending`, `accepted`, `rejected`, or `cancelled`. |
| `seats_requested` | `INTEGER` | Default `1`              | Affects capacity math if accepted.                 |
| `total_amount`    | `DECIMAL` |                          | Pre-calculated math (`seats` × `price_per_seat`).  |

### 4. `matches`

The final state. Created automatically or manually when a driver changes a `request` status to `accepted`.

| Column            | Type      | Constraints      | Description                                |
| ----------------- | --------- | ---------------- | ------------------------------------------ |
| `driver_id`       | `UUID`    | `FK -> users.id` | Duplicate association to speed up queries. |
| `passenger_id`    | `UUID`    | `FK -> users.id` | Duplicate association to speed up queries. |
| `seats_confirmed` | `INTEGER` | `NOT NULL`       | Final locked seat count.                   |
| `total_amount`    | `DECIMAL` | `NOT NULL`       | Final locked cost.                         |
| `status`          | `VARCHAR` | `CHECK`          | `confirmed`, `completed`, or `cancelled`.  |
| `meeting_point`   | `TEXT`    |                  | Mutual rendezvous location.                |

### 5. `transactions`

Immutable ledger of financial operations. Tied strictly to users and optionally to matches.

| Column     | Type      | Constraints        | Description                                           |
| ---------- | --------- | ------------------ | ----------------------------------------------------- |
| `user_id`  | `UUID`    | `FK -> users.id`   | User performing or receiving funds.                   |
| `match_id` | `UUID`    | `FK -> matches.id` | Identifies which ride the fee is for (Nullable).      |
| `type`     | `VARCHAR` | `NOT NULL, CHECK`  | `payment` (fees), `refund`, `wallet_credit` (top-up). |
| `amount`   | `DECIMAL` | `NOT NULL`         | The net movement of cash.                             |
| `status`   | `VARCHAR` | `CHECK`            | `pending`, `completed`, `failed`.                     |

### 6. `wallets`

An abstraction layer for holding the current balance cache. Prevents expensive SUM() queries on the transactions table.

| Column         | Type        | Constraints      | Description                            |
| -------------- | ----------- | ---------------- | -------------------------------------- |
| `user_id`      | `UUID`      | `FK -> users.id` | Identifies owner.                      |
| `balance`      | `DECIMAL`   | Default `0.00`   | The actively available funds.          |
| `last_updated` | `TIMESTAMP` |                  | Time of last money deduction/addition. |

---

## ⚡ Active Triggers & Logic Blocks

Supabase handles background state logic using PL/pgSQL Triggers to prevent edge cases:

1. **`on_auth_user_created` (Authentication Sync):**
   - **What it does:** When a user signs up on the frontend via Supabase Auth, they only exist in `auth.users` (managed by Supabase). This trigger automatically clones them into `public.users` so your app can query their email, name, and ID.

2. **`create_wallet_trigger` (Wallet Scaffolding):**
   - **What it does:** The instant the profile arrives in `public.users`, this executes `INSERT INTO wallets (user_id, balance) VALUES (NEW.id, 0.00);`. Meaning no user exists without a wallet.

3. **`update_updated_at_column` (Global State tracking):**
   - **What it does:** Attached to nearly every table. Whenever a row experiences an `UPDATE` event, this trigger snaps the `updated_at` (or `last_updated`) column to `NOW()`. This guarantees chronological integrity.

4. **Remote Procedure Calls (RPC):**
   - Custom PostgreSQL functions like `deduct_request_fee(rid, uid)` process atomic deductions to prevent race conditions when two people request a ride at the same millisecond.
