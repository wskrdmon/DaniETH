import json
from pathlib import Path
from typing import List, Optional

from .models import ToolDefinition, ToolStatus, ToolVersion

DATA_FILE = Path("data/tools.json")


def load_tools() -> List[ToolDefinition]:
    if not DATA_FILE.exists():
        return []

    with DATA_FILE.open("r", encoding="utf-8") as file:
        data = json.load(file)

    return [ToolDefinition(**item) for item in data]


def save_tools(tools: List[ToolDefinition]) -> None:
    DATA_FILE.parent.mkdir(parents=True, exist_ok=True)

    with DATA_FILE.open("w", encoding="utf-8") as file:
        json.dump(
            [tool.model_dump() for tool in tools],
            file,
            indent=2,
            ensure_ascii=False
        )


def get_tool(tool_id: str) -> Optional[ToolDefinition]:
    tools = load_tools()

    for tool in tools:
        if tool.id == tool_id:
            return tool

    return None


def upsert_tool(tool: ToolDefinition) -> ToolDefinition:
    tools = load_tools()

    for index, existing_tool in enumerate(tools):
        if existing_tool.id == tool.id:
            tools[index] = tool
            save_tools(tools)
            return tool

    tools.append(tool)
    save_tools(tools)
    return tool


def delete_tool(tool_id: str) -> bool:
    tools = load_tools()
    new_tools = [tool for tool in tools if tool.id != tool_id]

    if len(new_tools) == len(tools):
        return False

    save_tools(new_tools)
    return True


def get_stable_version(tool: ToolDefinition):
    for version in tool.versions:
        if version.status == "stable":
            return version

    return None


def get_specific_version(tool: ToolDefinition, version_number: str):
    for version in tool.versions:
        if version.version == version_number:
            return version

    return None


def get_rollback_version(tool: ToolDefinition):
    for version in tool.versions:
        if version.status == "rollback":
            return version

    return None


def add_tool_version(tool_id: str, new_version: ToolVersion) -> ToolDefinition:
    tools = load_tools()

    for tool_index, tool in enumerate(tools):
        if tool.id == tool_id:
            for existing_version in tool.versions:
                if existing_version.version == new_version.version:
                    raise ValueError("La versión ya existe para esta herramienta")

            tool.versions.append(new_version)
            tools[tool_index] = tool
            save_tools(tools)
            return tool

    raise ValueError("Herramienta no encontrada")


def update_tool_version_status(
    tool_id: str,
    version_number: str,
    new_status: ToolStatus,
    notes: Optional[str] = None
) -> ToolDefinition:
    tools = load_tools()

    for tool_index, tool in enumerate(tools):
        if tool.id == tool_id:
            selected_version = None

            for version in tool.versions:
                if version.version == version_number:
                    selected_version = version
                    break

            if not selected_version:
                raise ValueError("Versión no encontrada")

            if new_status == "stable":
                for version in tool.versions:
                    if version.status == "stable":
                        version.status = "rollback"

                selected_version.status = "stable"
                selected_version.health_status = "ok"

            elif new_status == "failed":
                selected_version.status = "failed"
                selected_version.health_status = "failed"

            else:
                selected_version.status = new_status

            if notes:
                selected_version.notes = notes

            tools[tool_index] = tool
            save_tools(tools)
            return tool

    raise ValueError("Herramienta no encontrada")


def update_version_health(
    tool_id: str,
    version_number: str,
    health_status: str,
    notes: Optional[str] = None
) -> ToolDefinition:
    tools = load_tools()

    for tool_index, tool in enumerate(tools):
        if tool.id == tool_id:
            for version in tool.versions:
                if version.version == version_number:
                    version.health_status = health_status

                    if notes:
                        version.notes = notes

                    tools[tool_index] = tool
                    save_tools(tools)
                    return tool

            raise ValueError("Versión no encontrada")

    raise ValueError("Herramienta no encontrada")


def mark_version_as_failed(tool_id: str, version_number: str, notes: str = "") -> ToolDefinition:
    tools = load_tools()

    for tool_index, tool in enumerate(tools):
        if tool.id == tool_id:
            for version in tool.versions:
                if version.version == version_number:
                    version.status = "failed"
                    version.health_status = "failed"
                    version.notes = notes or "La versión falló durante la validación"

                    tools[tool_index] = tool
                    save_tools(tools)
                    return tool

            raise ValueError("Versión no encontrada")

    raise ValueError("Herramienta no encontrada")


def promote_version_to_stable(tool_id: str, version_number: str, notes: str = "") -> ToolDefinition:
    tools = load_tools()

    for tool_index, tool in enumerate(tools):
        if tool.id == tool_id:
            selected_version = None

            for version in tool.versions:
                if version.version == version_number:
                    selected_version = version
                    break

            if not selected_version:
                raise ValueError("Versión no encontrada")

            for version in tool.versions:
                if version.status == "stable":
                    version.status = "rollback"
                    version.notes = "Versión anterior estable, disponible para rollback"

            selected_version.status = "stable"
            selected_version.health_status = "ok"
            selected_version.notes = notes or "Versión promovida automáticamente a stable"

            tools[tool_index] = tool
            save_tools(tools)
            return tool

    raise ValueError("Herramienta no encontrada")