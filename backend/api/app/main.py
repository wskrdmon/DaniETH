import subprocess
from fastapi import FastAPI, HTTPException
from pathlib import Path

from .inventory import (
    add_tool_version,
    delete_tool,
    get_rollback_version,
    get_specific_version,
    get_stable_version,
    get_tool,
    load_tools,
    mark_version_as_failed,
    promote_version_to_stable,
    update_tool_version_status,
    update_version_health,
    upsert_tool,
)

from .models import (
    JobRequest,
    JobResponse,
    ToolDefinition,
    ToolUpdateRequest,
    ToolVersion,
    VersionStatusRequest,
)

from .runner_engine import run_container
app = FastAPI(
    title="Dani-ETH Runner API",
    description="API para que el orquestador ejecute herramientas Docker mediante runners.",
    version="0.1.0"
)


@app.get("/health")
def health():
    return {
        "status": "ok",
        "service": "dani-eth-runner-api"
    }


@app.get("/tools")
def list_tools():
    return load_tools()


@app.get("/tools/{tool_id}")
def read_tool(tool_id: str):
    tool = get_tool(tool_id)

    if not tool:
        raise HTTPException(status_code=404, detail="Herramienta no encontrada")

    return tool


@app.post("/tools")
def create_or_update_tool(tool: ToolDefinition):
    return upsert_tool(tool)


@app.put("/tools/{tool_id}")
def update_tool(tool_id: str, tool: ToolDefinition):
    if tool_id != tool.id:
        raise HTTPException(
            status_code=400,
            detail="El ID de la ruta no coincide con el ID del body"
        )

    return upsert_tool(tool)


@app.delete("/tools/{tool_id}")
def remove_tool(tool_id: str):
    deleted = delete_tool(tool_id)

    if not deleted:
        raise HTTPException(status_code=404, detail="Herramienta no encontrada")

    return {
        "deleted": True,
        "tool_id": tool_id
    }

@app.get("/tools/{tool_id}/versions")
def list_tool_versions(tool_id: str):
    tool = get_tool(tool_id)

    if not tool:
        raise HTTPException(status_code=404, detail="Herramienta no encontrada")

    return tool.versions


@app.post("/tools/{tool_id}/versions")
def create_tool_version(tool_id: str, version: ToolVersion):
    try:
        return add_tool_version(tool_id, version)
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error))


@app.patch("/tools/{tool_id}/versions/{version_number}/status")
def change_tool_version_status(
    tool_id: str,
    version_number: str,
    request: VersionStatusRequest
):
    try:
        return update_tool_version_status(
            tool_id=tool_id,
            version_number=version_number,
            new_status=request.status,
            notes=request.notes
        )
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error))


@app.post("/tools/{tool_id}/versions/{version_number}/health")
def check_tool_version_health(tool_id: str, version_number: str):
    tool = get_tool(tool_id)

    if not tool:
        raise HTTPException(status_code=404, detail="Herramienta no encontrada")

    version = get_specific_version(tool, version_number)

    if not version:
        raise HTTPException(status_code=404, detail="Versión no encontrada")

    command = [
        "docker",
        "run",
        "--rm",
        version.image,
        *version.healthcheck_args
    ]

    result = subprocess.run(
        command,
        capture_output=True,
        text=True,
        timeout=60
    )

    if result.returncode == 0:
        updated_tool = update_version_health(
            tool_id=tool_id,
            version_number=version_number,
            health_status="ok",
            notes="Health check ejecutado correctamente"
        )

        return {
            "tool_id": tool_id,
            "version": version_number,
            "image": version.image,
            "health_status": "ok",
            "stdout": result.stdout,
            "stderr": result.stderr,
            "updated_tool": updated_tool
        }

    updated_tool = update_version_health(
        tool_id=tool_id,
        version_number=version_number,
        health_status="failed",
        notes="Health check falló"
    )

    return {
        "tool_id": tool_id,
        "version": version_number,
        "image": version.image,
        "health_status": "failed",
        "stdout": result.stdout,
        "stderr": result.stderr,
        "updated_tool": updated_tool
    }

