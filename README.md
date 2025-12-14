<div align="center">

![MESOELFY_OS](https://capsule-render.vercel.app/api?type=waving&color=050505&height=220&section=header&text=MESOELFY_OS&fontSize=70&fontColor=78F654&fontAlign=50&fontAlignY=40&animation=fadeIn&desc=A%20PORTFOLIO%20THAT%20FIGHTS%20BACK&descSize=20&descAlign=50&descAlignY=65)

![System Integrity](https://img.shields.io/badge/SYSTEM_INTEGRITY-100%25-78F654?style=for-the-badge&logo=githubactions&logoColor=black&labelColor=15530A)
![Latent Space](https://img.shields.io/badge/LATENT_SPACE-CONNECTED-9E4EA5?style=for-the-badge&logo=network&logoColor=white&labelColor=350E3A)
![Core](https://img.shields.io/badge/KERNEL-REACT_THREE_FIBER-00F0FF?style=for-the-badge&logo=react&logoColor=black&labelColor=005f66)

</div>

### // MISSION_STATEMENT

**MESOELFY_OS** is an interactive 3D operating system that runs in your browser. It serves as the digital HQ for **Elfy**, a creative technologist and "Latent Space Bandit."

Unlike standard portfolios, this site is a **playable environment**. It features a custom Entity Component System (ECS), procedural audio synthesis, and a reactive combat simulation hidden within the UI.

---

### // ACCESS_PROTOCOLS

Choose your method of entry.

| 🟢 **ONLINE (Instant)** | 📦 **OFFLINE (App)** | 💻 **SOURCE (Dev)** |
| :--- | :--- | :--- |
| **[ mesoelfy.github.io ](https://mesoelfy.github.io)** | **[ Download Release ](https://github.com/mesoelfy/mesoelfy.github.io/releases)** | **[ View Code ](https://github.com/mesoelfy/mesoelfy.github.io)** |
| The full experience, streamed directly to your browser. | Run the OS natively on Mac, Windows, or Linux (Electron). | Clone the repo and jack into the mainframe locally. |

> **⚠ NOTE:** First-time boot may stutter while 3D shaders compile. If visual glitches occur, refresh the uplink.

---

### // SYSTEM_ARCHITECTURE

A high-level schematic of how the OS functions.

```mermaid
graph TD
    subgraph CORE [// CORE_SYSTEM]
        A[Next.js 14] --> B(React Three Fiber);
        B --> C{Game Loop};
    end

    subgraph MODULES [// ACTIVE_MODULES]
        C -->|Logic| D[Entity Component System];
        C -->|Visuals| E[Three.js / Shaders];
        C -->|Sound| F[Web Audio API];
    end

    subgraph OUTPUT [// RENDER_TARGET]
        D --> G(UI Overlay);
        E --> H(3D Canvas);
        F --> I(Spatial Audio);
    end

    style CORE fill:#050505,stroke:#78F654,stroke-width:2px,color:#78F654
    style MODULES fill:#050505,stroke:#9E4EA5,stroke-width:2px,color:#9E4EA5
    style OUTPUT fill:#050505,stroke:#00F0FF,stroke-width:2px,color:#00F0FF
```

---

### // TECH_STACK (Inventory)

*   **⚡ Framework:** Next.js 14 (App Router) + TypeScript
*   **🎨 Graphics:** React Three Fiber (R3F) + Drei + Custom GLSL
*   **🧠 Logic:** Custom ECS Engine (Entity-Component-System)
*   **🔊 Audio:** Procedural Synthesis (No MP3s, just math)
*   **💅 Styling:** Tailwind CSS + Framer Motion
*   **🚀 Build:** Electron (Desktop) + GitHub Actions (CI/CD)

---

### // DEVELOPER_INSTALL

If you wish to modify the OS or study its architecture:

1.  **Clone the Node:**
    ```bash
    git clone https://github.com/mesoelfy/mesoelfy.github.io.git
    cd mesoelfy.github.io
    ```

2.  **Inject Dependencies:**
    ```bash
    npm install
    ```

3.  **Initialize Local Server:**
    ```bash
    npm run dev
    ```
    *Open `http://localhost:3000` to begin.*

---

<div align="center">
  <br />
  <a href="https://x.com/mesoelfy">
    <img src="https://img.shields.io/badge/DIRECT_UPLINK-TWITTER-1DA1F2?style=for-the-badge&logo=twitter&logoColor=white" />
  </a>
  <a href="https://mesoelfy.github.io">
    <img src="https://img.shields.io/badge/INITIATE-BOOT_SEQUENCE-78F654?style=for-the-badge&logo=playstation&logoColor=black" />
  </a>
  <br /><br />
  <sub>// END TRANSMISSION //</sub>
</div>
