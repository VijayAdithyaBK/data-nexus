---
title: Smart Playlist – AI Music Sorter
slug: smart-playlist
category: Machine Learning / Audio
excerpt: Sorting music files by genre and language using Machine Learning.
date: 2024-12-14
author: Vijay Adithya B K
readTime: 6
featured: true
status: published
---

## Introduction

We all have that one "Downloads" folder full of unsorted songs. **Smart Playlist** uses audio analysis to listen to your files and organize them automatically.

---

## The Solution

The system employs a multi-tiered approach:
1.  **Metadata Check**: First, it checks ID3 tags.
2.  **Audio Classification**: If tags are missing, it uses a Machine Learning model (Hugging Face Transformers) to analyze the audio waveform.
3.  **Heuristics**: Fallback to filename patterns (e.g., artist names).

---

## Tech Stack

-   **Language**: Python
-   **ML**: Transformers (Hugging Face), PyTorch
-   **Audio Processing**: Librosa

---

## Conclusion

Intelligent automation applied to everyday digital clutter.
