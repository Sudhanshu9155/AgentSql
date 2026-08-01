from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, Dict, Any
from engine.AgentEngine import AgentEngine

router = APIRouter()

# Shared engine instance (agents are stateless, so this is safe)
engine = AgentEngine()


class ConnectionDetails(BaseModel):
    host: str = 'localhost'
    port: int = 3306
    user: str = ''
    password: str = ''
    database: str = ''


class QueryRequest(BaseModel):
    question: str
    connection: Optional[ConnectionDetails] = None


class SchemaRequest(BaseModel):
    connection: ConnectionDetails


@router.get('/health')
def health():
    """Health check — confirms the agent service is running."""
    return {'status': 'ok', 'service': 'AgentSQL Python Engine'}


@router.post('/query')
def run_query(req: QueryRequest):
    """
    Main endpoint: accepts a natural language question + MySQL connection,
    runs the full multi-agent pipeline, and returns SQL + results + insights.
    """
    if not req.question.strip():
        raise HTTPException(status_code=400, detail='Question cannot be empty')

    connection_dict = req.connection.model_dump() if req.connection else {}

    try:
        context = engine.run(
            question=req.question,
            connection=connection_dict,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f'Agent pipeline error: {str(e)}')

    meta = context.metadata

    return {
        'question': req.question,
        'intent': meta.get('intent', 'sql_generation'),
        'sql': meta.get('sql'),
        'sql_valid': meta.get('sql_valid', False),
        'sql_error': meta.get('sql_error'),
        'execution_error': meta.get('execution_error'),
        'columns': meta.get('columns', []),
        'rows': meta.get('rows', []),
        'row_count': meta.get('row_count', 0),
        'analysis': meta.get('analysis', ''),
        'chart_config': meta.get('chart_config'),
        'recommendations': meta.get('recommendations', []),
        'followups': meta.get('followups', []),
        'decision': meta.get('decision', 'rule_based'),
        'schema_source': meta.get('schema_source', 'none'),
    }


@router.post('/schema')
def get_schema(req: SchemaRequest):
    """
    Returns the discovered schema for a MySQL connection.
    Used by the frontend to show table/column explorer.
    """
    from tools.SchemaReader import SchemaReader
    reader = SchemaReader()
    try:
        schema = reader.read(req.connection.model_dump())
        return {'schema': schema, 'table_count': len(schema)}
    except ConnectionError as e:
        raise HTTPException(status_code=400, detail=str(e))


# Legacy endpoint — keep backward compatibility with /generate
@router.post('/generate')
def generate(req: QueryRequest):
    """Deprecated: Use /query instead."""
    return run_query(req)
