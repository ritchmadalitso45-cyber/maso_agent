<<<<<<< HEAD
# Maso frontend

React chat interface connected to the sibling Maso Safety API.

## Run locally

1. In `C:\Projects\Maso`, run `start.cmd` (default port 8000).
2. In `C:\Projects\MasoFront`, run `npm install` if needed, then `npm run dev`.
3. Open the local address printed by Vite, normally http://127.0.0.1:5173.

Messages are sent to `/api/v1/analyze`. Vite forwards requests to Maso and supplies the API key on the server. The key is read from the sibling `../Maso/.env`; it is never included in the browser bundle. Restart Vite after changing the key.

To use a different backend, set `MASO_API_TARGET` (for example `http://127.0.0.1:8001`) and, if needed, `MASO_API_KEY` in the process environment or an ignored `.env.local`. Never use a `VITE_` variable for secrets.

The interface displays the API verdict, model phishing confidence, findings, recommended steps, check statuses and limitations. Link expansion and external provider checks remain off. Verdicts come exclusively from the local model. Failures show an error with no rule-based fallback.

## Verify and deploy

Run `npm run lint` and `npm run build`. `npm run preview` includes the same local proxy for checking the production build.

For deployment, configure a trusted server or authenticated gateway to forward `/api` to Maso and supply its API key. A static file host alone cannot provide this server-side proxy. Do not expose the local Vite development/preview servers as a public production gateway.


## Attachments

Use the attachment button to choose an `.eml` email or a PNG/JPEG/WebP image containing a QR code (up to 2 MiB). The selected filename appears above the input; press Send to upload, or remove it with the cross button. Any typed message stays as a separate draft and is not included with the file. Only one check runs at a time. Empty files and unsupported formats are rejected locally; the API validates the actual email/image content. Images are scanned for QR codes, not general screenshot text or image content. No link destinations are contacted by these requests.

Upload-request checks: `node --test tests/analysisRequest.test.js`.
=======
## PROBLEM STATEMENT AND SOLUTION
Problem Statement

Every day, people put their trust in links. A delivery notification. A message from the boss. A QR code at a parking meter. We assume that because it looks normal, it is normal but in the split second it takes to click, everything can fall apart.

The numbers tell the story. In the fourth quarter of 2025 alone, the Anti-Phishing Working Group tracked over 853,000 phishing attacks—and 3.8 million across the full year. Social media and SaaS/webmail were hit hardest, each taking 20.3% of all attacks. Wire-transfer business email compromise jumped 136% in a single quarter and the FBI reports that BEC alone cost Americans $2.8 billion in 2024. QR code scams, SMS phishing and gift-card fraud are all surging.

The core issue? These attacks don't break down the door—they slip in through a single, harmless-looking click. Existing security tools are built for IT departments, not everyday people. They block sites without explanation, bury users in jargon, and leave them confused rather than informed. Most victims never saw it coming—and honestly neither would most of us.

Proposed Solution

Maso is your AI link safety buddy a simple, human-friendly tool that checks anything you're unsure about before you click.

The process is effortless:

1. Paste it — Drop in a link, a message, a QR code, whatever you've got.
2. Maso checks it out — It spots the little things that don't look right: spoofed domains, mismatched URLs, known phishing patterns, QR-code redirects, and shortened links hiding their destination.
3. It digs deeper — Maso works out how risky the link actually is, using the same threat signals the APWG and FBI track.
4. You get the rundown — A quick checklist and a plain-English heads-up on anything sketchy.

## TECHNOLOGY STACK

Maso is built on a modern, lightweight stack designed for speed and simplicity.

Frontend:
- React — A component-based JavaScript library for building the user interface.
- Vite — A next-generation build tool that provides lightning-fast development and optimized production builds.

AI and Machine Learning:
- Hugging Face Transformers — The leading library for state-of-the-art natural language processing models.
- PyTorch — The deep learning framework powering the model's inference.
- BERT (bert-large-uncased) — A transformer-based language model fine-tuned specifically for phishing detection.

Data:
- Email Corpus Dataset — A curated collection of phishing and legitimate email samples used for training and validation.

Model Hosting:
- Hugging Face Model Hub — Hosts the fine-tuned phishing detection model, making it accessible via API.

---

Setup and Installation Instructions

Prerequisites:
- Node.js (v18 or higher)
- npm or yarn
- Python 3.9+ (for running the model locally, optional)
- A Hugging Face account (for API access, optional)

Frontend Setup:

1. Clone the repository:
   git clone https://github.com/ritchmadalitso45-cyber/maso_agent.git
   cd maso_agent

2. Install dependencies:
   npm install

3. Start the development server:
   npm run dev

4. Open your browser and navigate to:
   http://localhost:5173

Backend / AI Model Setup (Optional for Local Inference):

1. Install Python dependencies:
   pip install transformers torch datasets

