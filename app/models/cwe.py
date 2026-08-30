"""CWE (Common Weakness Enumeration) dictionary ORM model."""
import uuid
from typing import TYPE_CHECKING, List

from sqlalchemy import Index, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base, GUID, TimestampMixin

if TYPE_CHECKING:
    from app.models.vulnerability import Vulnerability


class CWE(Base, TimestampMixin):
    """CWE dictionary definition representing a type of software weakness."""
    __tablename__ = "cwes"

    id: Mapped[uuid.UUID] = mapped_column(
        GUID,
        primary_key=True,
        default=uuid.uuid4,
        index=True,
    )
    cwe_id: Mapped[str] = mapped_column(
        String(20),
        unique=True,
        nullable=False,
        index=True,
    )  # e.g. "CWE-79", "CWE-89"
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=True)

    # Relationships
    vulnerabilities: Mapped[List["Vulnerability"]] = relationship(
        "Vulnerability",
        secondary="vulnerability_cwes",
        back_populates="cwes",
        lazy="selectin",
    )

    def __repr__(self) -> str:
        return f"<CWE(cwe_id='{self.cwe_id}', name='{self.name}')>"
