from fastapi import Depends, HTTPException


def get_dependency() -> str:
    return "dependency"


# q will be injected from the query parameter
def get_dependency_with_query_param(query_param: int) -> int:
    return query_param


def get_shared_dependency() -> str:
    return "shared dependency"


def get_global_dependency() -> str:
    # Change the condition to True and all the routes will throw exception
    if False:
        raise HTTPException(status_code=401, detail="This will throw an unauthorization error for all routes globally")

    return "Return value is not accessible for global dependencies even if any value is returned"


def get_inner_dependency(query_param: str) -> str:
    return query_param


def get_outer_dependency(inner_dependency: str = Depends(get_inner_dependency)) -> str:
    return inner_dependency


def get_dependency_in_path_operation_decorator() -> None:
    if "not authorized":
        raise HTTPException(status_code=401, detail="Unauthorized")


class DependencyClass:
    # query_parameter will be injected from query parameter
    def __init__(self, query_param: str):
        self.query_param = query_param

    def get_dependency(self) -> str:
        return self.query_param
