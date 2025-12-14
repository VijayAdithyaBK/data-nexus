---
title: Danny’s Diner Case Study – SQL Insights
slug: dannys-diner-case-study
category: Data Science
excerpt: A deep dive into customer behavior analysis using SQL for a Japanese diner.
date: 2024-12-14
author: Vijay Adithya B K
readTime: 8
featured: true
status: published
---

## Introduction

In early 2021, Danny Ma opened **Danny’s Diner**, a restaurant serving sushi, curry, and ramen. But like many new businesses, he struggled to understand his customers based on the limited data he had.

This case study explores how raw data was transformed into actionable insights using SQL, helping Danny make better business decisions.

---

## The Problem

Danny needed answers to three key questions to improve his customer loyalty program:
1.  **Visitation**: How often do customers visit?
2.  **Spending**: How much money do they spend?
3.  **Preferences**: What are their favorite menu items?

Without these insights, expanding the loyalty program was a gamble.

---

## The Solution

Using **SQL**, I analyzed three datasets: `Sales`, `Menu`, and `Members`.

### Key Insights Uncovered

- **Total Spend**: Calculated the lifetime value of each customer.
- **Customer Favorites**: Identified the most popular dish (Ramen) and individual customer preferences.
- **Loyalty Impact**: Analyzed purchasing behavior before and after customers joined the membership program.

### Example Analysis

One interesting find was determining the **first item purchased** by each customer. By ranking orders by date, we could see what made the first impression on every new visitor.

---

## Tech Stack

- **SQL (PostgreSQL/MySQL)**: For querying and aggregating data.
- **Entity Relationship Diagrams (ERD)**: To model the database schema.
- **Data Analysis**: CTEs, Window Functions, and Joins were heavily used.

---

## Conclusion

This project highlights the power of SQL in business intelligence. By answering specific questions with data, Danny's Diner can now offer a personalized experience to its most loyal customers.

*Based on the #8WeekSQLChallenge by Danny Ma.*
