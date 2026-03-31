from typing import Any

from fastapi import FastAPI, HTTPException

app = FastAPI()

RULESETS = {
    "ibjjf": {
        "id": "ibjjf",
        "name": "IBJJF",
        "type": "system",
    },
    "adcc": {
        "id": "adcc",
        "name": "ADCC",
        "type": "system",
    },
}

MATCHES: list[dict[str, Any]] = []
SCORING_EVENTS_BY_MATCH: dict[int, list[dict[str, Any]]] = {}
ALLOWED_REVIEW_STATUSES = {"pending", "accepted", "rejected"}


@app.get("/")
def read_root():
    return {"message": "Backend is running"}


@app.get("/rulesets")
def list_rulesets():
    return {"rulesets": list(RULESETS.values())}


@app.get("/rulesets/{ruleset_id}")
def get_ruleset(ruleset_id: str):
    ruleset = RULESETS.get(ruleset_id)

    if not ruleset:
        raise HTTPException(status_code=404, detail="ruleset not found")

    return {"ruleset": ruleset}


@app.post("/scoring_events")
def create_scoring_event(scoring_event: dict[str, Any]):
    match_id = scoring_event.get("match_id")

    if not isinstance(match_id, int):
        raise HTTPException(status_code=400, detail="match_id must be an integer")

    stored_event = {
        "id": len(SCORING_EVENTS_BY_MATCH.get(match_id, [])) + 1,
        **scoring_event,
    }
    stored_event.setdefault("review_status", "pending")

    SCORING_EVENTS_BY_MATCH.setdefault(match_id, []).append(stored_event)

    return {"message": "Scoring event created", "event": stored_event}


@app.get("/matches")
def get_matches():
    return {"matches": MATCHES}


@app.get("/matches/{match_id}/scoring_events")
def get_scoring_events(match_id: int):
    return {
        "match_id": match_id,
        "scoring_events": SCORING_EVENTS_BY_MATCH.get(match_id, []),
    }


@app.patch("/matches/{match_id}/scoring_events/{event_id}/review")
def review_scoring_event(match_id: int, event_id: int, review: dict[str, Any]):
    match_events = SCORING_EVENTS_BY_MATCH.get(match_id)

    if match_events is None:
        raise HTTPException(status_code=404, detail="match not found")

    review_status = review.get("review_status")
    if review_status not in ALLOWED_REVIEW_STATUSES:
        raise HTTPException(
            status_code=400,
            detail="review_status must be one of: pending, accepted, rejected",
        )

    event = next(
        (scoring_event for scoring_event in match_events if scoring_event.get("id") == event_id),
        None,
    )
    if event is None:
        raise HTTPException(status_code=404, detail="scoring event not found")

    event["review_status"] = review_status

    review_note = review.get("review_note")
    if review_note is not None:
        event["review_note"] = review_note

    return {"message": "Scoring event review status updated", "event": event}


@app.get("/health")
def health_check():
    return {"status": "ok"}
