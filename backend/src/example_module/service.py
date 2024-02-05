class User:
    def __init__(self, name, email):
        self.name = name
        self.email = email

    @classmethod
    def create_user(cls, name, email, external_dependency=None):
        if not name:
            raise ValueError("Name cannot be empty")
        if not email:
            raise ValueError("Email cannot be empty")
        user = cls(name, email)

        # Save the user to database or perform any other required actions
        if external_dependency:
            external_dependency.save_user(user)

        return user
