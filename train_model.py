import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
import joblib

# Load dataset
data = pd.read_csv("data.csv")

# Input text
X = data["issue"]

# Outputs
y_category = data["category"]
y_priority = data["priority"]

# Convert text into numbers
vectorizer = TfidfVectorizer()
X_vectorized = vectorizer.fit_transform(X)

# Train category model
category_model = LogisticRegression()
category_model.fit(X_vectorized, y_category)

# Train priority model
priority_model = LogisticRegression()
priority_model.fit(X_vectorized, y_priority)

# Save everything
joblib.dump(category_model, "category_model.pkl")
joblib.dump(priority_model, "priority_model.pkl")
joblib.dump(vectorizer, "vectorizer.pkl")

print("Models trained successfully!")