# Chronovisor

## Project Overview

Chronovisor is a "Time Travel Explorer" application built with React, Vite, and TypeScript. It allows users to virtually "travel" to any location and time in history (or the future) by generating immersive textual descriptions and visual representations using Google's Gemini AI models.

**Key Features:**
*   **Interactive Globe:** A 3D globe interface for selecting geographic coordinates.
*   **Temporal Controls:** Precision controls to set specific dates and times (Year, Month, Day, Hour, Minute).
*   **Historical Event Lookup:** Natural language search to find and lock onto specific historical events (e.g., "Fall of Rome").
*   **AI-Powered Visualization:**
    *   Uses `gemini-3-pro-preview` to analyze the spatiotemporal context and generate atmospheric descriptions.
    *   Uses `gemini-3-pro-image-preview` to generate high-fidelity, photorealistic images of the target location and time.
*   **Sci-Fi UI:** A "holographic" cyberpunk-inspired interface with immersive visual effects.

## Tech Stack

*   **Framework:** [React 19](https://react.dev/)
*   **Build Tool:** [Vite](https://vitejs.dev/)
*   **Language:** [TypeScript](https://www.typescriptlang.org/)
*   **Styling:** [Tailwind CSS](https://tailwindcss.com/)
*   **Visualization:** [D3.js](https://d3js.org/) & [TopoJSON](https://github.com/topojson/topojson) (for the globe).
*   **AI Integration:** [`@google/genai`](https://www.npmjs.com/package/@google/genai) SDK.

## Project Structure

*   **`src/App.tsx`**: Main application layout and state management (coordinates, time, travel status).
*   **`src/components/`**: UI Components.
    *   `Globe.tsx`: The interactive 3D globe visualization.
    *   `ControlPanel.tsx`: Input forms for date/time and event search.
    *   `ViewScreen.tsx`: Displays the AI-generated results (image and description).
*   **`src/services/geminiService.ts`**: Handles all interactions with the Gemini API (Event Lookup, Time Travel logic, Image Generation).
*   **`src/types.ts`**: TypeScript definitions for coordinates, time parameters, and API responses.
*   **`src/constants.ts`**: Pre-defined historical events for the "Randomize" feature.

## Development & Usage

### Prerequisites
*   Node.js (v18+ recommended)
*   A Gemini API Key (from Google AI Studio)

### Setup

1.  **Install dependencies:**
    ```bash
    npm install
    ```

2.  **Configure API Key:**
    *   Create a `.env.local` file in the root directory.
    *   Add your API key:
        ```env
        GEMINI_API_KEY=your_api_key_here
        ```
    *   *Note:* The application also supports `window.aistudio` context if running within an AI Studio embedded environment.

3.  **Run Development Server:**
    ```bash
    npm run dev
    ```

4.  **Build for Production:**
    ```bash
    npm run build
    ```

### Key Commands

| Command | Description |
| :--- | :--- |
| `npm run dev` | Starts the local development server. |
| `npm run build` | Compiles the application for production. |
| `npm run preview` | Previews the production build locally. |

## Coding Conventions

*   **Styling:** Use Tailwind CSS utility classes for all styling. Avoid custom CSS files unless necessary for complex animations.
*   **State Management:** Use React Hooks (`useState`, `useEffect`) for local state.
*   **AI Service:** All AI logic should remain encapsulated in `geminiService.ts`.
*   **Types:** strictly adhere to types defined in `types.ts`.
