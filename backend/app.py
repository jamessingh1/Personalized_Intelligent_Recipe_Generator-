from flask import Flask, request, jsonify
from flask_cors import CORS
import logging

from detector import detect_ingredients
from spoonacular_service import search_spoonacular
from ingredient_mapper import map_to_spoonacular
from config import MAX_RECIPES

# ----------------------------
# APP SETUP
# ----------------------------
app = Flask(__name__)
CORS(app)

logging.basicConfig(level=logging.INFO)

# ----------------------------
# HEALTH CHECK
# ----------------------------
@app.route("/api/health", methods=["GET"])
def health():
    return jsonify({"status": "healthy"}), 200


# ----------------------------
# IMAGE UPLOAD → DETECT → RECIPES
# ----------------------------
@app.route("/api/upload", methods=["POST"])
def upload_image():
    logging.info("📸 /api/upload called")

    # Always return JSON (never crash frontend)
    if "image" not in request.files:
        return jsonify({
            "ingredients": [],
            "recipes": [],
            "message": "Image file not provided",
            "source": "system"
        }), 200

    image = request.files["image"]

    try:
        detected = detect_ingredients(image)
        logging.info(f"🧠 Detected: {detected}")

        # 🚨 AI FAILURE IS NOT CLIENT FAILURE
        if not detected:
            return jsonify({
                "ingredients": [],
                "recipes": [],
                "message": "No ingredients detected from image",
                "source": "ai"
            }), 200

        # Extract ingredient names
        ingredient_names = [d["name"] for d in detected]

        # Map to Spoonacular-compatible names
        api_ingredients = map_to_spoonacular(ingredient_names)

        # Fetch recipes
        recipes = search_spoonacular(api_ingredients, MAX_RECIPES)

        return jsonify({
            "ingredients": [[d["name"], d["confidence"]] for d in detected],
            "recipes": recipes or [],
            "source": "spoonacular",
            "message": (
                "Recipes found"
                if recipes else
                "No recipes found for detected ingredient"
            )
        }), 200

    except Exception as e:
        logging.exception("❌ Image processing failed")
        return jsonify({
            "ingredients": [],
            "recipes": [],
            "message": "Internal server error",
            "source": "system"
        }), 500


# ----------------------------
# MANUAL INGREDIENT SEARCH
# ----------------------------
@app.route("/api/search-by-ingredients", methods=["POST"])
def search_manual():
    data = request.get_json(silent=True) or {}
    ingredients = data.get("ingredients", [])

    if not ingredients:
        return jsonify({
            "recipes": [],
            "message": "No ingredients provided",
            "source": "user"
        }), 200

    try:
        api_ingredients = map_to_spoonacular(ingredients)
        recipes = search_spoonacular(api_ingredients, MAX_RECIPES)

        return jsonify({
            "recipes": recipes or [],
            "source": "spoonacular",
            "message": (
                "Recipes found"
                if recipes else
                "No recipes found"
            )
        }), 200

    except Exception:
        logging.exception("❌ Manual search failed")
        return jsonify({
            "recipes": [],
            "message": "Internal server error",
            "source": "system"
        }), 500


# ----------------------------
# ENTRY POINT
# ----------------------------
if __name__ == "__main__":
    import os
    port = int(os.environ.get("PORT", 8000))
    app.run(host="0.0.0.0", port=port)

