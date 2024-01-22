from pytest import fixture


@fixture
def non_mocked_hosts() -> list[str]:
    # TestClient is httpx under the hood, which by default gets mocked by httpx_mock.
    # Prevent mocking TestClient directly by adding the host to this list.
    return ["testserver"]
