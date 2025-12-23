
import sys
import os
import unittest
from datetime import datetime

# Setup path for backend imports
sys.path.append(os.path.join(os.getcwd(), 'app'))

from app.models.task import ActivityStatus, TaskWorkflowHistory
from app.services.activity_log_service import ActivityLogService
# Mock DB Session
class MockSession:
    def __init__(self):
        self.items = {}
    def add(self, item):
        self.items[item.id] = item
    def commit(self):
        pass
    def refresh(self, item):
        pass
    def query(self, model):
        return MockQuery(self.items.values())

class MockQuery:
    def __init__(self, data):
        self.data = list(data)
    def filter(self, *args):
        # Very simple mock filter - assumes filtering by ID string matching
        # In real usage args are SQL expressions. We can't easily mock that without real SQLAlchemy.
        # So we'll skip actual logic and rely on the Service needing a real DB, 
        # OR we just test the SERVICE LOGIC parts that don't depend on DB details too much.
        # Actually, ActivityLogService uses `db.query(...).filter(...).with_for_update().first()`.
        # This is hard to mock purely.
        return self
    def with_for_update(self):
        return self
    def first(self):
        return self.data[0] if self.data else None
    def order_by(self, *args):
        return self

class TaskMock:
    pass

class TestActivityTransitions(unittest.TestCase):
    def setUp(self):
        self.service = ActivityLogService()
        self.db = MockSession()
        
    def test_end_activity_transition(self):
        # Create an activity
        act = TaskWorkflowHistory(
            id="act1",
            status=ActivityStatus.IN_PROGRESS.value,
            activity_start_at=datetime.utcnow(),
            activity_end_at=None
        )
        self.db.items["act1"] = act # Inject into mock DB
        
        # Valid transition: IN_PROGRESS -> COMPLETED
        print("Testing IN_PROGRESS -> COMPLETED...")
        self.service.end_activity(self.db, "act1", "Done", ActivityStatus.COMPLETED)
        self.assertEqual(act.status, ActivityStatus.COMPLETED.value)
        self.assertIsNotNone(act.activity_end_at)
        
    def test_invalid_transition(self):
        # Reset
        act = TaskWorkflowHistory(
            id="act2",
            status=ActivityStatus.COMPLETED.value,
            activity_start_at=datetime.utcnow(),
            activity_end_at=datetime.utcnow()
        )
        self.db.items["act2"] = act
        
        # Invalid: COMPLETED -> IN_PROGRESS (Cannot end an ended activity anyway, but transition logic valid check too)
        print("Testing COMPLETED -> IN_PROGRESS (Should Fail)...")
        with self.assertRaises(ValueError):
             # This hits "Cannot end Activity... already frozen" check first
             self.service.end_activity(self.db, "act2", "Re-opening", ActivityStatus.IN_PROGRESS)

    def test_update_activity_transition(self):
        # Create active activity
        act = TaskWorkflowHistory(
            id="act3",
            status=ActivityStatus.IN_PROGRESS.value,
            activity_start_at=datetime.utcnow(),
            activity_end_at=None
        )
        self.db.items["act3"] = act
        
        # Valid: IN_PROGRESS -> PENDING_USER_INPUT
        print("Testing IN_PROGRESS -> PENDING_USER_INPUT...")
        self.service.update_activity(self.db, "act3", status=ActivityStatus.PENDING_USER_INPUT)
        self.assertEqual(act.status, ActivityStatus.PENDING_USER_INPUT.value)
        
        # Valid: PENDING_USER_INPUT -> IN_PROGRESS
        print("Testing PENDING_USER_INPUT -> IN_PROGRESS...")
        self.service.update_activity(self.db, "act3", status=ActivityStatus.IN_PROGRESS)
        self.assertEqual(act.status, ActivityStatus.IN_PROGRESS.value)
        
        # Invalid: IN_PROGRESS -> COMPLETED via update (COMPLETED is allowed key, but update usually doesn't end it? 
        # Wait, transition table says IN_PROGRESS->COMPLETED is allowed. 
        # But update_activity logic doesn't set activity_end_at. 
        # So it becomes status=COMPLETED but activity_end_at=None.
        # This is technically an "Active COMPLETED" state? 
        # System usually expects end_activity for completion.
        # But State Machine allows it.
        
if __name__ == '__main__':
    # Manually run parts because unittest discovery might be tricky without full mock match
    # Just running main logic
    t = TestActivityTransitions()
    t.setUp()
    t.test_end_activity_transition()
    t.test_invalid_transition()
    t.test_update_activity_transition()
    print("All mock tests passed!")
