"""TDD: Server API routes - libs, generate, feedback (agent mocked)."""
from __future__ import annotations

from unittest.mock import AsyncMock, MagicMock, patch
from fastapi.testclient import TestClient

from server.app import app

client = TestClient(app)


@patch("server.app.httpx.AsyncClient")
def test_flapi_search_returns_filtered_packages(mock_client_class: object) -> None:
    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.json.return_value = [
        {"Id": 1, "Name": "Pkg A", "Type": "Package", "Logo": ""},
        {"Id": 2, "Name": "Pkg B", "Type": "Other", "Logo": ""},
    ]
    mock_get = AsyncMock(return_value=mock_response)
    mock_client = AsyncMock()
    mock_client.get = mock_get
    mock_client.__aenter__.return_value = mock_client
    mock_client.__aexit__.return_value = None
    mock_client_class.return_value = mock_client

    resp = client.get("/api/flapi/packages/search", params={"q": "pkg"})
    assert resp.status_code == 200
    data = resp.json()
    assert len(data) == 1
    assert data[0]["Type"] == "Package"
    assert data[0]["Name"] == "Pkg A"


def test_list_libs_returns_array() -> None:
    resp = client.get("/api/libs")
    assert resp.status_code == 200
    data = resp.json()
    assert isinstance(data, list)
    if data:
        assert "id" in data[0] and "type" in data[0] and "files" in data[0]


@patch("server.app.httpx.AsyncClient")
@patch("server.app.put_snippet")
def test_generate_calls_agent_and_returns_injected_snippet(
    mock_put_snippet: object,
    mock_client_class: object,
) -> None:
    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.json.return_value = {
        "htmlSnippet": "<html><head></head><body>ok</body></html>",
        "librariesUsed": ["lodash"],
    }
    mock_post = AsyncMock(return_value=mock_response)
    mock_client = AsyncMock()
    mock_client.post = mock_post
    mock_client.__aenter__.return_value = mock_client
    mock_client.__aexit__.return_value = None
    mock_client_class.return_value = mock_client
    mock_put_snippet.return_value = True

    resp = client.post(
        "/api/generate",
        json={
            "fieldExplanations": [{"fieldName": "x", "explanation": "y"}],
            "userPrompt": "Chart",
            "mainCubeName": "c",
            "mainCubeData": [{}],
        },
    )
    assert resp.status_code == 200
    data = resp.json()
    assert "runId" in data
    assert "htmlSnippet" in data
    assert "librariesUsed" in data
    assert data["runId"].startswith("run_")
    mock_post.assert_called_once()


@patch("server.app.put_snippet")
@patch("server.app.httpx.AsyncClient")
def test_generate_returns_502_when_s3_upload_fails(
    mock_client_class: object,
    mock_put_snippet: object,
) -> None:
    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.json.return_value = {
        "htmlSnippet": "<html><head></head><body>ok</body></html>",
        "librariesUsed": [],
    }
    mock_post = AsyncMock(return_value=mock_response)
    mock_client = AsyncMock()
    mock_client.post = mock_post
    mock_client.__aenter__.return_value = mock_client
    mock_client.__aexit__.return_value = None
    mock_client_class.return_value = mock_client
    mock_put_snippet.return_value = False

    resp = client.post(
        "/api/generate",
        json={
            "fieldExplanations": [{"fieldName": "x", "explanation": "y"}],
            "userPrompt": "Chart",
            "mainCubeName": "c",
            "mainCubeData": [{}],
        },
    )
    assert resp.status_code == 502
    mock_put_snippet.assert_called_once()
    assert resp.json()["error"]["code"] == "storage_unavailable"


@patch("server.app.httpx.AsyncClient")
def test_feedback_404_when_agent_returns_404(mock_client_class: object) -> None:
    mock_post = AsyncMock()
    mock_post.return_value.status_code = 404
    mock_client = AsyncMock()
    mock_client.post = mock_post
    mock_client.__aenter__.return_value = mock_client
    mock_client.__aexit__.return_value = None
    mock_client_class.return_value = mock_client

    resp = client.post(
        "/api/feedback",
        json={"runId": "run_xyz", "feedback": "Make it blue"},
    )
    assert resp.status_code == 404
    assert resp.json()["error"]["code"] == "run_not_found"


