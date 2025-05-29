import pandas as pd
from sqlalchemy import create_engine
from sqlalchemy import text
from rapidfuzz import fuzz
import logging

import openai

import os
from dotenv import load_dotenv
load_dotenv()

import spacy
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
openai.api_key = OPENAI_API_KEY

nlp = spacy.load("en_core_web_sm")

BTC_DIFF_THRESHOLD = 10  # in BTC
USD_DIFF_THRESHOLD = 10000  # in USD

entity_aliases = {
    "united states government": "united states",
    "the text p": "united states",
    "united kingdom government": "united kingdom",
    "government of the united kingdom": "united kingdom",
    "ukraine government": "ukraine",
    "government of ukraine": "ukraine",
    "ukraine (holdings of public officials)": "ukraine",
    "people's bank of china": "china",
    "people's republic of china": "china"
}

def normalize_entity_name(name):
    doc = nlp(name)
    for ent in doc.ents:
        if ent.label_ in ("GPE", "ORG"):
            return ent.text.lower()
    return name.lower()

# Setup logging
logging.basicConfig(level=logging.INFO)

# --- Database Config ---
DB_USER = os.getenv("DB_USER")
DB_PASS = os.getenv("DB_PASSWORD")
DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = int(os.getenv("DB_PORT", 3306))
DB_NAME = os.getenv("DB_NAME")
TABLE_NAME = os.getenv("TABLE_NAME", "bitcoin_treasuries")

# Connect to DB
engine = create_engine(f"mysql+pymysql://{DB_USER}:{DB_PASS}@{DB_HOST}:{DB_PORT}/{DB_NAME}")

# Load table
logging.info(f"Fetching data from `{TABLE_NAME}`...")
df = pd.read_sql(f"SELECT * FROM {TABLE_NAME}", con=engine)
logging.info(f"Loaded {len(df)} rows.")

df.columns = df.columns.str.strip().str.lower()  # Normalize column headers to lowercase

# Filter out Country and Government entities
if "entity_type" in df.columns:
    df = df[~df["entity_type"].str.lower().isin(["country", "government"])]

if "company_name" not in df.columns:
    raise ValueError(f"Expected column 'company_name' not found. Found columns: {df.columns.tolist()}")

df["normalized_company_name"] = df["company_name"].apply(lambda x: entity_aliases.get(x.lower(), normalize_entity_name(x)))

# Normalize columns
df['company_name'] = df['company_name'].astype(str).str.lower().str.strip()
df['country'] = df['country'].astype(str).str.lower().str.strip()

# Thresholds
NAME_THRESHOLD = 90
COUNTRY_THRESHOLD = 85

#
# Deduplication logic
to_keep = []
already_matched = set()

for i, row1 in df.iterrows():
    if i in already_matched:
        continue

    name1, country1 = row1['normalized_company_name'].casefold(), row1['country'].casefold()
    group = [i]

    for j, row2 in df.iloc[i + 1:].iterrows():
        name2, country2 = row2['normalized_company_name'].casefold(), row2['country'].casefold()
        if (
            fuzz.ratio(name1, name2) >= NAME_THRESHOLD and
            fuzz.ratio(country1, country2) >= COUNTRY_THRESHOLD
        ):
            group.append(j)
            already_matched.add(j)

    # Keep the most complete entry (fallback: the first in group)
    if 'id' in df.columns:
        # filter out any indices in group that exceed the current length of df
        valid_group = [idx for idx in group if idx < len(df)]
        if valid_group:
            subset = df.iloc[valid_group].replace("N/A", "").dropna(axis=1)
            lengths = subset.map(lambda x: len(str(x)) if isinstance(x, str) else 0)
            most_complete = lengths.sum(axis=1).idxmax()
            logging.info(f"Keeping row {most_complete} as the most complete representative from group: {valid_group}")
        else:
            most_complete = group[0]
    else:
        most_complete = group[0]

    to_keep.append(most_complete)

def find_tfidf_duplicates(df, threshold=0.85):
    names = df["normalized_company_name"].tolist()
    tfidf = TfidfVectorizer().fit_transform(names)
    sim_matrix = cosine_similarity(tfidf)
    duplicates = set()
    for i in range(len(names)):
        for j in range(i + 1, len(names)):
            if sim_matrix[i, j] >= threshold and df.iloc[i]["country"] == df.iloc[j]["country"]:
                duplicates.add(j)
    return list(duplicates)

tfidf_duplicates = find_tfidf_duplicates(df)

