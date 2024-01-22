VERSION = "0.0.1"
# TODO: If you wanna get this version from pyproject.toml (https://python-poetry.org/docs/cli/#version)
# Add packages = [{"include" = "**/*"}] under tool.poetry
# Add RUN touch __init__.py in Dockerfile before poetry install so that this package is installed
# use importlib.metadata.version("dex-fastapi-boilerplate")

USER_AGENT = f"dex-fastapi-boilerplate/{VERSION}"
