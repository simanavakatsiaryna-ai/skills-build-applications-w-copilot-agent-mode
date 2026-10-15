# OctoFit Tracker architecture

OctoFit Tracker is a three-tier application for a school fitness program. The starter code includes API contracts and intentionally incomplete implementation points so you can use GitHub Copilot agent mode in a test-driven loop.

![Three-tier OctoFit architecture](../.github/images/octofit-architecture.svg)

## Tier boundaries

- **Presentation tier**: React 19, Vite, React Router, Bootstrap, and a shared API client in `octofit-tracker/frontend/src`.
- **Logic tier**: Express and TypeScript routes/services in `octofit-tracker/backend/src` expose `/api/*` behavior on port `8000`.
- **Data tier**: Mongoose models and seed data in `octofit-tracker/backend/src/models` and `src/scripts/seed.ts` persist to MongoDB on port `27017`.

## Ports and environment rules

- MongoDB: `27017`
- Express API: `8000`
- Vite frontend: `5173`
- The browser calls relative `/api` paths. Vite proxies them to `http://localhost:8000`, so the unauthenticated API port stays private in Codespaces. `VITE_API_BASE_URL` can override the base URL.

## API contract

| Capability | Method and path | Expected behavior |
| --- | --- | --- |
| Activity tracking | `GET /api/activities`, `POST /api/activities` | List and create valid activity records. POST accepts `userId`, `teamId`, `type`, and `minutes`; `userId` and `teamId` must be well-formed IDs for an existing user and team; otherwise respond with a deliberate 4xx (never a 500 from a cast error). A created activity stores the submitted `user`, `team`, `type`, and `minutes` plus computed `points` and `occurredAt`. |
| Teams | `GET /api/teams`, `POST /api/teams` | List and create teams with members. Created and listed teams keep the submitted `name` and `mascot`. Reject a team without a name with `400`. |
| Leaderboard | `GET /api/leaderboard` | Return teams ordered by the sum of their activity points, highest first. Each entry has `teamName`, `totalPoints`, and a 1-based `rank`. |
| Workout suggestions | `GET /api/workouts/suggestions/:userEmail` | Recommend workouts from recent activity patterns for the matching seeded user's email address. The first suggestion's `focus` matches that user's goal or recent activity, with a `reason` explaining why. An email with no matching user returns a deliberate 4xx (for example, `404`). |

## Implementation decisions

Record your plan here before editing code.

- Presentation tier decision: Keep React pages responsible for rendering and user-facing loading, empty, and error states; use the shared API client and the existing relative `/api` URLs rather than putting data logic in components.
- Logic tier decision: Keep route handlers thin and put validation and capability behavior in `octofitService.ts`; return deliberate 4xx responses for invalid input and unknown users. Do not add authentication.
- Data tier decision: Use Mongoose schemas with required fields and references that match the API contract; default team members to an empty array. Keep the existing seed idempotent and preserve records it does not own.
- Activity tracking approach: Validate the activity type, positive minutes, and well-formed IDs for an existing user and team before writing. Store the references, submitted values, computed points (one point per minute), and occurrence time.
- Team management approach: Require a non-empty name, preserve the submitted name and mascot, and support the supplied member references. Return populated/listed data in the contract shape.
- Leaderboard approach: Sum activity points by team, sort totals descending, and return each team's name, total, and 1-based rank.
- Workout suggestions approach: Find the user by email, match available workouts to the user's fitness goal or recent activity, and include a short reason. Return a deliberate 4xx response when the email is unknown.

## Test plan

Run the checks in dependency order: data contract, API contract, frontend contract, then builds. A failure should be traced to the tier named by that check before changing a dependent tier.

- Data tier: `npm run test:data --prefix octofit-tracker/backend` checks required model fields, defaults, references, and safe/idempotent seeding. Failures indicate schema or seed behavior does not satisfy the persistence contract.
- Logic tier: `npm run test:api --prefix octofit-tracker/backend` checks input validation, status codes, stored activity values, team members, leaderboard totals/ranks, and user-specific workout matching. Failures indicate service or route behavior violates the API contract.
- Presentation tier: `npm test --prefix octofit-tracker/frontend` checks fetched content, workout request URL, and accessible loading, empty, and API-error states on all routes. Failures indicate client integration or page state/rendering issues.
- Backend build: `npm run build --prefix octofit-tracker/backend` checks TypeScript compilation; failures indicate backend type or module errors.
- Frontend build: `npm run build --prefix octofit-tracker/frontend` checks TypeScript and Vite production bundling; failures indicate frontend type or build errors.

Current verification: the data contract suite passes all 5 tests, the API contract suite passes all 4 tests, and the frontend contract suite passes all 15 tests. Both backend and frontend production builds pass.
