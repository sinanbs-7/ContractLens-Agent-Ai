# ContractLens — Contract Intelligence Agent

> **ContractLens** is an autonomous AI agent designed to read legal contracts, extract key obligations, track critical deadlines, flag risky clauses, compare document versions, and answer natural-language questions—all grounded in direct clause citations with persistent cross-session memory.

---

## 🎯 Problem Statement
Businesses lose an estimated 5–9% of annual revenue due to poor oversight of contract obligations. Details like renewal dates, cancellation windows, payment terms, and termination conditions remain buried across dozens of lengthy legal documents. As a result:
- Contracts silently auto-renew past cancellation deadlines.
- Payment terms and key party obligations get missed.
- Manual legal document tracking consumes significant business and operational time.

---

## 🤖 The Solution: ContractLens
ContractLens replaces manual tracking with a single, unified agent that proactively manages contract intelligence across your entire document library.

### Core Capabilities
- **Fact Extraction & Citation:** Extracts parties, effective/expiration dates, renewal terms, payment schedules, termination conditions, and obligations—always citing the exact clause or section source.
- **Plain-Language Summaries:** Generates concise executive summaries for non-legal stakeholders.
- **Proactive Deadline Alerts:** Automatically tracks extracted dates and raises alerts for approaching renewal or cancellation windows without requiring user prompts.
- **Risk Assessment:** Flags high-risk clauses (e.g., unlimited liability, short cancellation windows) and explains potential business risks in plain language.
- **Contract Version Comparison:** Analyzes two versions of a contract to highlight meaningful semantic changes rather than raw text diffs.
- **Grounded Q&A:** Responds to natural-language queries grounded strictly in source clauses (and explicitly states when information is unavailable rather than guessing).
- **Persistent Memory:** Retains knowledge of every processed contract across sessions using database storage and tool-calling capabilities.

---

## 🛠️ Tech Stack
- **Frontend:** React.js, Tailwind CSS, Vite
- **Backend:** Node.js, Express.js
- **Database & Persistent Storage:** Supabase (PostgreSQL)

---

## 🚀 Getting Started

### 1. Clone the Repository
\`\`\`bash
git clone https://github.com/sinanbs-7/ContractLens-Agent-Ai.git
cd ContractLens-Agent-Ai
\`\`\`

### 2. Install Dependencies
\`\`\`bash
npm install
\`\`\`

### 3. Configure Environment Variables
Create a `.env` file in the root directory and supply your credentials:

\`\`\`env
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173

# API Credentials
API_KEY=your_api_key_here

# Database Credentials
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
SUPABASE_ANON_KEY=your_supabase_anon_key

# Frontend Environment Variables
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_API_BASE_URL=http://localhost:5000/api
\`\`\`

### 4. Database Setup
1. Open your database dashboard $\rightarrow$ **SQL Editor**.
2. Run the SQL schema found in `supabase/migrations/001_initial_schema.sql`.

### 5. Start the Application
\`\`\`bash
npm run dev
\`\`\`

---

## 🛡️ License & Disclaimer
ContractLens is designed to assist business and operational workflows by removing manual document review overhead. It is intended for informational and contract management assistance.