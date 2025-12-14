---
title: Weather & Restaurant Ratings – A Data Warehouse
slug: weather-restaurant-ratings
category: Data Engineering
excerpt: Designing an OLAP Data Warehouse to analyze the impact of weather on restaurant ratings.
date: 2024-12-14
author: Vijay Adithya B K
readTime: 8
featured: false
status: published
---

## Introduction

Does rain make people give lower ratings to restaurants? Or does a sunny day boost the mood and the review scores?

To answer this, I designed a **Data Warehouse** that integrates Yelp reviews with climate data, enabling complex reporting and analysis.

---

## The Architecture

The project follows a classic 3-layer architecture:
1.  **Staging Layer**: Raw JSON/CSV files are loaded into a staging area (SQLite).
2.  **Operational Data Store (ODS)**: Data is normalized to 3NF to ensure integrity.
3.  **Data Warehouse (DWH)**: Data is transformed into a **Star Schema** for fast OLAP querying.

---

## Tech Stack

-   **Database**: SQLite
-   **ETL**: Python (for JSON parsing and loading) & SQL (for transformation).
-   **Modeling**: Star Schema (Fact Table: `ratings`, Dimensions: `business`, `date`).

---

## Key Challenges

-   **Data Integration**: Joining daily weather data with timestamped review data.
-   **JSON Transformation**: Flattening nested Yelp business attributes into relational tables.

---

## Conclusion

This project demonstrates the end-to-end process of building a data warehouse, from raw dirty data to a polished star schema ready for BI reporting.
