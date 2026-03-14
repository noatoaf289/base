"""S3-compatible storage for generated HTML snippets."""
from __future__ import annotations

import os


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
    """Upload injected HTML to S3. Key: snippets/<run_id>.html. Returns True if uploaded."""
    client = _client()
    if not client:
        return False
    bucket = os.environ.get("S3_BUCKET", "visualis").strip()
    key = f"snippets/{run_id}.html"
    try:
        client.put_object(
            Bucket=bucket,
            Key=key,
            Body=html.encode("utf-8"),
            ContentType="text/html; charset=utf-8",
        )
        return True
    except Exception:
        return False


def get_snippet(run_id: str) -> str | None:
    """Download HTML from S3. Returns None when not found/unavailable."""
    client = _client()
    if not client:
        return None
    bucket = os.environ.get("S3_BUCKET", "visualis").strip()
    key = f"snippets/{run_id}.html"
    try:
        obj = client.get_object(Bucket=bucket, Key=key)
        body = obj.get("Body")
        if body is None:
            return None
        data = body.read()
        if isinstance(data, bytes):
            return data.decode("utf-8", errors="replace")
        return str(data)
    except Exception:
        return None
