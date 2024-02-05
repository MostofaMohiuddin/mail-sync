from dependency_injector import containers, providers

from src.example_module.repositories import ExampleRepository
from src.example_module.services import ExampleService


class Container(containers.DeclarativeContainer):
    wiring_config = containers.WiringConfiguration(modules=[".routes"])

    example_repository = providers.Factory(ExampleRepository, session="db_session")

    example_service = providers.Factory(ExampleService, example_repository)
