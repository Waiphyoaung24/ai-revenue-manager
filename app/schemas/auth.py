"""This file contains the authentication schema for the application."""

import re
from datetime import datetime

from pydantic import (
    BaseModel,
    EmailStr,
    Field,
    SecretStr,
    field_validator,
)


class Token(BaseModel):
    """Token model for authentication.

    Attributes:
        access_token: The JWT access token.
        token_type: The type of token (always "bearer").
        expires_at: The token expiration timestamp.
    """

    access_token: str = Field(..., description="The JWT access token")
    token_type: str = Field(default="bearer", description="The type of token")
    expires_at: datetime = Field(..., description="The token expiration timestamp")


class TokenResponse(BaseModel):
    """Response model for login endpoint.

    Attributes:
        access_token: The JWT access token
        token_type: The type of token (always "bearer")
        expires_at: When the token expires
    """

    access_token: str = Field(..., description="The JWT access token")
    token_type: str = Field(default="bearer", description="The type of token")
    expires_at: datetime = Field(..., description="When the token expires")


class UserCreate(BaseModel):
    """Request model for user registration.

    Attributes:
        email: User's email address
        password: User's password
    """

    email: EmailStr = Field(..., description="User's email address")
    password: SecretStr = Field(..., description="User's password", min_length=8, max_length=64)

    @field_validator("password")
    @classmethod
    def validate_password(cls, v: SecretStr) -> SecretStr:
        """Validate password strength.

        Args:
            v: The password to validate

        Returns:
            SecretStr: The validated password

        Raises:
            ValueError: If the password is not strong enough
        """
        password = v.get_secret_value()

        # ponytail: length is the only requirement (min 8). Complexity rules
        # dropped by request — re-add character-class checks here to harden.
        if len(password) < 8:
            raise ValueError("Password must be at least 8 characters long")

        return v


class UserResponse(BaseModel):
    """Response model for user operations.

    Attributes:
        id: User's ID
        email: User's email address
        token: Authentication token
    """

    id: int = Field(..., description="User's ID")
    email: str = Field(..., description="User's email address")
    token: Token = Field(..., description="Authentication token")


class SessionResponse(BaseModel):
    """Response model for session creation.

    Attributes:
        session_id: The unique identifier for the chat session
        name: Name of the session (defaults to empty string)
        token: The authentication token for the session
    """

    session_id: str = Field(..., description="The unique identifier for the chat session")
    name: str = Field(default="", description="Name of the session", max_length=100)
    token: Token = Field(..., description="The authentication token for the session")

    @field_validator("name")
    @classmethod
    def sanitize_name(cls, v: str) -> str:
        """Sanitize the session name.

        Args:
            v: The name to sanitize

        Returns:
            str: The sanitized name
        """
        # Remove any potentially harmful characters
        sanitized = re.sub(r'[<>{}[\]()\'"`]', "", v)
        return sanitized
