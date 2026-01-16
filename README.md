# LLM Visualizer

An interactive, animated visualization of LLM transformer architecture designed for complete beginners to understand how Large Language Models work.

## What is this?

This app lets you:

1. **Train a tiny LLM** - Watch step-by-step how a language model learns from text
2. **Run inference** - Use your trained model to generate text and see exactly what happens inside

No ML background required. Every step is explained in plain English with real numbers.

## Features

- **Interactive Training** - Build vocabulary, initialize embeddings, watch the training loop
- **Step-by-step Controls** - Play, pause, or step through one operation at a time
- **Visual Pipeline** - See data flow through tokenization → embeddings → attention → output
- **Math Details** - Click any component to see the actual calculations
- **Tiny Model** - Small enough to visualize everything (8 dimensions, 3 layers, ~25 word vocabulary)

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm

### Installation

```bash
# Clone the repository
git clone git@github.com:slahiri/llm_emulator.git
cd llm_emulator

# Install dependencies
pnpm install

# Start development server
pnpm dev
```

Open http://localhost:5173 in your browser.

## How to Use

### 1. Training Mode (`/training`)

Walk through 4 stages to train your model:

| Stage | What You Learn |
|-------|----------------|
| 1. Vocabulary | How words become numbers (tokenization) |
| 2. Embeddings | How numbers become meaning vectors |
| 3. Attention | How the model knows which words matter |
| 4. Training Loop | How the model learns from mistakes |

### 2. Execution Mode (`/execution`)

After training, test your model:

- Enter a prompt (e.g., "The cat")
- Watch the model predict the next word
- Step through the inference pipeline
- See attention patterns and probabilities

## Tech Stack

- **Framework:** React + TypeScript + Vite
- **State Management:** Zustand
- **UI Components:** shadcn/ui
- **Visualization:** React Flow (@xyflow/react)
- **Animation:** Framer Motion
- **Charts:** Recharts
- **Storage:** LocalStorage (browser)

## Project Structure

```
/src
  /components
    /training        # Training stage components
    /execution       # Inference components
    /shared          # Reusable components
    /ui              # shadcn/ui components
  /stores            # Zustand state management
  /db                # Storage abstraction
  /lib               # Core LLM logic
  /routes            # Page components
```

## The Tiny Model

| Parameter | Value |
|-----------|-------|
| Vocabulary | ~25 words |
| Embedding Dimensions | 8 |
| Transformer Layers | 3 |
| Attention Heads | 2 per layer |

Small enough to show all values, large enough to demonstrate real concepts.

## Contributing

Contributions welcome! Please open an issue first to discuss what you'd like to change.

## License

MIT
