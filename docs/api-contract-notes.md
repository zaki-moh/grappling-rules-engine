# API Contract Notes

Saved from planning discussion for frontend/backend integration.

## Core Resources

### `rulesets`

Purpose: expose which scoring systems exist, like `IBJJF` and `ADCC`.

Frontend use: fetch available rules and let the user choose one.

### `matches`

Purpose: represent one analysis session or bout.

Frontend use: create a match after the user picks a ruleset and enters competitors. The backend returns a `match_id`, and that becomes the handle for everything else.

### `scoring_events`

Purpose: represent individual machine-proposed scoring moments within a match.

Frontend use: fetch/display them in the review UI and review them one by one.

## Relationship Model

- One `ruleset` can be used by many `matches`
- One `match` has one chosen `ruleset`
- One `match` has many `scoring_events`
- Each `scoring_event` belongs to exactly one `match`

So `match -> scoring_events` is a one-to-many relationship.

## Endpoint Purposes

### `GET /rulesets`

Returns available rulesets.

Used on setup/create-match flow.

### `GET /rulesets/{ruleset_id}`

Returns details for one ruleset.

Useful if the frontend wants deeper rules metadata.

### `POST /matches`

Creates a new match.

This is where the frontend submits `ruleset_id` and competitor info.

### `GET /matches`

Lists matches.

Useful for a future dashboard/history page.

### `GET /matches/{match_id}`

Returns one match’s metadata.

### `PATCH /matches/{match_id}`

Updates limited match metadata, like competitor names or ruleset before analysis begins.

### `POST /matches/{match_id}/analysis`

Starts analysis for a match.

Right now this is the workflow trigger; later it becomes the CV kickoff point.

### `POST /scoring_events`

Creates a new scoring event for a match.

Right now the CV/backend pipeline would use this shape to store detected events.

### `GET /matches/{match_id}/scoring_events`

Returns all scoring events for that match.

This is what the review page will use heavily.

### `PATCH /matches/{match_id}/scoring_events/{event_id}/review`

Updates one scoring event’s review status/note.

This is how Accept/Reject/Reset should reach the backend.

### `GET /matches/{match_id}/score_summary`

Returns score summary for the match.

This is the backend’s computed scoring view.

## Frontend/Backend Flow

1. Frontend calls `GET /rulesets`
2. User chooses one
3. Frontend calls `POST /matches`
4. Backend returns `match.id`
5. Frontend routes to `/matches/{matchId}`
6. Frontend calls `POST /matches/{match_id}/analysis`
7. Backend/CV creates scoring events
8. Frontend calls `GET /matches/{match_id}/scoring_events`
9. Frontend calls `GET /matches/{match_id}/score_summary`
10. User reviews events
11. Frontend calls `PATCH /matches/{match_id}/scoring_events/{event_id}/review`
12. Frontend refetches or locally updates events/score

## Naming Note

The frontend and backend should use the same field names.

Previous frontend mock names:

- `reviewStatus`
- `reviewNote`
- `competitor: "Red" | "Blue"`

Backend contract names:

- `review_status`
- `review_note`
- `team: "red" | "blue"`

The project should normalize to the backend contract naming.

## Short Summary

- `rulesets` define scoring systems
- `matches` define one analysis session
- `scoring_events` define machine-detected point-worthy moments inside that match
- review endpoints let the user confirm or reject those events
- score summary is derived from those reviewed events

