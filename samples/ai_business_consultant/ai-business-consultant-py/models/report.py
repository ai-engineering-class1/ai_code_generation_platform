from sqlmodel import SQLModel, Field
from typing import Optional
from datetime import datetime
from sqlmodel import Text  # 新增Text类型用于长文本

class Report(SQLModel, table=True):  # 类名修正为Report
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: str = Field(max_length=36, index=True)
    session_id: str = Field(max_length=255, index=True)
    title: str = Field(max_length=255, index=True)
    subtitle: Optional[str] = Field(default=None, max_length=255)
    content: str = Field(sa_type=Text)  # 使用Text类型存储长内容
    
    # 时间戳字段
    createAt: datetime = Field(
        default_factory=datetime.utcnow,
        sa_column_kwargs={"server_default": "CURRENT_TIMESTAMP"}
    )
    updateAt: Optional[datetime] = Field(
        default=None,
        sa_column_kwargs={"onupdate": "CURRENT_TIMESTAMP"}
    )

    # 配置表名
    __tablename__ = "reports"