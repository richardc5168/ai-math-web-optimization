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
async def test_web_g5s_pack_loop(tmp_path):
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

        # next question (new type_key)
        r = await client.post(
            "/v1/questions/next",
            params={"student_id": student_id, "topic_key": "g5s_web_concepts_v1"},
            headers=headers,
        )
        assert r.status_code == 200
        data = r.json()
        assert data.get("question_id")
        assert data.get("question")
        assert data.get("hints")
        qid = data["question_id"]

        # hint endpoint (must work)
        r = await client.post("/v1/questions/hint", headers=headers, json={"question_id": qid, "level": 2})
        assert r.status_code == 200
        assert r.json().get("hint")

        # submit an answer (format will be wrong or right, but must not crash)
        r = await client.post(
            "/v1/answers/submit",
            headers=headers,
            json={
                "student_id": student_id,
                "question_id": qid,
                "user_answer": "0",
                "time_spent_sec": 3,
            },
        )
        assert r.status_code == 200
        j = r.json()
        assert "is_correct" in j
        assert "correct_answer" in j
