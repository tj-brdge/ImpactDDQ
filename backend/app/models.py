from sqlalchemy import Column, Integer, String, Text, Float, DateTime, ForeignKey, Table, JSON, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime, timezone

from app.database import Base

research_output_tags = Table(
    "research_output_tags",
    Base.metadata,
    Column("research_output_id", Integer, ForeignKey("research_outputs.id"), primary_key=True),
    Column("tag_id", Integer, ForeignKey("tags.id"), primary_key=True),
)


class Company(Base):
    __tablename__ = "companies"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    sector = Column(String(100), nullable=False)
    stage = Column(String(50), nullable=False)
    location = Column(String(255), nullable=False)
    founded_year = Column(Integer, nullable=False)
    description = Column(Text, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    research_outputs = relationship("ResearchOutput", back_populates="company")


class ResearchOutput(Base):
    __tablename__ = "research_outputs"

    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    template_id = Column(Integer, ForeignKey("ddq_templates.id"), nullable=True)
    ddq_output = Column(JSON, nullable=False)
    source_documents = Column(JSON)  # list of {filename, doc_type}
    status = Column(String(50), default="approved")  # draft, approved
    analyst_feedback = Column(JSON)  # per-section feedback
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    company = relationship("Company", back_populates="research_outputs")
    template = relationship("DDQTemplate")
    tags = relationship("Tag", secondary=research_output_tags, back_populates="research_outputs")


class Tag(Base):
    __tablename__ = "tags"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False, unique=True)

    research_outputs = relationship("ResearchOutput", secondary=research_output_tags, back_populates="tags")


class DDQTemplate(Base):
    __tablename__ = "ddq_templates"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    sections = Column(JSON, nullable=False)  # list of {key, title, guidance}
    is_default = Column(Boolean, default=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
