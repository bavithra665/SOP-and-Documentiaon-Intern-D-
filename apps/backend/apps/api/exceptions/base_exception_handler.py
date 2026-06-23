from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status
import uuid
import logging

logger = logging.getLogger(__name__)


def base_exception_handler(exc, context):
    """Consistent error response for DRF exceptions."""
    request = context.get("request")
    request_id = getattr(request, "request_id", None) if request else None
    if not request_id:
        request_id = str(uuid.uuid4())

    response = exception_handler(exc, context)
    if response is None:
        logger.exception("Unhandled exception", extra={"request_id": request_id})
        return Response(
            {
                "code": "internal_error",
                "message": "Internal server error",
                "details": None,
                "request_id": request_id,
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

    detail = None
    if isinstance(response.data, dict):
        detail = response.data.get("detail") or response.data

    return Response(
        {
            "code": "error",
            "message": "Request failed",
            "details": detail,
            "request_id": request_id,
        },
        status=response.status_code,
    )

