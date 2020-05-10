from flask_sqlalchemy import SQLAlchemy
from sqlalchemy.dialects.postgresql import UUID
import uuid

db = SQLAlchemy()


class BaseModel(db.Model):
  """Base data model for all objects"""
  __abstract__ = True
  # define here __repr__ and json methods or any common method
  # that you need for all your models

class Users(BaseModel):
  __tablename__ = 'Users'
  id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, unique=True, nullable=False)
  username = db.Column(db.String(20))
  password = db.Column(db.String(20))


class ActiveGames(BaseModel):
  __tablename__ = 'ActiveGames'
  id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, unique=True, nullable=False)
  numPlayers = db.Column(db.Integer, default=2)
  
