# Nexus Agent Runner — Playwright Chromium + Node 20.
# Built on Microsoft's official Playwright image so all browser deps are pre-installed.
FROM mcr.microsoft.com/playwright:v1.49.0-jammy

ENV NODE_ENV=production
ENV AGENT_RUNNER_PORT=18790

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci --omit=dev

COPY runner/ ./runner/

EXPOSE 18790

# tini handles SIGTERM cleanly so docker stop drains in-flight runs.
RUN apt-get update && apt-get install -y --no-install-recommends tini && rm -rf /var/lib/apt/lists/*
ENTRYPOINT ["/usr/bin/tini", "--"]

CMD ["node", "runner/index.mjs"]