# --- OpenAI-based refinement step ---
def refine_duplicates_with_openai(df, to_keep, group_by_col='normalized_company_name'):
    logging.info("Refining duplicate detection using OpenAI...")
    removed_ids = []
    grouped = df.groupby(group_by_col)

    for name, group in grouped:
        if len(group) <= 1:
            continue

        try:
            btc_vals = group['btc_holdings'].astype(str).str.replace(",", "").str.replace("M", "").astype(float)
            usd_vals = group['usd_value'].astype(str).str.replace(",", "").str.replace("M", "").astype(float)

            if btc_vals.std() < BTC_DIFF_THRESHOLD and usd_vals.std() < USD_DIFF_THRESHOLD:
                continue  # Differences are too minor to warrant OpenAI cost
        except Exception as e:
            logging.warning(f"Skipping OpenAI check for group '{name}' due to parse error: {e}")
            continue

        context = "\n".join([
            f"{i}: {row['company_name']} ({row['country']}) - BTC: {row['btc_holdings']}, USD: {row['usd_value']}"
            for i, row in group.iterrows()
        ])
        prompt = (
            "You're reviewing records of companies with similar names and countries. "
            "Choose the most complete and accurate record to keep. "
            f"Here are the entries:\n{context}\n\n"
            "Which row index should be kept (just the number)?"
        )
        try:
            response = openai.ChatCompletion.create(
                model="gpt-4",
                messages=[
                    {"role": "system", "content": "You are a data deduplication assistant."},
                    {"role": "user", "content": prompt}
                ]
            )
            keep_index = int(response.choices[0].message["content"].strip())
            if keep_index in group.index:
                to_remove = [i for i in group.index if i != keep_index]
                for i in to_remove:
                    removed_ids.append(i)
                    logging.info(f"OpenAI suggests removing duplicate ID {i} (Company: {df.loc[i, 'company_name']})")
        except Exception as e:
            logging.warning(f"OpenAI deduplication failed for group '{name}': {e}")

    return list(set(removed_ids))

openai_duplicates = refine_duplicates_with_openai(df, to_keep)

# --- Column-based exact deduplication ---
def find_exact_column_matches(df, column_subset):
    logging.info("Finding exact matches based on columns: %s", column_subset)
    grouped = df[df.duplicated(subset=column_subset, keep=False)].groupby(column_subset)
    groups_to_remove = []
    for _, group in grouped:
        def is_valid_name(row):
            cname = str(row["company_name"]).strip().lower()
            ticker = str(row.get("ticker", "")).strip().lower()
            if cname == ticker or "sorry" in cname or "not a valid" in cname or "unable to provide" in cname or "doesn't appear" in cname or "couldn't find" in cname:
                return False
            return True

        valid_rows = group[group.apply(is_valid_name, axis=1)]
        if not valid_rows.empty:
            idx_to_keep = valid_rows.index[0]
        else:
            idx_to_keep = group.index[0]  # fallback

        to_remove = group.index.difference([idx_to_keep])
        groups_to_remove.extend(to_remove)
    return groups_to_remove

column_exact_duplicates = find_exact_column_matches(df, ["btc_holdings", "usd_value", "entity_type", "country"])

duplicate_ids = df.index.difference(to_keep)
# Include exact duplicates found across btc/usd/entity_type/country
duplicate_ids = duplicate_ids.union(pd.Index(openai_duplicates)).union(pd.Index(tfidf_duplicates)).union(pd.Index(column_exact_duplicates))
logging.info(f"Identified {len(duplicate_ids)} fuzzy duplicates (including OpenAI refinement).")

if not duplicate_ids.empty:
    logging.info("Duplicate company names to delete:")
    for idx in duplicate_ids:
        company_name = df.loc[idx, 'company_name']
        logging.info(f" - {company_name}")

# Generate DELETE statements
if 'id' in df.columns:
    with engine.begin() as conn:
        for idx in duplicate_ids:
            row_id = int(df.loc[idx, 'id'])
            company_name = df.loc[idx, 'company_name']
            logging.info(f"Deleting ID {row_id} (Company: {company_name})")
            conn.execute(text(f"DELETE FROM {TABLE_NAME} WHERE id = :id"), {"id": row_id})
    logging.info("Duplicate rows deleted.")
else:
    logging.warning("No `id` column found, skipping DELETE operation.")


# Optional: Save cleaned copy
# Remove duplicates before saving cleaned copy
df_clean = df.drop(index=duplicate_ids)

# --- Move distinct countries to countries table ---
existing_countries = pd.read_sql("SELECT name FROM countries", con=engine)["name"].str.lower().tolist()
new_countries = df_clean["country"].dropna().str.lower().unique()
to_insert = [c for c in new_countries if c not in existing_countries]

if to_insert:
    logging.info(f"Inserting {len(to_insert)} new countries into `countries` table...")
    with engine.begin() as conn:
        for country in to_insert:
            conn.execute(text("INSERT INTO countries (name) VALUES (:name)"), {"name": country})
else:
    logging.info("No new countries to insert.")

# --- Update entity_type to 'Sovereign' for known countries ---
logging.info("Updating entity_type to 'Sovereign' for known countries...")
with engine.begin() as conn:
    result = conn.execute(text("SELECT name FROM countries"))
    known_countries = [row[0].strip().lower() for row in result.fetchall()]

    updated = 0
    for idx, row in df_clean.iterrows():
        country = row["country"].strip().lower() if pd.notnull(row["country"]) else ""
        if country in known_countries and (
            pd.isna(row.get("entity_type")) or row["entity_type"].strip().lower() not in ["sovereign", "government", "public company"]
        ):
            df_clean.at[idx, "entity_type"] = "Sovereign"
            updated += 1
    logging.info(f"Updated entity_type to 'Sovereign' for {updated} rows.")

df_clean.to_sql(f"{TABLE_NAME}_cleaned", con=engine, index=False, if_exists="replace")
logging.info(f"Cleaned data saved to `{TABLE_NAME}_cleaned`.")
