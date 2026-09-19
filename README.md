# 🥗 NutriScan — AI Clinical Nutritionist & Ingredient Decoder

**NutriScan** is an intelligent web application designed to analyze packaged food labels, decode complex additive names (INS / E-numbers), flag dietary allergens, and evaluate food safety across different age groups. Powered by an extensive food additive database and an AI Clinical Nutritionist engine, NutriScan empowers consumers to make informed, healthy choices.

---

## 🌟 Key Features

- 📸 **Live Camera & Image OCR Scanning**: Instant text extraction from food label photos using Tesseract.js OCR.
- 🧪 **Comprehensive Additive Analysis**: Detects E-numbers, INS codes, artificial sweeteners, synthetic colors, and preservatives.
- 🟢 **Safety & Risk Scale**: Classifies ingredients into clear risk levels — **Low Risk**, **Moderate Concern**, **Watch Level**, and **Unlisted**.
- 👶 **Age-Group Edibility Matrix**: Tailored clinical safety breakdowns across 4 life stages:
  - **Infants & Toddlers (0–3 yrs)**
  - **Children (4–12 yrs)**
  - **Adults (13–64 yrs)**
  - **Seniors (65+ yrs)**
- 🤖 **Interactive AI Clinical Nutritionist**: Ask custom questions about any scanned ingredient's safety, side effects, daily intake limits, or age appropriateness.
- 📊 **Dual View Matrix**: Switch seamlessly between responsive **Card View Grid** and **Table View Matrix**.
- 🌙 **Dark & Light Mode**: High-contrast, accessible UI tailored for both mobile and desktop/laptop viewports.

---

## 🛠️ Tech Stack

- **Frontend**: React 18, Vite, React Router DOM
- **Styling**: Tailwind CSS, Lucide Icons
- **OCR Engine**: Tesseract.js (Optical Character Recognition)
- **AI Integration**: Pollinations AI & HuggingFace Inference (DeepSeek / Clinical LLM Endpoint)
- **Backend / Proxy**: Node.js & Express server

---

## 🚀 Quick Start & Installation

### Prerequisites
- Node.js (v18.0.0 or higher)
- npm or yarn

### 1. Clone the Repository
```bash
git clone https://github.com/YOUR_USERNAME/nutriscan.git
cd nutriscan
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Start Development Server
```bash
npm run dev
```
Open your browser at `http://localhost:3000` to view the application.

### 4. Production Build
```bash
npm run build
```

---

## 📂 Project Structure

```
Hackathon/
├── src/
│   ├── components/         # Reusable UI components (IngredientCard, AgeGroupMatrix, ChatAssistant, etc.)
│   ├── data/               # Food additive databases, E-numbers, allergen registries
│   ├── lib/                # Core engines (analyzer.js, edibility.js, llm.js, alternatives.js)
│   ├── screens/            # Main application views (Home, Results, CameraScan, ReviewText, Settings)
│   ├── utils/              # Text normalization & helper utilities
│   └── App.jsx             # Main router configuration
├── server/                 # Express proxy server for OCR & API endpoints
├── public/                 # Static assets
└── package.json
```

---

## 🛡️ Privacy & Safety Disclaimer

NutriScan provides food safety insights derived from public food standards databases (FSSAI, US FDA, Codex Alimentarius, EFSA). Information provided by NutriScan is intended for educational purposes and is not a substitute for professional medical or pediatric advice.

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.
