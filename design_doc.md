# Design Document: Educational Tracing Web App

## 1. Project Overview
**Goal:** Create an engaging, educational web application for 4-year-olds to learn writing.
**Core Concept:** "Duolingo for Tracing" – a gamified, guided experience where children trace letters, numbers, and words with immediate feedback and positive reinforcement.
**Platform:** Web (HTML/CSS/JS), optimized for iPad/Touch interactions.

## 2. Target Audience
*   **Users:** Children aged 3-5 years.
*   **Needs:** Large touch targets, simple navigation, immediate visual/audio feedback, colorful and forgiving interface, standard handwriting stroke orders.

## 3. Technical Architecture
**Stack:** Vanilla HTML5, CSS3, JavaScript (ES6+). No external frameworks were used to keep it lightweight and zero-dependency.

### Core Components:
1.  **Canvas Layering:**
    *   `#guideCanvas`: Renders the static guide paths, numbered points, and directional arrows.
    *   `#tracingCanvas`: Handles user input, drawing the user's trail, and overlaying success indicators.
2.  **State Management (`state` object):**
    *   Tracks current section (letters, numbers, words) and index.
    *   Tracks progress within a character (`currentStrokeIndex`, `currentPointIndex`).
    *   Manages "completed" sets for gamification progress.
3.  **Coordinate System:**
    *   **Normalized Data:** All stroke path data is stored as `0.0` to `1.0` floats.
    *   **Aspect Ratio Enforced:** A custom `getDrawingArea()` function ensures the drawing space remains logical (1:1 for single characters) regardless of the device aspect ratio, preventing "flattened" or distorted characters.
4.  **Audio System:**
    *   `Web Audio API` for synthesizing sound effects (success, point hit, stroke complete) without external assets.

## 4. Key Features & Implementation

### 4.1 Guided Tracing Engine
*   **Data Structure:** `strokePaths` dictionary maps characters to arrays of strokes. Each stroke is an array of points `[x, y]`.
*   **Logic:**
    *   Users must hit points in sequence (Point 1 -> Point 2).
    *   Distance checks utilize a tolerance radius (e.g., `0.1` normalized units).
    *   Visual dashed lines guide the user to the next point.
    *   **Feedback:** Active point pulses. Correctly hit points turn green with a checkmark.

### 4.2 Gamification & Feedback
*   **Mascot (Fox):** Provides context-sensitive hints via a speech bubble (e.g., "Start at point 1!", "Great job!").
*   **Celebration:** Full-screen overlay with falling star emojis and triumphant sound effects upon character completion.
*   **Progress Tracking:** Visual progress bar fills as the user completes items in a section.

### 4.3 Adaptive Content
*   **Sections:** Uppercase (A-Z), Lowercase (a-z), Numbers (0-9), Words (CAT, DOG, etc.).
*   **Words Logic:** Dynamically composes word paths by verifying letter widths and spacing them within the drawing area.

## 5. UI/UX Design
*   **Aesthetics:** "Glassmorphism" inspired, vibrant gradients (Purple/Blue/Orange), rounded corners, easy-to-read "Nunito" font.
*   **Interaction:**
    *   **Scrollable Character Picker:** Horizontal scrolling for easy access to all letters.
    *   **Auto-Hide UI:** Non-essential elements (like hints) fade out to reduce clutter.
    *   **Touch Optimization:** Prevent default scrolling on canvas to ensure smooth drawing.

## 6. Future Considerations
*   **Persistence:** Implement `localStorage` to save progress between sessions.
*   **Stroke Accuracy:** Further refinement of complex curves (e.g., 'S', '8', '5') based on specific handwriting curriculums.
