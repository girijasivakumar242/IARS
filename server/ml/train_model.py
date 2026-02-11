import os
import pandas as pd
from sklearn.preprocessing import LabelEncoder
from sklearn.ensemble import RandomForestClassifier
import joblib

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

data_path = os.path.join(BASE_DIR, "students.csv")
models_dir = os.path.join(BASE_DIR, "models")

data = pd.read_csv(data_path)

X = data[['attendance', 'internalMarks', 'cgpa']]
y = data['riskLevel']

le = LabelEncoder()
y_encoded = le.fit_transform(y)

model = RandomForestClassifier(n_estimators=100, random_state=42)
model.fit(X, y_encoded)

os.makedirs(models_dir, exist_ok=True)
joblib.dump(model, os.path.join(models_dir, "risk_model.pkl"))
joblib.dump(le, os.path.join(models_dir, "label_encoder.pkl"))

print("✅ Model trained and saved")
