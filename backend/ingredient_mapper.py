SPOONACULAR_MAP = {
    "brinjal": "eggplant",
    "baingan": "eggplant",
    "capsicum": "bell pepper",
    "curd": "yogurt"
}

def map_to_spoonacular(ingredients):
    mapped = []
    for ing in ingredients:
        mapped.append(SPOONACULAR_MAP.get(ing, ing))
    return mapped
