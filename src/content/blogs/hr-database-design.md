---
title: HR Database Design – Architecting for Scalability
slug: hr-database-design
category: Database Design
excerpt: Designing a robust 3NF relational database for Human Resources management.
date: 2024-12-14
author: Vijay Adithya B K
readTime: 10
featured: true
status: published
---

## Introduction

As "Tech ABC Corp" scaled from a startup to a mid-sized company, their Excel-based HR system began to crack. Data redundancy, security risks, and lack of integrity checks became major blockers.

This project involves designing and implementing a **Relational Database Management System (RDBMS)** to solving these problems, ensuring data integrity, security, and scalability.

---

## The Problem

Managing employee data in spreadsheets leads to:
- **Inconsistent Data**: Typo-ridden department names or invalid job titles.
- **Security Viods**: Everyone has access to sensitive salary data.
- **Scalability Issues**: Performance degrades as row counts increase.

---

## The Solution

I designed a database schema in **3rd Normal Form (3NF)** to ensure minimal redundancy and maximum integrity.

### Key Components

- **Normalized Tables**: `Employees`, `Departments`, `Jobs`, `Locations`, `Salaries`, and `Job_History`.
- **Advanced SQL Features**:
    - **Views**: Created `emp_details_view` to simplify complex joins for reporting.
    - **Stored Procedures**: `GetEmployeeJobHistory` to automate data retrieval.
    - **Role-Based Security**: Implemented a `NonMgr` role that explicitly restricts access to the `Salaries` table.

### Data Migration

I wroted a Python ETL script to sanitize and migrate legacy CSV data into the new SQL structure, ensuring a smooth transition.

---

## Tech Stack

- **Database**: PostgreSQL / SQL Server
- **Modeling**: ERD (Conceptual, Logical, Physical)
- **Scripting**: Python (for ETL)
- **Security**: RBAC (Role-Based Access Control)

---

## Conclusion

A well-designed database is the backbone of any enterprise application. This project not only solved the immediate data management issues but laid a secure foundation for future growth.
