import os
import pandas as pd
import joblib
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, classification_report

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODELS_DIR = os.path.join(BASE_DIR, "models")

# 1. Load UCI dataset
data_path = os.path.join(BASE_DIR, "student-mat.csv")
data = pd.read_csv(data_path, sep=";")

# 2. Feature engineering
# absences -> attendance proxy
data["attendance"] = 100 - (data["absences"] * 2)
data["attendance"] = data["attendance"].clip(lower=0, upper=100)

# G1 and G2 -> internal marks proxy
data["internalMarks"] = ((data["G1"] + data["G2"]) / 2) * 5

# G3 -> cgpa proxy
data["cgpa"] = (data["G3"] / 2).clip(lower=0, upper=10)

# 3. Risk label mapping from final grade
def map_risk(g3):
    if g3 < 8:
        return "High"
    elif g3 < 14:
        return "Medium"
    return "Low"

data["riskLevel"] = data["G3"].apply(map_risk)

# 4. Select features and target
X = data[["attendance", "internalMarks", "cgpa"]]
y = data["riskLevel"]

# 5. Encode target labels
le = LabelEncoder()
y_encoded = le.fit_transform(y)

# 6. Train-test split
X_train, X_test, y_train, y_test = train_test_split(
    X, y_encoded, test_size=0.2, random_state=42, stratify=y_encoded
)

# 7. Train model
model = RandomForestClassifier(n_estimators=200, max_depth=8, random_state=42)
model.fit(X_train, y_train)

# 8. Evaluate
y_pred = model.predict(X_test)
print("Accuracy:", accuracy_score(y_test, y_pred))
print("\nClassification Report:\n")
print(classification_report(y_test, y_pred, target_names=le.classes_))

# 9. Save model
os.makedirs(MODELS_DIR, exist_ok=True)
joblib.dump(model, os.path.join(MODELS_DIR, "risk_model.pkl"))
joblib.dump(le, os.path.join(MODELS_DIR, "label_encoder.pkl"))

print("\n✅ New model trained using student-mat.csv and saved successfully")