import asyncio

from motor.motor_asyncio import AsyncIOMotorClient
from src.common.database.connection import get_db_session

from dependency_injector.wiring import Provide, inject
from fastapi import APIRouter, Depends, Path, Query, status

from src.authentication import Authentication
from src.authentication.enums import AuthenticationMechanism
from src.example_module.containers import Container
from src.example_module.dependencies import (
    DependencyClass,
    get_dependency,
    get_dependency_in_path_operation_decorator,
    get_dependency_with_query_param,
    get_outer_dependency,
    get_shared_dependency,
)
from src.example_module.schemas import RequestBody
from src.example_module.services import ExampleService
from src.logger import LOGGER

router = APIRouter(
    prefix="/api",
    tags=[""],
    dependencies=[
        # This dependency will be applied to all routes in this router.
        # The parameter of Authentication is the authentication mechanism you need to use.
        # You can use multiple authentication mechanisms in the same project if needed.
        # Here AUTH1 is used as an example. For individual Authentication mechanisms, see src/authentication/ingress
        # The Parameter of Authentication Class is declared as an Enum.
        Depends(Authentication(AuthenticationMechanism.AUTH1))
    ],
)


# This route will handle any get request that comes to /api/path
# This route has a dependency injection. The dependency is authentication ingress.
# The response of the API contains product_id which is the return value of the dependency as an example.
@router.get("/path", status_code=status.HTTP_200_OK)
async def path(
    db: AsyncIOMotorClient = Depends(get_db_session),
) -> dict:
    collection = db["temperatureSensor"]
    result = await collection.insert_one({"key": "value"})
    return {"message": "Document inserted", "inserted_id": "123"}


# This route will handle any get request that comes to /api/path/{path_param}
@router.get("/path/{path_param}", status_code=status.HTTP_200_OK)
def path_with_param(path_param: str) -> str:
    return path_param


# This route will handle any get request that comes to /api/path/somepath/{path_param}?query_param={value}
@router.get("/path/somepath/{path_param}", status_code=status.HTTP_200_OK)
def path_with_param_and_query_param(path_param: str, query_param: int) -> dict:
    return {"path_param": path_param, "query_param": query_param}


# This route will handle any post request that comes to /api/path/request
# The request body is a pydandic model which will be validated by Pydandic
@router.post("/path/request", status_code=status.HTTP_201_CREATED, response_model=RequestBody)
def post_request_with_body(request_body: RequestBody) -> RequestBody:
    return request_body


# Using Path for additional validation and metadata to path parameter
# This path parameter will have the title metadata and gt=1 will check for greater than validation
@router.get("/path/path_param_additional_validation/{path_param}")
def path_param_with_additional_validation(path_param: int = Path(title="This is a path parameter", gt=1)) -> int:
    return path_param


# Using Query for additional validation and metadata to query parameter
# This query parameter will have the title metadata and max_length validation will checked
@router.get("/path/query_param/query_param_additional_validation")
def query_param_with_additional_validation(
    query_param: str = Query(title="This is a query parameter", max_length=50)
) -> str:
    return query_param


# Route with Dependency injection
@router.get("/path/dependency/dependency_injection")
def dependency_injection(dependency: str = Depends(get_dependency)) -> str:
    return dependency


# Dependency injection with query parameter
# Parameters of the dependency will be considered as query parameters
# This route will handle any request that comes to /api/path/dependency_injection_with_query_param?q=int
@router.get("/path/dependency/dependency_injection_with_query_param")
def dependency_injection_with_query_param(dependency: int = Depends(get_dependency_with_query_param)) -> int:
    return dependency


# Shared dependency
Shared_dependency: str = Depends(get_shared_dependency)


# Use of Shared dependency 1
@router.get("/path/dependency/shared_dependency_1")
def shared_dependency_1(shared_dependency=Shared_dependency):
    return shared_dependency


# Use of Shared dependency 2
@router.get("/path/dependency/shared_dependency_2")
def shared_dependency_2(shared_dependency=Shared_dependency):
    return shared_dependency


# Sub-dependencies/Nested Dependencies
@router.get("/path/dependency/sub_dependency")
def nested_dependency(dependency: str = Depends(get_outer_dependency)):
    return dependency


# Dependency in path operation decorators
# This is useful when dependency needs to be executed but no return value is required
@router.get(
    "/path/dependency/dependency_in_path_operation_decorator",
    dependencies=[Depends(get_dependency_in_path_operation_decorator)],
)
def dependency_in_path_operation_decorator():
    return "This will only execute the dependency but the dependency will not return any value"


# Class as dependency
@router.get("/path/dependency/class_dependency")
def class_dependency(dependency_obj: DependencyClass = Depends(DependencyClass)) -> str:
    return dependency_obj.get_dependency()


# Service level dependency using Dependency Injector library
@router.get("/path/dependency/service_dependency")
@inject
def service_dependency(example_service: ExampleService = Depends(Provide[Container.example_service])):
    return example_service.get_service()


# async endpoint with sleep example
@router.get("/async/sleep", status_code=status.HTTP_200_OK)
@inject
async def async_endpoint_sleep(
    user: dict = Depends(Authentication(AuthenticationMechanism.AUTH1)),
    example_service: ExampleService = Depends(Provide[Container.example_service]),
) -> dict:
    LOGGER.info("Starting asynchronous requests...")
    tasks = [example_service.example_async_service(id) for id in range(1, 5)]  # create the tasks
    results = await asyncio.gather(*tasks)  # wait for them to finish
    for id, data in zip(range(1, 5), results):
        LOGGER.info(f"Fetched data #{id}: data is: {data}")
    return {"user": user}


# async endpoint with api call
@router.get("/async/data", status_code=status.HTTP_200_OK)
@inject
async def async_endpoint_data(
    user: dict = Depends(Authentication(AuthenticationMechanism.AUTH1)),
    example_service: ExampleService = Depends(Provide[Container.example_service]),
) -> dict:
    LOGGER.info("Starting asynchronous requests...")
    task = asyncio.create_task(example_service.fetch_data(1))
    LOGGER.info("Task created")
    await asyncio.sleep(5)
    result = await task
    LOGGER.info("Route ended")
    return {"user": user, "api_result": result}
