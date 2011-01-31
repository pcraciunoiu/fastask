from django.contrib.auth.models import User

from nose import SkipTest
from nose.tools import eq_

from common.models import Task, Folder, Friendship, TaskFollowing
from common.tests import TestCase


def task(**kwargs):
    """Return a saved task.

    Requires a users fixture if no creator is provided.

    """
    if 'creator' not in kwargs:
        u = User.objects.all()[0]
    else:
        u = kwargs['creator']

    defaults = {'text': 'Some text', 'creator': u, 'num_followers': 1}
    defaults.update(kwargs)

    t = Task(**defaults)
    t.save()
    following = TaskFollowing(task=t, user=u)
    following.save()
    return t


class TaskTestCase(TestCase):
    fixtures = ['users.json']

    def test_is_created(self):
        t = task()
        eq_(1, Task.objects.count())
        eq_(1, t.followers.count())

    def test_num_followers_calculated(self):
        """num_followers is calculcated correctly."""
        raise SkipTest

    def test_num_followers_valid(self):
        """num_followers must be at least 1 after the task is created."""
        raise SkipTest

    def test_task_following_unique(self):
        """Can only follow a task once."""
        raise SkipTest

    def test_friendship(self):
        """friendshis works correctly."""
        raise SkipTest
