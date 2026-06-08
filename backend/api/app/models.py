from typing import Any, Dict, List, Literal, Optional
from pydantic import BaseModel, Field


ToolStatus = Literal["stable", "candidate", "deprecated", "rollback", "failed"]


class ToolVersion(BaseModel):
    version: str
    image: str
    status: ToolStatus = "candidate"
    health_status: Literal["unknown", "ok", "failed"] = "unknown"
    healthcheck_args: List[str] = Field(default_factory=lambda: ["--version"])
    notes: Optional[str] = None


class ToolDefinition(BaseModel):
    id: str
    name: str
    category: str

    docker_image: Optional[str] = None
    container_name: Optional[str] = None

    description_for_humans: Optional[str] = None
    description_for_llm: str

    tool_inside_container: Dict[str, Any] = Field(default_factory=dict)

    capabilities: List[str] = Field(default_factory=list)
    recommended_tasks: List[str] = Field(default_factory=list)
    not_recommended_for: List[str] = Field(default_factory=list)

    allowed_params: List[str] = Field(default_factory=list)
    blocked_params: List[str] = Field(default_factory=list)

    input_schema: Dict[str, Any] = Field(default_factory=dict)
    output_schema: Dict[str, Any] = Field(default_factory=dict)
    execution_instructions: Dict[str, Any] = Field(default_factory=dict)
    execution_policy: Dict[str, Any] = Field(default_factory=dict)

    versions: List[ToolVersion] = Field(default_factory=list)


class JobRequest(BaseModel):
    tool_id: str
    target: str
    params: List[str] = Field(default_factory=list)
    version: Optional[str] = None
    allow_rollback: bool = True


class JobResponse(BaseModel):
    job_id: str
    tool_id: str
    image_used: str
    version_used: str
    exit_code: int
    status: str
    stdout: str
    stderr: str
    output_dir: str
    rollback_used: bool = False


class ToolUpdateRequest(BaseModel):
    new_version: str
    dockerfile_path: str
    image_name: str
    healthcheck_args: List[str] = Field(default_factory=lambda: ["--version"])
    notes: Optional[str] = None
class VersionStatusRequest(BaseModel):
    status: ToolStatus
    notes: Optional[str] = None