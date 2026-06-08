FROM dani-eth/tool-base:0.1.0

LABEL org.opencontainers.image.title="Dani-ETH SQLMap"
LABEL org.opencontainers.image.description="Imagen Docker para ejecutar SQLMap desde runners Dani-ETH"
LABEL org.opencontainers.image.version="0.1.0"
LABEL danieth.tool.id="sqlmap"
LABEL danieth.tool.name="SQLMap"
LABEL danieth.tool.category="sql_injection_testing"
LABEL danieth.tool.capabilities="sql_injection_detection,database_security_testing"

USER root

RUN git clone --depth 1 https://github.com/sqlmapproject/sqlmap.git /opt/sqlmap \
    && chown -R runner:runner /opt/sqlmap

USER runner

WORKDIR /workspace

ENTRYPOINT ["/usr/bin/tini", "--", "python", "/opt/sqlmap/sqlmap.py"]
CMD ["--version"]