@patch("server.app.httpx.AsyncClient")
def test_generate_validation_max_16_fields(mock_client_class: object) -> None:
    many = [{"fieldName": f"f{i}", "explanation": "x"} for i in range(17)]
    resp = client.post(
        "/api/generate",
        json={
            "fieldExplanations": many,
            "userPrompt": "x",
            "mainCubeName": "c",
            "mainCubeData": [],
        },
    )
    assert resp.status_code == 422
    mock_client_class.assert_not_called()


@patch("server.app.get_snippet")
def test_get_snippet_html_returns_stored_html(
    mock_get_snippet: object,
) -> None:
    mock_get_snippet.return_value = "<!DOCTYPE html><html><body>stored</body></html>"
    resp = client.get("/api/snippets/run_test.html")
    assert resp.status_code == 200
    assert "text/html" in resp.headers.get("content-type", "")
    assert "stored" in resp.text


@patch("server.app.get_snippet")
def test_get_snippet_html_returns_404_when_missing(
    mock_get_snippet: object,
) -> None:
    mock_get_snippet.return_value = None
    resp = client.get("/api/snippets/run_missing.html")
    assert resp.status_code == 404
    assert resp.json()["error"]["code"] == "run_not_found"


@patch("server.app.put_snippet")
@patch("server.app.httpx.AsyncClient")
def test_feedback_returns_502_when_s3_upload_fails(
    mock_client_class: object,
    mock_put_snippet: object,
) -> None:
    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.json.return_value = {
        "htmlSnippet": "<html><head></head><body>ok</body></html>",
        "librariesUsed": [],
    }
    mock_post = AsyncMock(return_value=mock_response)
    mock_client = AsyncMock()
    mock_client.post = mock_post
    mock_client.__aenter__.return_value = mock_client
    mock_client.__aexit__.return_value = None
    mock_client_class.return_value = mock_client
    mock_put_snippet.return_value = False

    resp = client.post(
        "/api/feedback",
        json={"runId": "run_xyz", "feedback": "Make it blue"},
    )
    assert resp.status_code == 502
    assert resp.json()["error"]["code"] == "storage_unavailable"


@patch("server.app.httpx.AsyncClient")
def test_model_prompt_returns_response_text(mock_client_class: object) -> None:
    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.json.return_value = {
        "id": "chatcmpl_123",
        "choices": [
            {
                "index": 0,
                "message": {"role": "assistant", "content": '{"result":"ok"}'},
            }
        ],
    }
    mock_post = AsyncMock(return_value=mock_response)
    mock_client = AsyncMock()
    mock_client.post = mock_post
    mock_client.__aenter__.return_value = mock_client
    mock_client.__aexit__.return_value = None
    mock_client_class.return_value = mock_client

    resp = client.post(
        "/api/model/prompt",
        json={
            "userPrompt": "Return JSON",
            "systemPrompt": "You are strict",
            "structuredOutputPrompt": "Return keys: result",
            "restrictionsPrompt": "No markdown",
        },
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["response"] == '{"result":"ok"}'
    assert "modelResponse" in body
    mock_post.assert_called_once()


@patch("server.app.httpx.AsyncClient")
def test_model_prompt_validation_requires_user_prompt(mock_client_class: object) -> None:
    resp = client.post(
        "/api/model/prompt",
        json={
            "userPrompt": "",
            "systemPrompt": "x",
            "structuredOutputPrompt": "x",
            "restrictionsPrompt": "x",
        },
    )
    assert resp.status_code == 422
    mock_client_class.assert_not_called()


@patch("server.app.httpx.AsyncClient")
def test_model_prompt_returns_502_on_upstream_error(mock_client_class: object) -> None:
    mock_response = MagicMock()
    mock_response.status_code = 500
    mock_response.text = "upstream error"
    mock_post = AsyncMock(return_value=mock_response)
    mock_client = AsyncMock()
    mock_client.post = mock_post
    mock_client.__aenter__.return_value = mock_client
    mock_client.__aexit__.return_value = None
    mock_client_class.return_value = mock_client

    resp = client.post(
        "/api/model/prompt",
        json={
            "userPrompt": "Return JSON",
            "systemPrompt": "",
            "structuredOutputPrompt": "",
            "restrictionsPrompt": "",
        },
    )
    assert resp.status_code == 502
    assert resp.json()["error"]["code"] == "model_error"
