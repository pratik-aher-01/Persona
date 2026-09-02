# Persona — Embodied WebMCP Agent

Persona is a cutting-edge Embodied WebMCP Agent built with React, Three.js VRM, and Vite. It provides a real-time, interactive 3D avatar interface designed to bridge the gap between AI agents and users through natural voice communication and emotional expressiveness.

## 🌟 Features

- **Interactive 3D Avatars**: Built with Three.js and `@pixiv/three-vrm` for high-quality, expressive VRM avatars.
- **Real-Time Voice Communication**: Integrated Web Speech API for Speech-to-Text (STT) and Text-to-Speech (TTS), enabling natural conversations.
- **Emotion Engine**: Avatars can express various emotions (e.g., neutral, warm, skeptical, impressed, stern, concerned, surprised, thinking) dynamically.
- **WebMCP Integration**: Connects with WebMCP to allow AI models to interact with the avatar, controlling speech and emotions directly.
- **Responsive Glassmorphic UI**: A premium, modern user interface featuring dark/light modes, floating side drawers, and real-time transcripts.
- **Developer & Tuning Controls**: Built-in manual controls for fine-tuning lighting, camera angles, and avatar positioning on the fly.

## 🛠️ Tech Stack

- **Framework**: React 19 + TypeScript + Vite
- **3D Graphics**: Three.js + `@pixiv/three-vrm`
- **Agent Integration**: `webmcp-types`
- **Styling**: Vanilla CSS with Glassmorphism and CSS variables for theme management

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or higher recommended)
- npm, yarn, or pnpm

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd persona
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open your browser and navigate to `http://localhost:5173`.

### Adding VRM Models

To render an avatar, place your `.vrm` files in the `public/models/` directory (e.g., `public/models/persona.vrm`). If a model is not found, a placeholder "Coming Soon" screen will be displayed.

## 💻 Usage

- **Microphone**: Click "START LISTENING" in the bottom footer to allow the app to capture your voice.
- **Themes**: Use the toggle in the top-right header to switch between Light and Dark modes.
- **Personas**: Open the left drawer to select different agent scenarios (e.g., Technical Interview).
- **Tools / Agent Activity**: Open the right drawer to see real-time tool calls (like `speak()`) made by the connected WebMCP agent.
- **Settings & Tuning**: Click the gear icon (⚙) in the bottom-left to adjust avatar camera, lighting, and manually trigger emotions or speech.

## 🤝 Contributing

Contributions are welcome! Feel free to open issues or submit pull requests to improve the Persona Embodied Agent experience.

## 📄 License

This project is open-source and available under the MIT License.
