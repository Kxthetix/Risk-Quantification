import uuid
from typing import List, Optional
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import DuplicateResourceError, NotFoundError
from app.core.security import hash_password
from app.models.user import User, UserRole
from app.schemas.user import UserCreate, UserUpdate


class UserService:
    @staticmethod
    async def get_by_id(db: AsyncSession, user_id: uuid.UUID) -> User:
        stmt = select(User).where(User.id == user_id)
        result = await db.execute(stmt)
        user = result.scalar_one_or_none()
        if not user:
            raise NotFoundError(
                message=f"User with id '{user_id}' was not found.",
                error_code="USER_NOT_FOUND",
            )
        return user

    @staticmethod
    async def get_by_email(db: AsyncSession, email: str) -> Optional[User]:
        normalized_email = email.lower().strip()
        stmt = select(User).where(User.email == normalized_email)
        result = await db.execute(stmt)
        return result.scalar_one_or_none()

    @staticmethod
    async def list_by_organization(
        db: AsyncSession,
        organization_id: uuid.UUID,
        skip: int = 0,
        limit: int = 100,
    ) -> List[User]:
        stmt = (
            select(User)
            .where(User.organization_id == organization_id)
            .offset(skip)
            .limit(limit)
            .order_by(User.created_at.desc())
        )
        result = await db.execute(stmt)
        return list(result.scalars().all())

    @staticmethod
    async def create(
        db: AsyncSession,
        user_in: UserCreate,
        organization_id: uuid.UUID,
    ) -> User:
        normalized_email = user_in.email.lower().strip()
        existing_user = await UserService.get_by_email(db, normalized_email)
        if existing_user:
            raise DuplicateResourceError(
                message=f"A user with email '{normalized_email}' already exists.",
                error_code="USER_ALREADY_EXISTS",
            )

        hashed_pwd = hash_password(user_in.password)
        user = User(
            organization_id=organization_id,
            full_name=user_in.full_name,
            email=normalized_email,
            password_hash=hashed_pwd,
            role=user_in.role,
            is_active=True,
        )
        db.add(user)
        await db.flush()
        await db.refresh(user)
        return user

    @staticmethod
    async def update(
        db: AsyncSession,
        user_id: uuid.UUID,
        user_in: UserUpdate,
    ) -> User:
        user = await UserService.get_by_id(db, user_id)

        if user_in.full_name is not None:
            user.full_name = user_in.full_name
        if user_in.role is not None:
            user.role = user_in.role
        if user_in.is_active is not None:
            user.is_active = user_in.is_active

        await db.flush()
        await db.refresh(user)
        return user


user_service = UserService()
