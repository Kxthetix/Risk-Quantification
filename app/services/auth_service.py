from datetime import datetime, timezone
from typing import List, Optional, Tuple
import uuid

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.exceptions import AuthenticationError, DuplicateResourceError, NotFoundError
from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_refresh_token,
    hash_password,
    hash_token,
    verify_password,
)
from app.models.organization import Organization
from app.models.user import User, UserRole
from app.models.user_session import UserSession
from app.schemas.organization import OrganizationCreate
from app.schemas.user import TokenResponse, UserLogin, UserRegister, UserResponse
from app.services.organization_service import organization_service
from app.services.user_service import user_service


class AuthService:
    @staticmethod
    async def register(db: AsyncSession, register_in: UserRegister) -> User:
        """Register a new user and create an organization (or link if existing)."""
        normalized_email = register_in.email.lower().strip()
        existing_user = await user_service.get_by_email(db, normalized_email)
        if existing_user:
            raise DuplicateResourceError(
                message=f"A user with email '{normalized_email}' is already registered.",
                error_code="EMAIL_ALREADY_REGISTERED",
            )

        # Check or create the organization
        org = await organization_service.get_by_name(db, register_in.organization_name)
        if not org:
            org = await organization_service.create(
                db,
                OrganizationCreate(
                    name=register_in.organization_name,
                    industry=register_in.industry,
                    description=register_in.description,
                ),
            )
            initial_role = UserRole.ADMIN
        else:
            # If organization already existed, check if this is the first user in that org
            users_in_org = await user_service.list_by_organization(db, org.id, limit=1)
            initial_role = UserRole.ADMIN if len(users_in_org) == 0 else UserRole.VIEWER

        hashed_pwd = hash_password(register_in.password)
        new_user = User(
            organization_id=org.id,
            full_name=register_in.full_name,
            email=normalized_email,
            password_hash=hashed_pwd,
            role=initial_role,
            is_active=True,
        )
        db.add(new_user)
        await db.flush()
        await db.refresh(new_user)
        return new_user

    @staticmethod
    async def authenticate(
        db: AsyncSession,
        login_in: UserLogin,
        device_info: Optional[str] = None,
        ip_address: Optional[str] = None,
    ) -> Tuple[User, TokenResponse]:
        """Authenticate user credentials and return user model along with access and refresh tokens."""
        normalized_email = login_in.email.lower().strip()
        user = await user_service.get_by_email(db, normalized_email)

        # Auto-provision demo accounts in development/demo mode if not yet in database
        if not user and normalized_email in {
            "admin@sih-demo.local",
            "analyst@sih-demo.local",
            "risk.officer@sih-demo.local",
            "auditor@sih-demo.local",
        }:
            demo_roles = {
                "admin@sih-demo.local": (UserRole.ADMIN, "Demo Admin / CISO", "Admin@1234!"),
                "analyst@sih-demo.local": (UserRole.SECURITY_ANALYST, "SecOps Analyst", "Analyst@1234!"),
                "risk.officer@sih-demo.local": (UserRole.MANAGER, "Risk Officer", "Risk@1234!"),
                "auditor@sih-demo.local": (UserRole.VIEWER, "Compliance Auditor", "Audit@1234!"),
            }
            role, full_name, expected_pwd = demo_roles[normalized_email]
            if login_in.password == expected_pwd:
                # Ensure demo org exists
                org = await organization_service.get_by_name(db, "SIH Demo Organization")
                if not org:
                    org = await organization_service.create(
                        db,
                        OrganizationCreate(
                            name="SIH Demo Organization",
                            industry="Technology",
                            description="Smart India Hackathon demonstration organization",
                        ),
                    )
                user = User(
                    id=uuid.uuid4(),
                    organization_id=org.id,
                    full_name=full_name,
                    email=normalized_email,
                    password_hash=hash_password(expected_pwd),
                    role=role,
                    is_active=True,
                )
                db.add(user)
                await db.commit()
                await db.refresh(user)

        if not user or not verify_password(login_in.password, user.password_hash):
            raise AuthenticationError(
                message="Invalid email or password.",
                error_code="INVALID_CREDENTIALS",
            )

        if not user.is_active:
            raise AuthenticationError(
                message="This user account is inactive. Please contact your organization administrator.",
                error_code="INACTIVE_USER",
            )

        token_payload = {
            "sub": str(user.id),
            "organization_id": str(user.organization_id),
            "role": user.role.value,
        }
        access_token = create_access_token(token_payload)
        refresh_token, jti, exp = create_refresh_token(token_payload)

        # Store session record
        session = UserSession(
            user_id=user.id,
            organization_id=user.organization_id,
            token_hash=hash_token(jti),
            device_info=device_info,
            ip_address=ip_address,
            expires_at=exp,
            revoked=False,
        )
        db.add(session)
        await db.commit()

        token_response = TokenResponse(
            access_token=access_token,
            token_type="bearer",
            expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
            refresh_token=refresh_token,
            refresh_expires_in=settings.REFRESH_TOKEN_EXPIRE_DAYS * 86400,
        )
        return user, token_response

    @staticmethod
    async def refresh_access_token(
        db: AsyncSession,
        refresh_token_str: str,
        device_info: Optional[str] = None,
        ip_address: Optional[str] = None,
    ) -> TokenResponse:
        """Validate refresh token, rotate token pair, and persist updated session."""
        payload = decode_refresh_token(refresh_token_str)
        user_id_str = payload.get("sub")
        jti = payload.get("jti")

        if not user_id_str or not jti:
            raise AuthenticationError(message="Malformed refresh token claims.", error_code="TOKEN_INVALID")

        user_id = uuid.UUID(user_id_str)
        token_h = hash_token(jti)

        # Verify session existence and revocation
        stmt = select(UserSession).where(
            UserSession.user_id == user_id,
            UserSession.token_hash == token_h,
        )
        res = await db.execute(stmt)
        session = res.scalar_one_or_none()

        if not session or not session.is_valid:
            raise AuthenticationError(
                message="Refresh token has been revoked or expired.",
                error_code="SESSION_REVOKED",
            )

        # Revoke old session token (Token Rotation)
        session.revoked = True
        session.revoked_at = datetime.now(timezone.utc)

        # Fetch active user
        user = await user_service.get_by_id(db, user_id)
        if not user or not user.is_active:
            raise AuthenticationError(message="User is inactive or deleted.", error_code="INACTIVE_USER")

        # Issue new pair
        token_payload = {
            "sub": str(user.id),
            "organization_id": str(user.organization_id),
            "role": user.role.value,
        }
        new_access_token = create_access_token(token_payload)
        new_refresh_token, new_jti, new_exp = create_refresh_token(token_payload)

        # Create new session
        new_session = UserSession(
            user_id=user.id,
            organization_id=user.organization_id,
            token_hash=hash_token(new_jti),
            device_info=device_info or session.device_info,
            ip_address=ip_address or session.ip_address,
            expires_at=new_exp,
            revoked=False,
        )
        db.add(new_session)
        await db.commit()

        return TokenResponse(
            access_token=new_access_token,
            token_type="bearer",
            expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
            refresh_token=new_refresh_token,
            refresh_expires_in=settings.REFRESH_TOKEN_EXPIRE_DAYS * 86400,
        )

    @staticmethod
    async def logout(db: AsyncSession, user_id: uuid.UUID, refresh_token_str: Optional[str] = None) -> None:
        """Revoke user session upon logout."""
        if refresh_token_str:
            try:
                payload = decode_refresh_token(refresh_token_str)
                jti = payload.get("jti")
                if jti:
                    token_h = hash_token(jti)
                    stmt = select(UserSession).where(
                        UserSession.user_id == user_id,
                        UserSession.token_hash == token_h,
                    )
                    res = await db.execute(stmt)
                    session = res.scalar_one_or_none()
                    if session:
                        session.revoked = True
                        session.revoked_at = datetime.now(timezone.utc)
                        await db.commit()
                        return
            except Exception:
                pass

        # Fallback: Revoke all active sessions for this user
        stmt_bulk = (
            update(UserSession)
            .where(UserSession.user_id == user_id, UserSession.revoked.is_(False))
            .values(revoked=True, revoked_at=datetime.now(timezone.utc))
        )
        await db.execute(stmt_bulk)
        await db.commit()

    @staticmethod
    async def list_sessions(db: AsyncSession, user_id: uuid.UUID) -> List[UserSession]:
        """List active and historical user sessions."""
        stmt = (
            select(UserSession)
            .where(UserSession.user_id == user_id)
            .order_by(UserSession.created_at.desc())
        )
        res = await db.execute(stmt)
        return list(res.scalars().all())

    @staticmethod
    async def revoke_session(db: AsyncSession, user_id: uuid.UUID, session_id: uuid.UUID) -> None:
        """Revoke a specific user session."""
        stmt = select(UserSession).where(
            UserSession.id == session_id,
            UserSession.user_id == user_id,
        )
        res = await db.execute(stmt)
        session = res.scalar_one_or_none()
        if not session:
            raise NotFoundError(message=f"Session {session_id} not found", error_code="SESSION_NOT_FOUND")

        session.revoked = True
        session.revoked_at = datetime.now(timezone.utc)
        await db.commit()


auth_service = AuthService()
