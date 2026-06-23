import os

ENVIRONMENT = os.getenv("DJANGO_ENV", "dev")

if ENVIRONMENT == "production":
    from .prod import *  # noqa
elif ENVIRONMENT == "dev":
    from .dev import *  # noqa
else:
    from .base import *  # noqa
