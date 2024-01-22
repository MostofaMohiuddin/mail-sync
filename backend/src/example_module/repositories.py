class ExampleRepository:
    def __init__(self, session):
        self.session = session

    def get(self):
        return "write query to get something from the database"
