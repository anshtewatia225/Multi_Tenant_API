# Multi-Tenant SaaS API

A production-grade multi-tenant REST API: each organization is an isolated
tenant, users belong to exactly one org, and every data query is automatically
scoped to the caller's organization. JWT auth, role-based access, and
plan-based rate limiting included.

## Stack

- **Node.js + Express**
- **MongoDB + Mongoose**
- **JWT** auth (`jsonwebtoken`), **bcryptjs** password hashing
- **express-rate-limit** for per-plan quotas
- **helmet** + **cors** for baseline hardening
- **dotenv** for configuration

## Project structure

```
.
├── server.js                 # boot: env checks, DB connect, graceful shutdown
├── src/
│   ├── app.js                # express app + middleware wiring
│   ├── config/db.js          # Mongoose connection
│   ├── models/               # Organization, User, Resource
│   ├── middleware/
│   │   ├── auth.js           # JWT decode, requireMember, requireAdmin
│   │   ├── orgScope.js       # tenant isolation (req.scope / req.stamp)
│   │   ├── rateLimit.js      # per-plan limiter + usage counter
│   │   └── errorHandler.js   # 404 + central error handler
│   ├── controllers/          # auth, resource, org
│   ├── routes/               # auth, resource, org routers
│   └── utils/                # jwt, ApiError, asyncHandler
└── .env.example
```

## Setup

```bash
npm install
copy .env.example .env   # Windows — or: cp .env.example .env on Mac/Linux
# then open .env and fill in MONGO_URI + secrets
npm run dev              # nodemon, or: npm start
```

Set `MONGO_URI` to your MongoDB Atlas connection string and replace both
secrets with long random values.


## Tenant isolation

After `authenticate`, the `orgScope` middleware exposes two helpers used by
every controller:

- `req.scope(filter)` — merges `organizationId` into a read/update filter, so a
  client can never reach another tenant's documents even by passing a foreign
  `_id`.
- `req.stamp(doc)` — forces `organizationId` + `createdBy` onto writes.

## Auth & roles

- Passwords hashed with bcrypt (cost 12); `passwordHash` is `select:false`.
- Email is unique **per organization**, not globally.
- First user of a new org is the **admin**; invited users default to **member**.
- Invite tokens are signed with a separate secret and shorter lifetime than
  session tokens.

## Rate limiting (per organization, per hour)

| Plan       | Limit       |
|------------|-------------|
| free       | 100 / hour  |
| pro        | 1000 / hour |
| enterprise | unlimited   |

## Endpoints

### Auth
| Method | Path                      | Access | Description |
|--------|---------------------------|--------|-------------|
| POST   | `/api/auth/register`      | public | Create org + admin, returns JWT |
| POST   | `/api/auth/login`         | public | Returns JWT |
| POST   | `/api/auth/invite`        | admin  | Issue an invite token for a member |
| POST   | `/api/auth/accept-invite` | public | Redeem invite token, returns JWT |

### Resources (org-scoped)
| Method | Path                  | Access |
|--------|-----------------------|--------|
| GET    | `/api/resources`      | member |
| POST   | `/api/resources`      | member |
| PUT    | `/api/resources/:id`  | admin or owner |
| DELETE | `/api/resources/:id`  | admin |

### Org
| Method | Path             | Access |
|--------|------------------|--------|
| GET    | `/api/org/usage` | admin  |
| PATCH  | `/api/org/plan`  | admin  |

### Health
`GET /health` — unauthenticated liveness probe.

## Postman collection

Import `postman_collection.json` into Postman to get all endpoints pre-wired.
Register or Login auto-saves the JWT into `{{token}}`, and Create Resource
auto-saves the ID into `{{resource_id}}` — no manual copy-pasting needed.

## Auth header

All protected routes expect:

```
Authorization: Bearer <jwt>
```

## Example flow

```bash
# 1. Register an org + admin
curl -X POST localhost:5000/api/auth/register -H 'Content-Type: application/json' \
  -d '{"orgName":"Acme","name":"Ada","email":"ada@acme.com","password":"supersecret"}'

# 2. Create a resource (use the token from step 1)
curl -X POST localhost:5000/api/resources -H 'Content-Type: application/json' \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"title":"First resource","data":{"foo":"bar"}}'

# 3. Invite a member
curl -X POST localhost:5000/api/auth/invite -H 'Content-Type: application/json' \
  -H "Authorization: Bearer $TOKEN" -d '{"email":"grace@acme.com"}'
```
