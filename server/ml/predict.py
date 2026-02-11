import sys
import joblib
import os
import pandas as pd
import json

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

model_path = os.path.join(BASE_DIR, "models", "risk_model.pkl")
le_path = os.path.join(BASE_DIR, "models", "label_encoder.pkl")

model = joblib.load(model_path)
le = joblib.load(le_path)

# Read inputs
attendance = float(sys.argv[1])
internal_marks = float(sys.argv[2])
cgpa = float(sys.argv[3])

X_input = pd.DataFrame(
    [[attendance, internal_marks, cgpa]],
    columns=["attendance", "internalMarks", "cgpa"]
)

# 🔮 ML Prediction
prediction_encoded = model.predict(X_input)
risk_level = le.inverse_transform(prediction_encoded)[0]

# 🧠 FEATURE-WISE ANALYSIS (AI reasoning)
weak_areas = []
suggestions = []

if attendance < 60:
    weak_areas.append("Attendance")
    suggestions.append("Attend classes regularly to improve understanding.")

if internal_marks < 50:
    weak_areas.append("Internal Marks")
    suggestions.append("Focus more on internal assessments, assignments, and tests.")

if cgpa < 6.0:
    weak_areas.append("CGPA")
    suggestions.append("Concentrate on core subjects and improve overall academic performance.")

# If no specific weakness but risk exists
if not suggestions:
    suggestions.append("Maintain consistency and continue current academic efforts.")

# Combine suggestions
final_suggestion = " ".join(suggestions)

# ✅ Return structured AI output
print(json.dumps({
    "riskLevel": risk_level,
    "weakAreas": weak_areas,
    "suggestion": final_suggestion
}))
