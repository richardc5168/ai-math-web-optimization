import importlib
import os

import httpx
import pytest


def _make_client(tmp_path):
    # Use a temp DB so tests are isolated.
    os.environ["DB_PATH"] = str(tmp_path / "test_app.db")

    import server

    importlib.reload(server)

    transport = httpx.ASGITransport(app=server.app)
    return transport


@pytest.mark.anyio
async def test_learning_practice_next_endpoint_roundtrip(tmp_path):
    transport = _make_client(tmp_path)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
        # bootstrap
        r = await client.post("/admin/bootstrap", params={"name": "Pytest"})
        assert r.status_code == 200
        api_key = r.json()["api_key"]
        headers = {"X-API-Key": api_key}

        # get student_id
        r = await client.get("/v1/students", headers=headers)
        assert r.status_code == 200
        student_id = r.json()["students"][0]["id"]

        # generate a fraction question, submit wrong once to populate learning tables
        r = await client.post(
            "/v1/questions/next", params={"student_id": student_id, "topic_key": "2"}, headers=headers
        )
        assert r.status_code == 200
        qid = r.json()["question_id"]

        r = await client.post(
            "/v1/answers/submit",
            headers=headers,
            json={
                "student_id": student_id,
                "question_id": qid,
                "user_answer": "0",
                "time_spent_sec": 5,
                "hint_level_used": 1,
            },
        )
        assert r.status_code == 200

        # practice_next
        r = await client.post(
            "/v1/learning/practice_next",
            headers=headers,
            json={
                "student_id": student_id,
                "skill_tag": "分數/小數",
                "window_days": 14,
                "seed": 123,
            },
        )
        assert r.status_code == 200
        j = r.json()
        assert j.get("ok") is True
        assert j.get("skill_tag") == "分數/小數"
        assert "mastery" in j and "status" in j["mastery"]
        assert "question" in j and j["question"].get("question_id")
        assert j["question"].get("question")
        assert "hints" in j["question"]
