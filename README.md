<div align="center">

# FreePlanTour Assistant

An AI travel assistant that helps visitors discover what to see, do and plan for
a destination — embedded as a modal on [freeplantour.com](https://freeplantour.com)
destination pages.

</div>

## Features

- Destination-aware AI travel assistant (itineraries, activities, food, family &
  free plans, transport, nearby places)
- Answers in the user's own language (auto-detected per message)
- Fresh web search with cited sources for time-sensitive information
- Generative UI — rich inline components rendered from a streamed spec
- Embeddable modal/widget for FreePlanTour destination pages
- Multiple search providers (Tavily, SearXNG, Brave, Exa)
- Model selector with dynamic provider detection (OpenAI, Anthropic, Google,
  Ollama, Vercel AI Gateway, OpenAI-compatible providers)

## Getting started

```bash
bun install
cp .env.local.example .env.local   # set at least one AI provider + one search provider
bun dev
```

Visit http://localhost:3000. See [docs/CONFIGURATION.md](./docs/CONFIGURATION.md)
for the full configuration reference and
[docs/freeplantour-assistant.md](./docs/freeplantour-assistant.md) for
assistant-specific setup and embedding.

## Attribution & License

This project is adapted from [Morphic](https://github.com/miurla/morphic) and
keeps the original license requirements. It is licensed under the Apache License
2.0 — see the [LICENSE](LICENSE) file for details, including the original
copyright notice.
