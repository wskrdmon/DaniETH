FROM golang:1.25-bookworm AS builder

RUN go install -v github.com/projectdiscovery/nuclei/v3/cmd/nuclei@latest

FROM dani-eth/tool-base:0.1.0

LABEL org.opencontainers.image.title="Dani-ETH Nuclei"
LABEL org.opencontainers.image.description="Imagen Docker para ejecutar Nuclei desde runners Dani-ETH"
LABEL org.opencontainers.image.version="0.1.0"
LABEL danieth.tool.id="nuclei"
LABEL danieth.tool.name="Nuclei"
LABEL danieth.tool.category="template_scanning"
LABEL danieth.tool.capabilities="template_scanning,cve_detection,web_security_checks"

USER root

COPY --from=builder /go/bin/nuclei /usr/local/bin/nuclei

RUN chmod +x /usr/local/bin/nuclei

USER runner

ENTRYPOINT ["/usr/bin/tini", "--", "nuclei"]
CMD ["-version"]