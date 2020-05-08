from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()


class BaseModel(db.Model):
  """Base data model for all objects"""
  __abstract__ = True
  # define here __repr__ and json methods or any common method
  # that you need for all your models

class Users(BaseModel):
  """model for one of your table"""
  __tablename__ = 'Users'
  uid = db.Column(db.Integer, primary_key=True)
  username = db.Column(db.String(20))
  password = db.Column(db.String(20))
