import numpy as np
import tensorflow as tf
from fastapi import FastAPI, File, UploadFile
from fastapi.responses import JSONResponse
from PIL import Image
import io

# Initialize FastAPI app
app = FastAPI()

# Load the Keras models (ensure these paths are correct)
plant_type_model = tf.keras.models.load_model("model/final_plant_classifier_saved_model.keras")
tomato_disease_model = tf.keras.models.load_model("model/final_plant_tomato_saved_model.keras")
potato_disease_model = tf.keras.models.load_model("model/final_potato_saved_model.keras")
bellpepper_disease_model = tf.keras.models.load_model("model/final_bell_pepper_saved_model.keras")

# Define class names for plant type prediction
PLANT_TYPE_CLASSES = ["Bell Pepper", "Potato", "Tomato"]

# Define class names for disease prediction
TOMATO_DISEASE_CLASSES = [
    "Tomato_Target_Spot", "Tomato_Tomato_mosaic_virus", "Tomato_Tomato_YellowLeaf_Curl_virus",
    "Tomato_Bacterial_spot", "Tomato_Early_blight", "Tomato_healthy", "Tomato_Late_blight",
    "Tomato_Leaf_Mold", "Tomato_Septoria_leaf_spot", "Tomato_Spider_mites_Two_spotted_spider_mite"
]
POTATO_DISEASE_CLASSES = ["Potato_Early_blight","Potato_healthy", "Potato_Late_blight"]
BELLPEPPER_DISEASE_CLASSES = [ "BellPepper_Bacterial_spot","BellPepper_healthy"]

# Helper function to decode and preprocess the image
def decode_image(image_data: bytes) -> np.ndarray:
    image = Image.open(io.BytesIO(image_data)).convert("RGB")
    image = image.resize((256, 256))
    image = np.array(image).astype("float32")  # No division by 255
    return image


# Helper function to make plant type prediction
# Helper function to make plant type prediction
def predict_plant_type(image: np.ndarray) -> tuple:
    image = tf.expand_dims(image, 0)  # Add batch dimension, similar to notebook
    predictions = plant_type_model.predict(image)

    # Log raw predictions for debugging
    print(f"Raw predictions: {predictions}")  # Add this line to inspect raw outputs

    predicted_index = np.argmax(predictions[0])
    confidence = round(100 * float(predictions[0][predicted_index]), 2)  # Convert to percentage
    predicted_class = PLANT_TYPE_CLASSES[predicted_index]
    return predicted_class, confidence


# Helper function to make disease prediction
def predict_disease(image: np.ndarray, plant_type: str) -> dict:
    if plant_type == "Tomato":
        model = tomato_disease_model
        classes = TOMATO_DISEASE_CLASSES
    elif plant_type == "Potato":
        model = potato_disease_model
        classes = POTATO_DISEASE_CLASSES
    elif plant_type == "Bell Pepper":
        model = bellpepper_disease_model
        classes = BELLPEPPER_DISEASE_CLASSES
    else:
        return {"class": "Unknown", "confidence": 0.0}

    image = tf.expand_dims(image, 0)  # Add batch dimension
    predictions = model.predict(image)
    predicted_index = np.argmax(predictions[0])
    confidence = round(100 * float(predictions[0][predicted_index]), 2)  # Convert to percentage
    predicted_class = classes[predicted_index]

    return {
        "class": predicted_class,
        "confidence": confidence
    }

@app.get("/")
def home():
    return {"message": "Welcome to the Plant Disease Prediction API. Use /predict to make predictions."}

@app.post("/predict")
async def predict_route(file: UploadFile = File(...)):
    try:
        # Read image from file
        image_data = await file.read()

        # Decode and preprocess the image
        image = decode_image(image_data)

        # Step 1: Predict Plant Type
        plant_type, plant_confidence = predict_plant_type(image)

        # Step 2: Predict Disease based on Plant Type
        disease_result = predict_disease(image, plant_type)

        # Return both plant type and disease prediction
        return JSONResponse(content={
            "plant_type": plant_type,
            "plant_confidence": plant_confidence,
            "disease": disease_result.get("class", "Unknown"),
            "disease_confidence": disease_result.get("confidence", 0.0),
        })
    except Exception as e:
        return JSONResponse(status_code=500, content={"message": str(e)})

if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
