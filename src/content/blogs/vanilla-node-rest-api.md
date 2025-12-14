---
title: Vanilla Node REST API – No Frameworks
slug: vanilla-node-rest-api
category: Backend Development
excerpt: Building a RESTful API using pure Node.js without Express or external libraries.
date: 2024-12-14
author: Vijay Adithya B K
readTime: 5
featured: false
status: published
---

## Introduction

We often reach for Express.js immediately, but do we understand what's happening under the hood?

This project builds a **REST API** using only Node.js's built-in `http` module.

---

## The Challenge

Without a framework, you have to handle everything manually:
-   **Routing**: Parsing URLs and methods.
-   **Body Parsing**: Buffering data chunks from the request stream.
-   **Response Headers**: Setting status codes and MIME types explicitly.

---

## Tech Stack

-   **Runtime**: Node.js (Core Modules only)

---

## Conclusion

A fundamental exercise that deepens understanding of the HTTP protocol and the Node.js event loop.
