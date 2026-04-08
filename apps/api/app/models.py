from sqlalchemy import Column, Integer, JSON, String, UniqueConstraint

from app.db import Base


class AcademyTenantState(Base):
    __tablename__ = "academy_tenant_states"
    __table_args__ = (UniqueConstraint("tenant_name", name="uq_academy_tenant_state_tenant"),)

    id = Column(Integer, primary_key=True, index=True)
    tenant_name = Column(String, index=True, nullable=False)
    state = Column(JSON, nullable=False)
    created_at = Column(String, nullable=False)
    updated_at = Column(String, nullable=False)


class AcademyUserCredential(Base):
    __tablename__ = "academy_user_credentials"
    __table_args__ = (UniqueConstraint("tenant_name", "email", name="uq_academy_user_credential"),)

    id = Column(Integer, primary_key=True, index=True)
    tenant_name = Column(String, index=True, nullable=False)
    email = Column(String, nullable=False)
    full_name = Column(String, nullable=False)
    role = Column(String, nullable=False)
    password_hash = Column(String, nullable=False)
    created_at = Column(String, nullable=False)
    updated_at = Column(String, nullable=False)


class AcademyAuthSession(Base):
    __tablename__ = "academy_auth_sessions"

    id = Column(Integer, primary_key=True, index=True)
    session_token = Column(String, unique=True, index=True, nullable=False)
    tenant_name = Column(String, index=True, nullable=False)
    email = Column(String, nullable=False)
    full_name = Column(String, nullable=False)
    role = Column(String, nullable=False)
    created_at = Column(String, nullable=False)
    expires_at = Column(String, nullable=False)
    revoked_at = Column(String, nullable=True)
