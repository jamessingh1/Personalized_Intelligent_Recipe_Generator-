import requests
from config import SPOONACULAR_API_KEY

BASE_URL = "https://api.spoonacular.com"


# --------------------------------
# FETCH FULL RECIPE DETAILS
# --------------------------------
def get_recipe_details(recipe_id):
    try:
        resp = requests.get(
            f"{BASE_URL}/recipes/{recipe_id}/information",
            params={
                "apiKey": SPOONACULAR_API_KEY,
                "includeNutrition": True
            },
            timeout=10
        )

        if resp.status_code != 200:
            print("⚠️ Recipe detail error:", resp.text)
            return None

        data = resp.json()

        # Extract nutrition (only important ones)
        nutrition = {}
        for n in data.get("nutrition", {}).get("nutrients", []):
            if n["name"] in ["Calories", "Protein", "Carbohydrates", "Fat"]:
                nutrition[n["name"]] = f'{n["amount"]}{n["unit"]}'

        return {
            "ingredients": [i["original"] for i in data.get("extendedIngredients", [])],
            "instructions": data.get("instructions") or "Instructions not available",
            "nutrition": nutrition
        }

    except Exception as e:
        print("❌ Nutrition fetch failed:", e)
        return None


# --------------------------------
# SEARCH RECIPES BY INGREDIENTS
# --------------------------------
def search_spoonacular(ingredients, number=6):
    if not SPOONACULAR_API_KEY:
        print("❌ Spoonacular API key missing")
        return []

    try:
        print("🔍 Spoonacular search:", ingredients)

        resp = requests.get(
            f"{BASE_URL}/recipes/findByIngredients",
            params={
                "apiKey": SPOONACULAR_API_KEY,
                "ingredients": ",".join(ingredients),
                "number": number,
                "ranking": 1,
            },
            timeout=10,
        )

        if resp.status_code != 200:
            print("⚠️ Spoonacular error:", resp.text)
            return []

        recipes = resp.json()
        results = []

        for r in recipes:
            details = get_recipe_details(r["id"])

            results.append({
                "id": r["id"],
                "name": r["title"],
                "image": r.get("image"),
                "ingredients": details["ingredients"] if details else [],
                "instructions": details["instructions"] if details else "Instructions not available",
                "nutrition": details["nutrition"] if details else {},
                "source": "spoonacular"
            })

        print(f"✅ Spoonacular returned {len(results)} recipes")
        return results

    except Exception as e:
        print("❌ Spoonacular exception:", e)
        return []


# --------------------------------
# LOCAL TEST
# --------------------------------
if __name__ == "__main__":
    print(search_spoonacular(["tomato"], 3))
