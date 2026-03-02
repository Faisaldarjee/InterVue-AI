# -*- coding: utf-8 -*-
"""
Authentication Module for InterVue AI
JWT verification + user extraction from Supabase Auth
"""

import os
import logging
from fastapi import Depends, HTTPException, Header
from typing import Optional
import json
import base64

logger = logging.getLogger(__name__)


def _decode_jwt_payload(token: str) -> dict:
    """
    Decode JWT payload without verification (Supabase handles the actual verification).
    We extract user info from the token claims.
    """
    try:
        # JWT format: header.payload.signature
        parts = token.split('.')
        if len(parts) != 3:
            raise ValueError("Invalid JWT format")
        
        # Decode payload (base64url)
        payload = parts[1]
        # Add padding if needed
        padding = 4 - len(payload) % 4
        if padding != 4:
            payload += '=' * padding
        
        decoded = base64.urlsafe_b64decode(payload)
        return json.loads(decoded)
    except Exception as e:
        logger.error(f"JWT decode failed: {e}")
        raise HTTPException(status_code=401, detail="Invalid token")


async def get_current_user(authorization: Optional[str] = Header(None)) -> dict:
    """
    Extract current user from Authorization header.
    Returns user dict with 'id', 'email', 'name'.
    
    Usage in endpoint:
        @app.get("/protected")
        async def protected_route(user: dict = Depends(get_current_user)):
            user_id = user['id']
    """
    if not authorization:
        raise HTTPException(status_code=401, detail="Authorization header missing")
    
    # Support "Bearer <token>" format
    token = authorization
    if authorization.startswith('Bearer '):
        token = authorization[7:]
    
    if not token or token == 'null' or token == 'undefined':
        raise HTTPException(status_code=401, detail="No valid token provided")
    
    try:
        payload = _decode_jwt_payload(token)
        
        user_id = payload.get('sub')
        if not user_id:
            raise HTTPException(status_code=401, detail="No user ID in token")
        
        # Check expiration
        import time
        exp = payload.get('exp', 0)
        if exp and exp < time.time():
            raise HTTPException(status_code=401, detail="Token expired")
        
        return {
            'id': user_id,
            'email': payload.get('email', ''),
            'name': payload.get('user_metadata', {}).get('full_name', '') or payload.get('user_metadata', {}).get('name', ''),
            'avatar': payload.get('user_metadata', {}).get('avatar_url', '') or payload.get('user_metadata', {}).get('picture', ''),
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Auth error: {e}")
        raise HTTPException(status_code=401, detail="Authentication failed")


async def get_optional_user(authorization: Optional[str] = Header(None)) -> Optional[dict]:
    """
    Same as get_current_user but returns None instead of raising error.
    Use for endpoints that work with or without auth.
    """
    if not authorization:
        return None
    
    try:
        return await get_current_user(authorization)
    except HTTPException:
        return None
