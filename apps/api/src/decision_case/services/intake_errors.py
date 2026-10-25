"""Shared errors for Decision Case intake services and transport."""


class IntakeIncompleteError(Exception):
    def __init__(self, missing_required: tuple[str, ...]):
        self.missing_required = missing_required
        super().__init__("intake incomplete")
