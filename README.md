<div align="center">

```text
 ███▄ ▄███▓▓█████  ██████  ▒█████  ▓█████  ██▓      █████▒▓██   ██▓
▓██▒▀█▀ ██▒▓█   ▀▒██    ▒ ▒██▒  ██▒▓█   ▀ ▓██▒    ▒▓█   ▒  ▒██  ██▒
▓██    ▓██░▒███  ░ ▓██▄   ▒██░  ██▒▒███   ▒██░    ▒▓███ ░   ▒██ ██░
▒██    ▒██ ▒▓█  ▄  ▒   ██▒▒██   ██░▒▓█  ▄ ▒██░    ░▓█▒  ░   ░ ▐██░░
▒██▒   ░██▒░▒████▒██████▒▒░ ████▓▒░░▒████▒░██████▒░▒█░      ░ ██▒░░
░ ▒░   ░  ░░░ ▒░ ░ ▒░▒  ░ ░ ▒░▒░▒░ ░░ ▒░ ░░ ▒░▒  ░ ▒ ░       ██▒▒▒
░  ░      ░ ░ ░  ░ ░ ▒  ░   ░ ▒ ▒░  ░ ░  ░░ ░ ▒  ░ ░       ▓██ ░▒░ 
░      ░      ░    ░ ░    ░ ░ ░ ▒     ░     ░ ░    ░ ░     ▒ ▒ ░░  
       ░      ░  ░   ░  ░     ░ ░     ░  ░    ░  ░         ░ ░     
```

[![License](https://img.shields.io/badge/license-MIT-000000?style=flat-square)](LICENSE)
[![Build Status](https://img.shields.io/github/actions/workflow/status/mesoelfy/mesoelfy.github.io/release.yml?branch=main&style=flat-square&color=000000&label=build)](https://github.com/mesoelfy/mesoelfy.github.io/actions)
[![React Three Fiber](https://img.shields.io/badge/core-R3F_v9-000000?style=flat-square&logo=react)](https://docs.pmnd.rs/react-three-fiber)

**A 3D operating system, portfolio, and arcade shooter running entirely in the browser.**

[**LAUNCH LIVE SITE**](https://mesoelfy.github.io)

</div>

---

### About the Project

**MESOELFY_OS** is an experimental web application that bridges the gap between modern web development and high-performance game engineering.

To the user, it appears as a sci-fi operating system where windows can be dragged, resized, and interacted with. However, the background is a fully playable "twin-stick" shooter game. The project demonstrates how heavy computational logic can coexist with a reactive UI framework like React without sacrificing performance.

### How to Experience It

| Method | Best For | Link |
| :--- | :--- | :--- |
| **Browser (Recommended)** | Instant access. No installation required. | [**mesoelfy.github.io**](https://mesoelfy.github.io) |
| **Desktop App** | Offline play. Higher performance caps. | [**Download Release**](https://github.com/mesoelfy/mesoelfy.github.io/releases) |
| **Source Code** | Developers wanting to inspect the architecture. | [**Clone Repo**](#local-development) |

---

### Technical Architecture

This project is not a standard React website. It implements a custom **Entity Component System (ECS)** game engine that runs alongside the Next.js lifecycle.

#### 1. The Hybrid Loop (React vs. Engine)
Web apps are event-driven (waiting for clicks), while games are loop-driven (calculating physics 60 times a second). This project separates them completely:
*   **The "Slow" Lane (React/Zustand):** Handles UI state (Menus, Modals, Settings). Updates only when necessary.
*   **The "Fast" Lane (Game Engine):** A custom requestAnimationFrame loop that handles physics, collisions, and particle math. It bypasses React entirely, writing directly to buffers for maximum speed.

#### 2. Custom ECS Implementation
Instead of object-oriented classes (e.g., `class Enemy extends Player`), the project uses an Entity Component System:
*   **Entities:** Just an ID number (e.g., `1024`).
*   **Components:** Raw data containers (e.g., `Position`, `Velocity`, `Health`).
*   **Systems:** Logic that iterates over data (e.g., `MovementSystem` updates position based on velocity).
*   **Benefit:** This allows for thousands of active objects without the memory overhead of JavaScript classes.

#### 3. Zero-Asset Audio Synthesis
There are almost no `.mp3` or `.wav` files for sound effects.
*   **The Solution:** The `AudioService` uses the **Web Audio API** to generate sound waves (Oscillators, Noise Buffers) in real-time code.
*   **The Benefit:** Massive reduction in download size and infinite variation in sound effects.

#### 4. High-Performance Rendering
*   **InstancedMesh:** We don't render 10,000 separate bullets. We render *one* bullet geometry 10,000 times using GPU instancing (`InstancedMesh`).
*   **TypedArrays:** Data is packed into `Float32Arrays` before being sent to the GPU, minimizing garbage collection pauses.
*   **Double Buffering:** The Event Bus uses a "flip-flop" buffer strategy to safely transfer inputs (mouse clicks, keyboard) from the UI thread to the Game thread without race conditions.

#### 5. Spatial Hashing
To handle collision detection for thousands of enemies:
*   The world is divided into a grid of cells.
*   Entities are mapped to these cells every frame.
*   Collision checks only happen between entities in the same cell, reducing complexity from $O(n^2)$ to nearly $O(n)$.

---

### Local Development

To run the simulation on your local machine:

```bash
# 1. Clone the repository
git clone https://github.com/mesoelfy/mesoelfy.github.io.git

# 2. Install dependencies
npm install

# 3. Start the development server
npm run dev
```

Open `http://localhost:3000` in Chrome (recommended for best WebGL performance).

### Project Structure

*   `src/engine`: The custom ECS game engine (Logic, Physics, AI).
*   `src/ui`: React components, HUD, and 3D Scene configurations.
*   `src/app`: Next.js App Router setup.
*   `electron`: Configuration for the desktop app wrapper.

### License

This project is open source under the [MIT License](LICENSE).
