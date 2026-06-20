from fastapi import APIRouter, Depends, HTTPException, status, Response, Request
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.app.models import User
from backend.app.schemas import UserCreate, UserLogin, UserResponse
from backend.app.auth import hash_password, verify_password, create_access_token, get_current_user
import re

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/signup", response_model=UserResponse)
def signup(user_in: UserCreate, response: Response, db: Session = Depends(get_db)):
    # Validate username formatting (alphanumeric and underscores only, start with letter)
    if not re.match(r"^[a-zA-Z][a-zA-Z0-9_]*$", user_in.username):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username must start with a letter and contain only alphanumeric characters and underscores."
        )

    # Check if username or email already exists
    existing_user = db.query(User).filter(
        (User.username == user_in.username) | (User.email == user_in.email)
    ).first()
    if existing_user:
        if existing_user.username == user_in.username:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Username is already taken."
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email is already registered."
            )

    # Create new user
    hashed = hash_password(user_in.password)
    # Give a default avatar
    initials = "".join([part[0].upper() for part in user_in.username.split("_") if part])[:2]
    if not initials:
        initials = user_in.username[:2].upper()
    profile_pic = f"https://ui-avatars.com/api/?name={initials}&background=4f46e5&color=fff"

    new_user = User(
        username=user_in.username,
        email=user_in.email,
        hashed_password=hashed,
        profile_pic=profile_pic
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # Issue token
    token = create_access_token(data={"sub": new_user.username})
    
    # Set HttpOnly Cookie
    response.set_cookie(
        key="access_token",
        value=token,
        httponly=True,
        max_age=3600 * 24, # 1 day
        samesite="lax",
        secure=False, # Set to True in HTTPS production environments
    )

    return new_user

@router.post("/login", response_model=UserResponse)
def login(credentials: UserLogin, response: Response, db: Session = Depends(get_db)):
    # Find user by username or email
    user = db.query(User).filter(
        (User.username == credentials.username_or_email) | 
        (User.email == credentials.username_or_email)
    ).first()

    if not user or not verify_password(credentials.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username/email or password."
        )

    # Issue token
    token = create_access_token(data={"sub": user.username})

    # Set HttpOnly Cookie
    response.set_cookie(
        key="access_token",
        value=token,
        httponly=True,
        max_age=3600 * 24, # 1 day
        samesite="lax",
        secure=False,
    )

    return user

@router.post("/logout")
def logout(response: Response):
    # Clear cookie
    response.delete_cookie(
        key="access_token",
        samesite="lax",
        secure=False,
    )
    return {"message": "Successfully logged out."}

@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user
