from logging.config import fileConfig
import asyncio  # 新增异步支持
from sqlalchemy import pool
from sqlalchemy.ext.asyncio import AsyncEngine, async_engine_from_config  # 新增异步引擎
from alembic import context
from sqlmodel import SQLModel  # 确保SQLModel导入

# 原有配置保持不变
config = context.config

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# 模型导入保持不变（如果其他部分需要）
from models.report import Report

# 元数据配置保持不变
target_metadata = SQLModel.metadata

def run_migrations_offline() -> None:
    """离线模式迁移（保持原样）"""
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()

async def run_migrations_online() -> None:
    """在线模式迁移（异步改造）"""
    connectable = context.config.attributes.get("connection", None)
    
    if connectable is None:
        # 使用异步引擎配置
        connectable = async_engine_from_config(
            config.get_section(config.config_ini_section, {}),
            prefix="sqlalchemy.",
            poolclass=pool.NullPool,
        )

    if isinstance(connectable, AsyncEngine):
        async with connectable.connect() as connection:
            await connection.run_sync(do_run_migrations)
    else:
        # 同步引擎回退
        with connectable.connect() as connection:
            context.configure(connection=connection, target_metadata=target_metadata)
            with context.begin_transaction():
                context.run_migrations()

def do_run_migrations(connection):
    """实际执行迁移"""
    context.configure(connection=connection, target_metadata=target_metadata)
    with context.begin_transaction():
        context.run_migrations()

if context.is_offline_mode():
    run_migrations_offline()
else:
    asyncio.run(run_migrations_online())  # 异步入口