FROM python:3.12-slim-bookworm

LABEL org.opencontainers.image.title="Dani-ETH Tool Base"
LABEL org.opencontainers.image.version="0.1.0"

ARG UID=10001
ARG GID=10001

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

USER root

RUN apt-get update && apt-get install -y --no-install-recommends \
    bash \
    ca-certificates \
    curl \
    git \
    jq \
    tini \
    dnsutils \
    iputils-ping \
    && rm -rf /var/lib/apt/lists/*

RUN groupadd -g ${GID} runner \
    && useradd --no-log-init -m -u ${UID} -g ${GID} -s /bin/bash runner

RUN mkdir -p /workspace/input /workspace/output /workspace/cache \
    && chown -R runner:runner /workspace

WORKDIR /workspace

USER runner

ENTRYPOINT ["/usr/bin/tini", "--"]
CMD ["bash"]