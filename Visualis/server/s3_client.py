"""S3-compatible storage for generated HTML snippets. When S3 is not configured, uses in-memory fallback so publish/preview links work."""
from __future__ import annotations

import os

# In-memory fallback when S3_URL is not set; allows GET /api/snippets/<run_id>.html to work without S3.
_memory_snippets: dict[str, str] = {}
_MAX_MEMORY_SNIPPETS = 200


def _client():
    try:
        import boto3
        from botocore.config import Config
    except ImportError:
        return None
    url = os.environ.get("S3_URL", "").strip()
    key = os.environ.get("S3_ACCESS_KEY", "").strip()
    secret = os.environ.get("S3_SECRET_KEY", "").strip()
    if not url or not key or not secret:
        return None
    endpoint = url.replace("https://", "").replace("http://", "").split("/")[0]
    is_secure = url.strip().lower().startswith("https")
    return boto3.client(
        "s3",
        endpoint_url=f"{'https' if is_secure else 'http'}://{endpoint}",
        aws_access_key_id=key,
        aws_secret_access_key=secret,
        config=Config(signature_version="s3v4"),
        region_name=os.environ.get("AWS_REGION", "us-east-1"),
    )


def put_snippet(run_id: str, html: str) -> bool:
    """Store snippet: upload to S3 when configured, and always keep in-memory fallback for GET /api/snippets/<run_id>.html."""
    client = _client()
    if client:
        bucket = os.environ.get("S3_BUCKET", "visualis").strip()
        key = f"snippets/{run_id}.html"
        try:
            client.put_object(
                Bucket=bucket,
                Key=key,
                Body=html.encode("utf-8"),
                ContentType="text/html; charset=utf-8",
            )
        except Exception:
            pass
    # In-memory fallback so publish link works when S3 is not configured
    if len(_memory_snippets) >= _MAX_MEMORY_SNIPPETS:
        # Evict oldest (first inserted) keys; dict is insertion-ordered in Python 3.7+
        for k in list(_memory_snippets.keys())[:_MAX_MEMORY_SNIPPETS // 2]:
            del _memory_snippets[k]
    _memory_snippets[run_id] = html
    return client is not None


def get_snippet(run_id: str) -> str | None:
    """Return snippet from S3 when configured, else from in-memory fallback. None when not found."""
    client = _client()
    if client:
        bucket = os.environ.get("S3_BUCKET", "visualis").strip()
        key = f"snippets/{run_id}.html"
        try:
            obj = client.get_object(Bucket=bucket, Key=key)
            body = obj.get("Body")
            if body is not None:
                data = body.read()
                if isinstance(data, bytes):
                    return data.decode("utf-8", errors="replace")
                return str(data)
        except Exception:
            pass
    return _memory_snippets.get(run_id)
