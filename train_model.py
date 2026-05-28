import pandas as pd
import joblib

from sklearn.model_selection import train_test_split
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression

# LOAD DATASET
df = pd.read_csv("customer_support_tickets.csv")

# RENAME COLUMNS
df = df.rename(columns={
    "Ticket Description": "issue",
    "Ticket Type": "category",
    "Ticket Priority": "priority"
})

# REMOVE EMPTY VALUES
df = df.dropna(subset=["issue", "category", "priority"])

# INPUT TEXT
X = df["issue"]

# OUTPUT LABELS
y_category = df["category"]
y_priority = df["priority"]

# TF-IDF VECTORIZER
vectorizer = TfidfVectorizer()

X_vectorized = vectorizer.fit_transform(X)

# CATEGORY MODEL
category_model = LogisticRegression(max_iter=200)
category_model.fit(X_vectorized, y_category)

# PRIORITY MODEL
priority_model = LogisticRegression(max_iter=200)
priority_model.fit(X_vectorized, y_priority)

# SAVE FILES
joblib.dump(category_model, "category_model.pkl")
joblib.dump(priority_model, "priority_model.pkl")
joblib.dump(vectorizer, "vectorizer.pkl")

print("AI model training complete!")