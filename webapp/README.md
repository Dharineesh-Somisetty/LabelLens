# BuyRight Web Application

> AI-Powered Ingredient Analysis for Smarter Nutrition Choices

A modern web application for analyzing supplement ingredients using OCR and intelligent scoring algorithms.

## Features

- 📸 **Photo Upload**: Drag-and-drop or click to upload ingredient photos
- 🔍 **Smart OCR**: Automatic text extraction using Tesseract.js
- 📊 **Comprehensive Analysis**: Detailed breakdown of protein quality, bioavailability, and bloat risk
- 💯 **Apex Score**: Instant scoring from 0-100 with personalized recommendations
- 🎯 **Mode Selection**: Optimize for BULK or CUT phases
- 📈 **Interactive Charts**: Visualize ingredient distribution and score breakdowns
- ✨ **Beautiful UI**: Modern glassmorphism design with smooth animations

## Tech Stack

- **Frontend**: React + Vite
- **Styling**: TailwindCSS with custom design system
- **OCR**: Tesseract.js (client-side text extraction)
- **Charts**: Chart.js + react-chartjs-2
- **HTTP Client**: Axios
- **File Upload**: React Dropzone

## Getting Started

### Prerequisites

Node.js version 20.19+ or 22.12+ is recommended for full compatibility.

### Installation

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env
```

### Configuration

Edit `.env` file to set your API URL:
```
VITE_API_URL=http://localhost:8000
```

### Development

```bash
# Start development server
npm run dev
```

The application will be available at `http://localhost:5173`

### Build for Production

```bash
# Build optimized production bundle
npm run build

# Preview production build
npm run preview
```

## Project Structure

```
webapp/
├── src/
│   ├── components/          # React components
│   │   ├── UploadSection.jsx       # Landing page with upload
│   │   ├── LoadingAnalysis.jsx     # Loading screen
│   │   ├── ResultsDashboard.jsx    # Results display
│   │   ├── ScoreGauge.jsx          # Circular score visualization
│   │   ├── IngredientCard.jsx      # Individual ingredient display
│   │   └── InsightsCharts.jsx      # Chart visualizations
│   ├── services/            # API and OCR services
│   │   ├── api.js                  # Backend API calls
│   │   └── ocr.js                  # Tesseract.js integration
│   ├── styles/              # Global styles
│   │   └── index.css               # TailwindCSS + custom styles
│   ├── App.jsx              # Main application component
│   └── main.jsx             # React entry point
├── public/                  # Static assets
├── index.html              # HTML template
├── vite.config.js          # Vite configuration
├── tailwind.config.js      # Tailwind configuration
└── package.json            # Dependencies
```

## Usage

1. **Select Mode**: Choose between BULK or CUT mode based on your fitness goals
2. **Upload Photo**: Drag and drop or click to upload a photo of your product's ingredient list
3. **Wait for Analysis**: The app will extract text using OCR and analyze the ingredients
4. **View Results**: Get your Apex Score, ingredient breakdown, warnings, and personalized recommendations

## API Integration

The web app connects to the BuyRight backend API. Make sure the backend is running:

```bash
cd ../backend
uvicorn app.main:app --reload
```

## Features in Detail

### Apex Score Algorithm
- Starts at 0 and adds points for quality proteins and supplements
- Considers bioavailability and weighted position in ingredient list
- Applies penalties for high bloat risk ingredients
- Mode-specific penalties (e.g., carbs in CUT mode)

### OCR Processing
- Client-side text extraction using Tesseract.js
- Automatic preprocessing and ingredient parsing
- Supports JPEG, PNG, and WebP formats
- Max file size: 10MB

### Visualizations
- Circular gauge with color-coded score ranges
- Donut chart showing ingredient distribution
- Bar chart displaying score breakdown
- Responsive design for all screen sizes

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)

## License

See LICENSE file in the root directory.
