import os
from dotenv import load_dotenv

load_dotenv()

SPOONACULAR_API_KEY = os.getenv("SPOONACULAR_API_KEY")
MAX_RECIPES = 6

print("🔑 Spoonacular key loaded:", bool(SPOONACULAR_API_KEY))
