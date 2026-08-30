import hashlib
from datetime import datetime, timedelta, timezone
from typing import Any, Optional, Tuple
import uuid
import bcrypt
import jwt

from app.core.config import settings
from app.core.exceptions import AuthenticationError


def hash_password(password: str) -> str:
    """Hash a plaintext password securely using bcrypt with 12 salt rounds."""
    if not password:
        raise ValueError("Password cannot be empty")
    pwd_bytes = password.encode("utf-8")
    salt = bcrypt.gensalt(rounds=12)
    return bcrypt.hashpw(pwd_bytes, salt).decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a plaintext password against its bcrypt hash in constant time."""
    if not plain_password or not hashed_password:
        return False
    try:
        return bcrypt.checkpw(
            plain_password.encode("utf-8"),
            hashed_password.encode("utf-8")
        )
    except Exception:
        return False


def hash_token(token_or_jti: str) -> str:
    """Compute a SHA-256 hash of a token or JTI identifier for safe database indexing."""
    return hashlib.sha256(token_or_jti.encode("utf-8")).hexdigest()


def create_access_token(
    data: dict[str, Any],
    expires_delta: Optional[timedelta] = None
) -> str:
    """Generate a signed JWT access token containing subject and custom claims."""
    to_encode = data.copy()
    now = datetime.now(timezone.utc)
    if expires_delta:
        expire = now + expires_delta
    else:
        expire = now + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    token_jti = str(uuid.uuid4())
    to_encode.update({
        "iat": int(now.timestamp()),
        "exp": int(expire.timestamp()),
        "jti": token_jti,
        "type": "access",
    })
    
    encoded_jwt = jwt.encode(
        to_encode,
        settings.JWT_SECRET_KEY,
        algorithm=settings.JWT_ALGORITHM
    )
    return encoded_jwt


def create_refresh_token(
    data: dict[str, Any],
    expires_delta: Optional[timedelta] = None
) -> Tuple[str, str, datetime]:
    """Generate a signed JWT refresh token and return (encoded_token, jti, expires_at)."""
    to_encode = data.copy()
    now = datetime.now(timezone.utc)
    if expires_delta:
        expire = now + expires_delta
    else:
        expire = now + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    
    token_jti = str(uuid.uuid4())
    to_encode.update({
        "iat": int(now.timestamp()),
        "exp": int(expire.timestamp()),
        "jti": token_jti,
        "type": "refresh",
    })
    
    encoded_jwt = jwt.encode(
        to_encode,
        settings.JWT_SECRET_KEY,
        algorithm=settings.JWT_ALGORITHM
    )
    return encoded_jwt, token_jti, expire


def decode_access_token(token: str) -> dict[str, Any]:
    """Decode and validate a JWT access token."""
    try:
        payload = jwt.decode(
            token,
            settings.JWT_SECRET_KEY,
            algorithms=[settings.JWT_ALGORITHM]
        )
        if payload.get("type") == "refresh":
            raise AuthenticationError(
                message="Cannot use refresh token as an access token.",
                error_code="TOKEN_TYPE_INVALID",
            )
        return payload
    except jwt.ExpiredSignatureError:
        raise AuthenticationError(
            message="Token has expired. Please log in again.",
            error_code="TOKEN_EXPIRED"
        )
    except jwt.InvalidTokenError:
        raise AuthenticationError(
            message="Invalid or malformed token.",
            error_code="TOKEN_INVALID"
        )


def decode_refresh_token(token: str) -> dict[str, Any]:
    """Decode and validate a JWT refresh token."""
    try:
        payload = jwt.decode(
            token,
            settings.JWT_SECRET_KEY,
            algorithms=[settings.JWT_ALGORITHM]
        )
        if payload.get("type") != "refresh":
            raise AuthenticationError(
                message="Invalid token type: expected refresh token.",
                error_code="TOKEN_TYPE_INVALID",
            )
        return payload
    except jwt.ExpiredSignatureError:
        raise AuthenticationError(
            message="Refresh token has expired. Please log in again.",
            error_code="REFRESH_TOKEN_EXPIRED"
        )
    except jwt.InvalidTokenError:
        raise AuthenticationError(
            message="Invalid or malformed refresh token.",
            error_code="REFRESH_TOKEN_INVALID"
        )
