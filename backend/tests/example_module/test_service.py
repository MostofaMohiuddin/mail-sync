from unittest.mock import MagicMock

import pytest

from src.example_module.service import User
from src.logger import LOGGER


@pytest.fixture(scope="module")
def setUp():
    """
    scope is an optional parameter that can be used to control the lifespan of fixtures, which are objects
    that provide reusable test data or setup/teardown functionality.
    The scope parameter can take one of the following four values:

    1. function: default scope for fixtures. The fixture is created and destroyed for each test function that uses it.
    2. class: fixture is created and destroyed once per test class.
    3. module: fixture is created and destroyed once per test module (i.e., once per .py file).
    4. session: fixture is created and destroyed once for the entire test session.
    """
    # Perform any necessary setup steps here
    LOGGER.info("\nSetting up User tests...")
    mock_external_dependency = MagicMock()

    yield mock_external_dependency  # This line allows tests to run

    # Perform any necessary cleanup steps here
    LOGGER.info("\nTearing down User tests...")
    mock_external_dependency.reset_mock()


def test_create_user(setUp):
    name = "Alice"
    email = "alice@example.com"
    user = User.create_user(name, email)
    assert isinstance(user, User)
    assert user.name == name
    assert user.email == email


def test_create_user_with_external_dependency(setUp):
    name = "Bob"
    email = "bob@example.com"
    mock_external_dependency = setUp
    user = User.create_user(name, email, mock_external_dependency)
    assert isinstance(user, User)
    assert user.name == name
    assert user.email == email
    mock_external_dependency.save_user.assert_called_once_with(user)


def test_create_user_empty_name(setUp):
    with pytest.raises(ValueError, match="Name cannot be empty"):
        User.create_user("", "alice@example.com")


def test_create_user_empty_email(setUp):
    with pytest.raises(ValueError, match="Email cannot be empty"):
        User.create_user("Alice", "")


def test_create_user_empty_name_and_email(setUp):
    with pytest.raises(ValueError):
        User.create_user("", "")
