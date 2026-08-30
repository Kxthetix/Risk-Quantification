"""Pytest configuration and asynchronous fixtures for test execution."""
from collections.abc import AsyncGenerator
import uuid
import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.core.database import Base, get_db
from app.core.security import create_access_token, hash_password
from app.main import app
from app.models.organization import Organization
from app.models.user import User, UserRole

TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"

test_engine = create_async_engine(
    TEST_DATABASE_URL,
    echo=False,
    future=True,
    connect_args={"check_same_thread": False},
)
test_session_factory = async_sessionmaker(
    bind=test_engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False,
)


@pytest_asyncio.fixture(scope="function")
async def db_session() -> AsyncGenerator[AsyncSession, None]:
    """Create a fresh database schema for every test function."""
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with test_session_factory() as session:
        yield session
        await session.rollback()

    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


@pytest_asyncio.fixture(scope="function")
async def client(db_session: AsyncSession) -> AsyncGenerator[AsyncClient, None]:
    """Test HTTP client with overridden database dependency."""
    async def override_get_db() -> AsyncGenerator[AsyncSession, None]:
        yield db_session

    app.dependency_overrides[get_db] = override_get_db

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac

    app.dependency_overrides.clear()


@pytest_asyncio.fixture(scope="function")
async def test_org(db_session: AsyncSession) -> Organization:
    """Fixture for a primary test organization."""
    org = Organization(
        id=uuid.uuid4(),
        name=f"Alpha Security Corp {uuid.uuid4().hex[:6]}",
        description="Primary Cyber Operations",
        industry="Defense",
    )
    db_session.add(org)
    await db_session.commit()
    await db_session.refresh(org)
    return org


@pytest_asyncio.fixture(scope="function")
async def other_org(db_session: AsyncSession) -> Organization:
    """Fixture for a secondary test organization to test isolation."""
    org = Organization(
        id=uuid.uuid4(),
        name=f"Beta Financial Ltd {uuid.uuid4().hex[:6]}",
        description="Secondary Tenant",
        industry="Banking",
    )
    db_session.add(org)
    await db_session.commit()
    await db_session.refresh(org)
    return org


@pytest_asyncio.fixture(scope="function")
async def admin_user(db_session: AsyncSession, test_org: Organization) -> User:
    """Fixture for an ADMIN user."""
    user = User(
        id=uuid.uuid4(),
        organization_id=test_org.id,
        full_name="Alice Admin",
        email=f"alice.admin.{uuid.uuid4().hex[:6]}@alpha.com",
        password_hash=hash_password("AdminPass123!"),
        role=UserRole.ADMIN,
        is_active=True,
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)
    return user


@pytest_asyncio.fixture(scope="function")
async def analyst_user(db_session: AsyncSession, test_org: Organization) -> User:
    """Fixture for a SECURITY_ANALYST user."""
    user = User(
        id=uuid.uuid4(),
        organization_id=test_org.id,
        full_name="Bob Analyst",
        email=f"bob.analyst.{uuid.uuid4().hex[:6]}@alpha.com",
        password_hash=hash_password("AnalystPass123!"),
        role=UserRole.SECURITY_ANALYST,
        is_active=True,
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)
    return user


@pytest_asyncio.fixture(scope="function")
async def manager_user(db_session: AsyncSession, test_org: Organization) -> User:
    """Fixture for a MANAGER user."""
    user = User(
        id=uuid.uuid4(),
        organization_id=test_org.id,
        full_name="Carol Manager",
        email=f"carol.manager.{uuid.uuid4().hex[:6]}@alpha.com",
        password_hash=hash_password("ManagerPass123!"),
        role=UserRole.MANAGER,
        is_active=True,
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)
    return user


@pytest_asyncio.fixture(scope="function")
async def viewer_user(db_session: AsyncSession, test_org: Organization) -> User:
    """Fixture for a VIEWER user."""
    user = User(
        id=uuid.uuid4(),
        organization_id=test_org.id,
        full_name="Dave Viewer",
        email=f"dave.viewer.{uuid.uuid4().hex[:6]}@alpha.com",
        password_hash=hash_password("ViewerPass123!"),
        role=UserRole.VIEWER,
        is_active=True,
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)
    return user


@pytest_asyncio.fixture(scope="function")
async def other_org_user(db_session: AsyncSession, other_org: Organization) -> User:
    """Fixture for a user belonging to another organization."""
    user = User(
        id=uuid.uuid4(),
        organization_id=other_org.id,
        full_name="Eve External",
        email=f"eve.external.{uuid.uuid4().hex[:6]}@beta.com",
        password_hash=hash_password("ExternalPass123!"),
        role=UserRole.ADMIN,
        is_active=True,
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)
    return user


def get_token_header(user: User) -> dict[str, str]:
    """Helper to generate JWT bearer headers for a user fixture."""
    token = create_access_token({
        "sub": str(user.id),
        "organization_id": str(user.organization_id),
        "role": user.role.value,
    })
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def admin_headers(admin_user: User) -> dict[str, str]:
    return get_token_header(admin_user)


@pytest.fixture
def analyst_headers(analyst_user: User) -> dict[str, str]:
    return get_token_header(analyst_user)


@pytest.fixture
def manager_headers(manager_user: User) -> dict[str, str]:
    return get_token_header(manager_user)


@pytest.fixture
def viewer_headers(viewer_user: User) -> dict[str, str]:
    return get_token_header(viewer_user)


@pytest.fixture
def other_org_headers(other_org_user: User) -> dict[str, str]:
    return get_token_header(other_org_user)
