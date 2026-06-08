import subprocess
import uuid
from pathlib import Path
from typing import List

from .models import JobRequest, JobResponse, ToolDefinition, ToolVersion


def validate_params(tool: ToolDefinition, params: List[str]) -> None:
    allowed = set(tool.allowed_params)
    blocked = set(tool.blocked_params)

    for param in params:
        if param in blocked:
            raise ValueError(f"Parámetro bloqueado por seguridad para {tool.id}: {param}")

        if param.startswith("-") and param not in allowed:
            raise ValueError(f"Parámetro no permitido para {tool.id}: {param}")


def build_tool_args(tool_id: str, target: str, params: List[str]) -> List[str]:
    if tool_id == "nmap":
        return [
            "-sT",
            "-Pn",
            *params,
            "-oX",
            "/workspace/output/nmap-result.xml",
            target
        ]

    if tool_id == "nuclei":
        return [
            "-u",
            target,
            "-silent",
            "-jsonl",
            *params,
            "-o",
            "/workspace/output/nuclei-result.jsonl"
        ]

    if tool_id == "sqlmap":
        return [
            "-u",
            target,
            "--batch",
            *params
        ]

    if tool_id == "xsstrike":
        return [
            "-u",
            target,
            *params
        ]

    raise ValueError(f"Herramienta no soportada todavía: {tool_id}")
def run_container(
    job: JobRequest,
    tool: ToolDefinition,
    version: ToolVersion,
    rollback_used: bool = False
) -> JobResponse:
    validate_params(tool, job.params)

    job_id = str(uuid.uuid4())
    output_dir = Path("jobs") / job_id
    output_dir.mkdir(parents=True, exist_ok=True)

    tool_args = build_tool_args(job.tool_id, job.target, job.params)

    command = [
        "docker",
        "run",
        "--rm",
        "--name",
        f"dani-eth-{job.tool_id}-{job_id[:8]}",
        "--cpus",
        "1.0",
        "--memory",
        "2g",
        "--pids-limit",
        "256",
        "--network",
        "dani-eth-lab",
        "--mount",
        f"type=bind,src={output_dir.resolve()},dst=/workspace/output",
        version.image,
        *tool_args
    ]

    result = subprocess.run(
        command,
        capture_output=True,
        text=True,
        timeout=600
    )

    status = "success" if result.returncode == 0 else "failed"

    return JobResponse(
        job_id=job_id,
        tool_id=job.tool_id,
        image_used=version.image,
        version_used=version.version,
        exit_code=result.returncode,
        status=status,
        stdout=result.stdout,
        stderr=result.stderr,
        output_dir=str(output_dir.resolve()),
        rollback_used=rollback_used
    )