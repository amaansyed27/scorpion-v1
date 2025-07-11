# Scorpion: AI Course Generator

A modern React + Vite application that generates personalized AI-powered courses from content or documents.

## Features

- 🤖 AI-powered course generation using Google Gemini
- 📚 Interactive lessons with quizzes
- 💬 AI chat support for learning assistance
- 📄 Support for document uploads (PDF, text)
- 🎨 Modern UI with Tailwind CSS
- 📱 Responsive design
- ⚡ Lightning-fast development with Vite

## Tech Stack

- **Frontend**: React 19, TypeScript
- **Build Tool**: Vite 6.x
- **Styling**: Tailwind CSS
- **Routing**: React Router DOM
- **AI Integration**: Google Gemini API
- **Document Processing**: PDF.js
- **Development**: Hot Module Replacement (HMR)

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Google Gemini API key

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd scorpion_-ai-course-generator
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory and add your Gemini API key:
```env
GEMINI_API_KEY=your_google_gemini_api_key_here
NODE_ENV=development
```

4. Start the development server:
```bash
npm run dev
```

5. Open [http://localhost:5173](http://localhost:5173) to view the app.

## Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production with TypeScript checking
- `npm run preview` - Preview production build locally
- `npm run type-check` - Run TypeScript type checking
- `npm run lint` - Run TypeScript compilation check

## Project Structure

```
src/
├── components/     # Reusable UI components
│   ├── Button.tsx
│   ├── Card.tsx
│   ├── Header.tsx
│   └── icons.tsx
├── context/        # React context providers
│   ├── AppContext.tsx
│   └── Spinner.tsx
├── pages/          # Page components
│   ├── HomePage.tsx
│   └── CoursePage.tsx
├── services/       # API services
│   └── geminiService.ts
├── types.ts        # TypeScript type definitions
├── main.tsx        # Application entry point
└── index.css       # Global styles with Tailwind
```

## Development Features

- **Hot Module Replacement (HMR)** - Instant updates during development
- **TypeScript Support** - Full type safety and IntelliSense
- **Path Aliases** - Clean imports with `@/` prefix
- **Tailwind CSS** - Utility-first styling with autocomplete
- **Optimized Builds** - Code splitting and tree shaking
- **Modern ES Modules** - Fast bundling and development

## How It Works

1. **Content Input**: Users can either paste text content or upload documents
2. **AI Processing**: The Gemini AI analyzes the content and structures it into lessons
3. **Course Generation**: Creates sections, lessons, and quizzes based on the content
4. **Interactive Learning**: Users progress through lessons with AI chat support
5. **Progress Tracking**: System tracks completion and proficiency levels

## Environment Variables

- `GEMINI_API_KEY` - Your Google Gemini API key for AI functionality
- `NODE_ENV` - Environment mode (development/production)

## Building for Production

```bash
npm run build
```

The build artifacts will be stored in the `dist/` directory. The build is optimized with:
- Code splitting for better performance
- Tree shaking to remove unused code
- Source maps for debugging
- Vendor chunk separation

## VS Code Setup

This project includes recommended VS Code extensions and settings:
- Tailwind CSS IntelliSense
- TypeScript support
- Auto-formatting on save
- Path IntelliSense

## License

This project is licensed under the MIT License.
