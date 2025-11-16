ConceptGuide

An AI-Powered Learning Companion for Understanding Complex Concepts

ConceptGuide is an intelligent, AI-powered educational platform that transforms how students learn from complex educational materials. Instead of passively reading, ConceptGuide actively diagnoses learning gaps, visualizes concept relationships, and creates personalized learning paths tailored to each student's specific needs.

📋 Table of Contents

The Challenge

Our Solution

Key Features

Technology Stack

Architecture

Getting Started

How to Use

Contributing

License

Acknowledgments

🔍 The Challenge

Students learning from textbooks, research papers, and educational PDFs face several critical challenges:

Passive Learning: Traditional reading is passive; students don't know if they truly understand until they're tested.

Hidden Confusion: Students often don't realize they're confused until they fail an exam or assignment.

Prerequisite Gaps: Complex concepts build on foundations. If a student misses a prerequisite, everything after becomes incomprehensible.

One-Size-Fits-All: Educational materials assume all students have the same background knowledge.

Isolated Concepts: Students struggle to see how concepts relate to each other and build upon one another.

💡 Our Solution

ConceptGuide solves these problems through a 5-stage diagnostic and personalized learning system:

Intelligent Confusion Detection: Students highlight text they find confusing, triggering an AI-powered diagnostic process.

5-Level Diagnostic Questioning: The system asks 5 targeted questions to pinpoint the exact nature of the confusion (Vocabulary, Foundation, Misconception, etc.).

AI-Powered Analysis: Google's Gemini AI analyzes student responses to identify specific knowledge gaps and calculate mastery scores.

Visual Concept Mapping: An interactive mind map is generated, visualizing all related concepts, their prerequisite dependencies, and a recommended learning path.

Personalized Learning Path: A step-by-step learning experience is created, covering every concept from the mind map with explanations, examples, and mandatory practice problems to ensure comprehension.

✨ Key Features

📄 PDF Processing: Upload any PDF, and the system automatically extracts and organizes the text for easy reading and interaction.

🧠 AI-Powered Diagnostics: Select confusing text to generate 5 levels of diagnostic questions that pinpoint the root of your misunderstanding.

🗺️ Interactive Concept Maps: Visualize the relationships between concepts with an interactive, color-coded dependency graph powered by ReactFlow.

🎓 Personalized Learning Paths: Receive a step-by-step "repair path" that guides you through foundational concepts up to the target topic, complete with explanations, examples, and practice problems.

🎤 Voice-to-Text Input: Answer questions using your voice with built-in, browser-based speech recognition.

📊 Progress Tracking & History: All sessions are saved to your account. Review past analyses, resume learning paths, and gain insights into your common confusion types and strongest subjects.

🔐 Authentication: Secure user accounts with Firebase for data persistence and cross-device access.

🛠️ Technology Stack
Frontend
Technology	Purpose
React	UI framework for component architecture
Vite	Fast build tool and dev server
Tailwind CSS	Utility-first CSS framework
Zustand	Lightweight state management
ReactFlow	Interactive graph visualization
pdfjs-dist	PDF rendering and text extraction
Firebase	Authentication and Firestore database
Backend
Technology	Purpose
Node.js	JavaScript runtime environment
Express	Web server framework
Google Generative AI	Gemini AI model integration
CORS	Cross-origin resource sharing
dotenv	Environment variable management
🏛️ Architecture

The system uses a React frontend that communicates with a Node.js/Express backend. The backend orchestrates calls to the Google Gemini AI for all intelligent processing. Firebase is used for user authentication and data persistence.

code
Code
download
content_copy
expand_less
┌─────────────────────────────────────────────────────────────┐
│                        Frontend (React)                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Components │  │  Zustand    │  │  React Router│      │
│  │              │  │   Stores    │  │              │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│         │                  │                  │            │
│         └──────────────────┼──────────────────┘            │
│                            │                                 │
└────────────────────────────┼─────────────────────────────────┘
                             │
                    ┌────────▼────────┐
                    │   Express API   │
                    │   (Port 3001)   │
                    └────────┬────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                     │
┌───────▼────────┐  ┌────────▼────────┐  ┌───────▼────────┐
│  Gemini AI     │  │   Firebase      │  │  PDF.js        │
│  (Analysis)    │  │  (Auth/DB)      │  │  (Client-side)  │
└────────────────┘  └─────────────────┘  └────────────────┘
🚀 Getting Started
Prerequisites

Node.js (v18 or higher)

npm or yarn

Git

Google Account (for Gemini API key)

1. Clone the Repository
code
Bash
download
content_copy
expand_less
git clone https://github.com/your-username/ConceptGuide.git
cd ConceptGuide
2. Install Dependencies
code
Bash
download
content_copy
expand_less
npm install
3. Configure Environment Variables

Create a .env file in the root directory and add your Google Gemini API key.

code
Env
download
content_copy
expand_less
# Required: Google Gemini API Key
GEMINI_API_KEY=your_google_ai_api_key_here

# Optional: Server Port (defaults to 3001)
PORT=3001

Get a Google AI API Key:

Visit Google AI Studio.

Click "Create API Key" and copy the key.

4. (Optional) Firebase Setup

For user accounts and data persistence, set up a Firebase project and add the configuration to your .env file. See FIREBASE_SETUP.md for a detailed guide.

code
Env
download
content_copy
expand_less
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
# ... and other Firebase variables
5. Start the Servers

You need to run the backend and frontend servers in two separate terminals.

Terminal 1: Start the Backend Server

code
Bash
download
content_copy
expand_less
npm run server

The backend will start on http://localhost:3001.

Terminal 2: Start the Frontend Development Server

code
Bash
download
content_copy
expand_less
npm run dev

The frontend will be available at http://localhost:5173.

6. Access the Application

Open your browser and navigate to http://localhost:5173.

🎮 How to Use

Upload a PDF: Drag and drop a PDF file into the application.

Select Text: Highlight any text you find confusing. A button will appear.

Start Diagnosis: Click the "I'm confused about this" button to open the question modal.

Answer Questions: Answer the 5 generated questions using text or voice input.

Review Analysis: Once you submit, the AI analyzes your answers and presents a diagnostic summary and an interactive concept map.

Explore the Map: Zoom and pan the mind map to see how concepts are related. Click "Continue to Learning Path" when ready.

Follow Learning Path: Progress through the step-by-step learning cards. You must solve the practice problem on each card to continue.

Track Progress: Your session is automatically saved. Visit the "History" page to review past sessions or resume an incomplete learning path.

🤝 Contributing

We welcome contributions! Please follow these steps:

Fork the repository.

Create a new feature branch (git checkout -b feature/amazing-feature).

Commit your changes (git commit -m 'Add amazing feature').

Push to the branch (git push origin feature/amazing-feature).

Open a Pull Request.

📄 License

This project is licensed under the MIT License. See the LICENSE file for details.

🙏 Acknowledgments

CSGirlies Hackathon for motivating us to develop such a good project. 

Google Generative AI (Gemini) for intelligent analysis and generation.

ReactFlow for beautiful graph visualizations.

PDF.js for client-side PDF processing.

Firebase for authentication and data persistence.

The open-source community for their excellent tools and libraries.