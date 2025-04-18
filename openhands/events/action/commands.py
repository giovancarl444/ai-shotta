from dataclasses import dataclass
from typing import ClassVar

from openhands.core.schema import ActionType
from openhands.events.action.action import (
    Action,
    ActionConfirmationStatus,
    ActionSecurityRisk,
)


@dataclass
class CmdRunAction(Action):
    command: str
    is_input: bool = False
    thought: str = ''
    blocking: bool = False
    cwd: str | None = None
    hidden: bool = False
    action: str = ActionType.RUN
    confirmation_state: ActionConfirmationStatus = ActionConfirmationStatus.CONFIRMED
    security_risk: ActionSecurityRisk | None = None

    def __init__(self, command: str, is_input: bool = False, thought: str = '',
                 blocking: bool = False, cwd: str | None = None, hidden: bool = False,
                 confirmation_state: ActionConfirmationStatus = ActionConfirmationStatus.CONFIRMED,
                 security_risk: ActionSecurityRisk | None = None, **kwargs):
        self.command = command
        self.is_input = is_input
        self.thought = thought
        self.blocking = blocking
        self.cwd = cwd
        self.hidden = hidden
        self.action = ActionType.RUN
        self.confirmation_state = confirmation_state
        self.security_risk = security_risk

        # ✅ Handle optional Action fields passed via kwargs
        for key in ['source', 'created_at', 'agent']:
            if key in kwargs:
                setattr(self, key, kwargs[key])

        # 🔥 Drop unknown fields like is_static
        super().__init__()

    @property
    def message(self) -> str:
        return f'Running command: {self.command}'

    def __str__(self) -> str:
        ret = f'**CmdRunAction (source={getattr(self, "source", None)}, is_input={self.is_input})**\n'
        if self.thought:
            ret += f'THOUGHT: {self.thought}\n'
        ret += f'COMMAND:\n{self.command}'
        return ret


@dataclass
class IPythonRunCellAction(Action):
    code: str
    thought: str = ''
    include_extra: bool = True
    action: str = ActionType.RUN_IPYTHON
    confirmation_state: ActionConfirmationStatus = ActionConfirmationStatus.CONFIRMED
    security_risk: ActionSecurityRisk | None = None
    kernel_init_code: str = ''

    def __str__(self) -> str:
        ret = '**IPythonRunCellAction**\n'
        if self.thought:
            ret += f'THOUGHT: {self.thought}\n'
        ret += f'CODE:\n{self.code}'
        return ret

    @property
    def message(self) -> str:
        return f'Running Python code interactively: {self.code}'