@app.post("/tools/{tool_id}/update")
def update_tool_image(tool_id: str, request: ToolUpdateRequest):
    tool = get_tool(tool_id)

    if not tool:
        raise HTTPException(status_code=404, detail="Herramienta no encontrada")

    dockerfile = Path(request.dockerfile_path)

    if not dockerfile.exists():
        raise HTTPException(
            status_code=400,
            detail=f"No existe el Dockerfile indicado: {request.dockerfile_path}"
        )

    image_tag = f"{request.image_name}:{request.new_version}"

    build_command = [
        "docker",
        "build",
        "-f",
        request.dockerfile_path,
        "-t",
        image_tag,
        "."
    ]

    build_result = subprocess.run(
        build_command,
        capture_output=True,
        text=True,
        timeout=900
    )

    if build_result.returncode != 0:
        return {
            "status": "build_failed",
            "message": "Falló la construcción de la imagen Docker",
            "tool_id": tool_id,
            "version": request.new_version,
            "image": image_tag,
            "build_stdout": build_result.stdout,
            "build_stderr": build_result.stderr
        }

    candidate_version = ToolVersion(
        version=request.new_version,
        image=image_tag,
        status="candidate",
        health_status="unknown",
        healthcheck_args=request.healthcheck_args,
        notes=request.notes or "Versión construida automáticamente como candidate"
    )

    try:
        add_tool_version(tool_id, candidate_version)
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error))

    health_command = [
        "docker",
        "run",
        "--rm",
        image_tag,
        *request.healthcheck_args
    ]

    health_result = subprocess.run(
        health_command,
        capture_output=True,
        text=True,
        timeout=120
    )

    if health_result.returncode == 0:
        updated_tool = promote_version_to_stable(
            tool_id=tool_id,
            version_number=request.new_version,
            notes="Versión construida, validada y promovida automáticamente a stable"
        )

        return {
            "status": "updated",
            "message": "Imagen construida correctamente, health check exitoso y versión promovida a stable",
            "tool_id": tool_id,
            "version": request.new_version,
            "image": image_tag,
            "build_stdout": build_result.stdout,
            "build_stderr": build_result.stderr,
            "health_stdout": health_result.stdout,
            "health_stderr": health_result.stderr,
            "updated_tool": updated_tool
        }

    updated_tool = mark_version_as_failed(
        tool_id=tool_id,
        version_number=request.new_version,
        notes="La imagen se construyó, pero falló el health check"
    )

    return {
        "status": "health_failed",
        "message": "La imagen se construyó, pero falló el health check. La versión fue marcada como failed",
        "tool_id": tool_id,
        "version": request.new_version,
        "image": image_tag,
        "build_stdout": build_result.stdout,
        "build_stderr": build_result.stderr,
        "health_stdout": health_result.stdout,
        "health_stderr": health_result.stderr,
        "updated_tool": updated_tool
    }

@app.post("/jobs/run", response_model=JobResponse)
def run_job(job: JobRequest):
    tool = get_tool(job.tool_id)

    if not tool:
        raise HTTPException(
            status_code=404,
            detail="Herramienta no registrada en inventario"
        )

    if job.version:
        selected_version = get_specific_version(tool, job.version)
    else:
        selected_version = get_stable_version(tool)

    if not selected_version:
        raise HTTPException(
            status_code=400,
            detail="No existe versión estable para esta herramienta"
        )

    try:
        first_result = run_container(
            job,
            tool,
            selected_version,
            rollback_used=False
        )
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error))

    if first_result.status == "success":
        return first_result

    if job.allow_rollback:
        fallback_version = get_rollback_version(tool)

        if not fallback_version:
            fallback_version = get_stable_version(tool)

        if fallback_version and fallback_version.version != selected_version.version:
            return run_container(
                job,
                tool,
                fallback_version,
                rollback_used=True
            )

    return first_result