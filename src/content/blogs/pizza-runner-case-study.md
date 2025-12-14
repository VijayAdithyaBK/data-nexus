---
title: Pizza Runner Case Study – Optimizing Delivery with SQL
slug: pizza-runner-case-study
category: Data Science
excerpt: Optimizing pizza delivery operations using advanced SQL analysis.
date: 2024-12-14
author: Vijay Adithya B K
readTime: 9
featured: true
status: published
---

## Introduction

Inspired by 80s retro style and modern gig-economy apps, Danny launched **Pizza Runner**, a service that delivers fresh pizza via a fleet of "runners".

But operating a delivery service is data-intensive. This case study uses **SQL** to clean, analyze, and optimize Pizza Runner's operations.

---

## The Problem

Pizza Runner faced teething issues:
- Data was inconsistent (null values, wrong types).
- No clear visibility on runner performance.
- Ingredient optimization was guess-work.

Danny needed metrics on everything from "Average Runner Speed" to "Most Popular Toppings".

---

## The Solution

I performed a comprehensive SQL analysis covering:

### 1. Pizza Metrics
- Calculated total volume of orders by hour and day.
- Analyzed customer value and order frequency.

### 2. Runner Performance
- Determined average delivery duration and distance.
- Calculated runner success rates (successful deliveries vs cancellations).

### 3. Ingredient Optimization
- Mapped out standard ingredients vs exclusions/extras.
- Calculated inventory needs based on past order data.

---

## Technical Highlights

- **Data Cleaning**: Handling `NULL` strings ("null") vs actual NULLs in SQL.
- **Date/Time Functions**: Extracting hours and weeks to spot demand trends.
- **Table Joins**: Connecting `customer_orders`, `runner_orders`, and `pizza_recipes` for holistic insights.

---

## Conclusion

This project showcases the end-to-end data analysis process—from cleaning messy raw data to deriving actionable business intelligence that can improve delivery times and customer satisfaction.

*Part of the #8WeekSQLChallenge.*
