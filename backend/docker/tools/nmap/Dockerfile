FROM dani-eth/tool-base:0.1.0

LABEL org.opencontainers.image.title="Dani-ETH Nmap"
LABEL org.opencontainers.image.version="0.1.0"

USER root

RUN apt-get update && apt-get install -y --no-install-recommends \
    nmap \
    && rm -rf /var/lib/apt/lists/*

USER runner

ENTRYPOINT ["/usr/bin/tini", "--", "nmap"]
CMD ["--version"]