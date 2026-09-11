import string
import secrets
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from app.api.dependencies import get_current_active_user

router = APIRouter(prefix="/api/generate-password", tags=["tools"])

class PasswordOptions(BaseModel):
    length: int = 16
    uppercase: bool = True
    lowercase: bool = True
    numbers: bool = True
    special_characters: bool = True

class PasswordResponse(BaseModel):
    password: str

@router.post("", response_model=PasswordResponse)
def generate_password(options: PasswordOptions, user = Depends(get_current_active_user)):
    characters = ""
    if options.uppercase: characters += string.ascii_uppercase
    if options.lowercase: characters += string.ascii_lowercase
    if options.numbers: characters += string.digits
    if options.special_characters: characters += "!@#$%^&*()_+-=[]{}|;:,.<>?"

    if not characters:
        characters = string.ascii_letters + string.digits

    password = "".join(secrets.choice(characters) for _ in range(options.length))
    return PasswordResponse(password=password)
