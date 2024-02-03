class DataIntegrityException(Exception):
    def __init__(self, db_exception: BaseException | None):
        self.db_exception = db_exception