2. Load the model:
   from transformers import AutoTokenizer, AutoModelForSequenceClassification

   model_name = "ealvaradob/bert-finetuned-phishing"
   tokenizer = AutoTokenizer.from_pretrained(model_name)
   model = AutoModelForSequenceClassification.from_pretrained(model_name)

3. Run inference on user input (link, message, or QR code content) and return the classification result.

Using the Hugging Face Inference API (Recommended):

1. Get your API key from https://huggingface.co/settings/tokens
2. Set the environment variable:
   export HF_API_KEY=your_api_key_here
3. The Maso agent will automatically call the model endpoint for real-time phishing detection.

---

## AI METHODOLOGY AND IMPLEMENTATION

Maso's intelligence is powered by a fine-tuned BERT model—a state-of-the-art transformer architecture that understands language context deeply, not just surface-level patterns.

How It Works:

1. Input Processing — When a user pastes a link, message, or QR code content, Maso tokenizes the input into a format the BERT model understands.

2. Classification — The model analyzes the input against patterns learned from millions of phishing and legitimate samples, classifying it as either "phishing" or "safe."

3. Risk Scoring — Beyond binary classification, Maso evaluates the confidence score and combines it with heuristic signals (spoofed domains, URL mismatches, shortened links) to generate a risk level.

4. Plain-English Output — The result is translated into a simple checklist and a clear verdict, so users understand not just what the answer is, but why.

Training Data:
The model was fine-tuned on a diverse dataset containing URLs, SMS messages, emails, and website content—ensuring Maso can detect phishing across all common attack vectors.

Model Performance:
- Accuracy: 97.17%
- Precision: 96.58%
- Recall: 96.70%
- False Positive Rate: 2.49%

These metrics mean Maso catches nearly all phishing attempts while rarely flagging legitimate content—striking the right balance between safety and usability.

---

## AI MODEL NAMES AND API USAGE

Model Name:
ealvaradob/bert-finetuned-phishing

Base Architecture:
bert-large-uncased (24-layer, 1024 hidden dimension, 16 attention heads, 336M parameters)

Model Host:
Hugging Face Model Hub
URL: https://huggingface.co/ealvaradob/bert-finetuned-phishing

API Usage:

Maso uses the Hugging Face Inference API to access the model in real-time.

Example API Call:

POST https://api-inference.huggingface.co/models/ealvaradob/bert-finetuned-phishing
Headers:
  Authorization: Bearer YOUR_HF_API_KEY
  Content-Type: application/json

Body:
{
  "inputs": "http://suspicious-link.example.com/verify-account"
}

Response:
[
  {
    "label": "phishing",
    "score": 0.9823
  }
]

The Maso agent parses this response and generates a user-friendly verdict with a safety checklist.

Dataset Used:
Email Corpus Dataset
URL: https://github.com/cw-l/email-corpus

---

Product Screenshots

[Insert Screenshot 1: Maso Homepage]
The clean, minimal landing page where users paste their link, message, or QR code content.

[Insert Screenshot 2: Maso Analysis in Progress]
A brief loading state showing Maso is checking the input against threat signals.

[Insert Screenshot 3: Maso Verdict — Safe]
A green result card with a plain-English checklist confirming the link is safe.

[Insert Screenshot 4: Maso Verdict — Suspicious]
A red warning card highlighting the specific issues detected—spoofed domain, shortened link, or known phishing pattern—with a clear explanation.

[Insert Screenshot 5: Maso Detailed Breakdown]
An expanded view showing the risk score, detected threat signals, and recommendations for the user.

---

Team Member Contributions

Madalitso Ritch
Role: Frontend Development

Contributions:
 Frontend Development Roles and Responsibilities

Madalitso Ritch
Role: Frontend Developement
Contributions
 -UI Design and Implementation — Built the Maso interface using React with a clean, intuitive layout.
 -Component Architecture — Developed reusable components for input fields, loaders, verdict cards, and checklists.
 -Vite Configuration — Set up Vite for fast development and optimized production builds.
 -Input Handling — Implemented paste-and-submit functionality for links, messages, and QR codes.
 -API Integration — Connected the frontend to the Hugging Face Inference API for real-time results.
 -Verdict Display — Built dynamic result cards with color-coded warnings and plain-English explanations.
 -Responsive Design — Ensured seamless functionality across desktop, tablet, and mobile devices.
 -Error Handling — Implemented graceful error states for network failures and invalid inputs.
 
Vincent Banda
Role: Ai integration  and Backend Development
- Integrated the fine-tuned BERT phishing detection model (ealvaradob/bert-finetuned-phishing) into the Maso agent.
- Implemented API calls to the Hugging Face Inference API for real-time classification.
- Built the frontend using React and Vite, including the user interface for pasting links and displaying verdicts.
- Connected the email corpus dataset (cw-l/email-corpus) for model validation and testing.
- Designed the plain-English output system that translates model predictions into actionable safety checklists.
>>>>>>> origin/main
