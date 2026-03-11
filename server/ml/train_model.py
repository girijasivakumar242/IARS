import os
import pandas as pd
import joblib
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.ensemble import RandomForestClassifier
from sklearn.cluster import KMeans
from sklearn.metrics import accuracy_score, classification_report, silhouette_score

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODELS_DIR = os.path.join(BASE_DIR, "models")

# 1. Load UCI dataset
data_path = os.path.join(BASE_DIR, "student-mat.csv")
data = pd.read_csv(data_path, sep=";")

# 2. Feature engineering

# absences -> attendance proxy
data["attendance"] = 100 - (data["absences"] * 2)
data["attendance"] = data["attendance"].clip(lower=0, upper=100)

# G1 and G2 -> internal marks proxy (0 to 100 scale)
data["internalMarks"] = ((data["G1"] + data["G2"]) / 2) * 5
data["internalMarks"] = data["internalMarks"].clip(lower=0, upper=100)

# G3 -> cgpa proxy (0 to 10 scale)
data["cgpa"] = (data["G3"] / 2).clip(lower=0, upper=10)

# 3. Use clustering to automatically determine risk levels
features_for_clustering = ["attendance", "internalMarks", "cgpa"]
X_clustering = data[features_for_clustering]

# Standardize features for better clustering
scaler = StandardScaler()
X_scaled = scaler.fit_transform(X_clustering)

# Perform K-means clustering with 3 clusters (Low, Medium, High risk)
kmeans = KMeans(n_clusters=3, random_state=42, n_init=10)
clusters = kmeans.fit_predict(X_scaled)

# Map clusters to risk levels based on cluster centers
# Lower cluster numbers will be assigned to higher risk based on feature values
cluster_centers = kmeans.cluster_centers_
cluster_risk_mapping = {}

# Calculate average feature values for each cluster to determine risk level
for i in range(3):
    cluster_mask = clusters == i
    avg_attendance = data.loc[cluster_mask, "attendance"].mean()
    avg_internal = data.loc[cluster_mask, "internalMarks"].mean()
    avg_cgpa = data.loc[cluster_mask, "cgpa"].mean()
    risk_score = (100 - avg_attendance) + (100 - avg_internal) + (10 - avg_cgpa)  # Higher score = higher risk
    cluster_risk_mapping[i] = risk_score

# Sort clusters by risk score and assign labels
sorted_clusters = sorted(cluster_risk_mapping.items(), key=lambda x: x[1], reverse=True)
risk_labels = ["High", "Medium", "Low"]
cluster_to_risk = {cluster_id: risk_labels[i] for i, (cluster_id, _) in enumerate(sorted_clusters)}

data["riskLevel"] = [cluster_to_risk[cluster] for cluster in clusters]

print("Cluster distribution:")
print(data["riskLevel"].value_counts())
print(f"Silhouette Score: {silhouette_score(X_scaled, clusters):.3f}")

# 4. Select features and target
X = data[features_for_clustering]
y = data["riskLevel"]

# 5. Encode target labels
le = LabelEncoder()
y_encoded = le.fit_transform(y)

# 6. Train-test split
X_train, X_test, y_train, y_test = train_test_split(
    X, y_encoded, test_size=0.2, random_state=42, stratify=y_encoded
)

# 7. Train model
model = RandomForestClassifier(
    n_estimators=200,
    max_depth=8,
    random_state=42
)
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