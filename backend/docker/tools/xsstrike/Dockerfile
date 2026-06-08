FROM dani-eth/tool-base:0.1.0

LABEL org.opencontainers.image.title="Dani-ETH XSStrike"
LABEL org.opencontainers.image.description="Imagen Docker para ejecutar XSStrike desde runners Dani-ETH"
LABEL org.opencontainers.image.version="0.1.0"
LABEL danieth.tool.id="xsstrike"
LABEL danieth.tool.name="XSStrike"
LABEL danieth.tool.category="xss_testing"
LABEL danieth.tool.capabilities="xss_detection,web_parameter_testing"

USER root

RUN git clone --depth 1 https://github.com/s0md3v/XSStrike.git /opt/xsstrike \
    && python -m pip install --no-cache-dir -r /opt/xsstrike/requirements.txt \
    && chown -R runner:runner /opt/xsstrike

USER runner

WORKDIR /opt/xsstrike

ENTRYPOINT ["/usr/bin/tini", "--", "python", "/opt/xsstrike/xsstrike.py"]
CMD ["--help"]