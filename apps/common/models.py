from datetime import datetime

from django.contrib import admin
from django.contrib.auth.models import User
from django.core.exceptions import ValidationError
from django.db import models

import caching.base

from common import (TASK_MAX_TEXT_LENGTH, TASK_MAX_PRIORITY, TASK_MIN_PRIORITY,
                    FOLDER_MAX_NAME_LENGTH)

# Our apps should subclass ManagerBase instead of models.Manager or
# caching.base.CachingManager directly.
ManagerBase = caching.base.CachingManager


class ModelBase(caching.base.CachingMixin, models.Model):
    """
    Base class for SUMO models to abstract some common features.

    * Caching.
    """

    objects = ManagerBase()
    uncached = models.Manager()

    class Meta:
        abstract = True


class Folder(ModelBase):
    """Tasks can be filed in folders. Zero or one folders per task."""
    creator = models.ForeignKey(User, related_name='folders_created')
    name = models.CharField(max_length=FOLDER_MAX_NAME_LENGTH, db_index=True)
    num_tasks = models.IntegerField(default=0, db_index=True)
    created = models.DateTimeField(default=datetime.now)

    class Meta:
        ordering = ['name']
        unique_together = ('name', 'creator')

    def __unicode__(self):
        return '[%s] %s (%s)' % (self.pk, self.name, self.creator.username)

    def clean(self):
        if self.num_tasks < 0:
            raise ValidationError(
                '[%s] num_tasks must be positive (%s received)' %
                (self, self.num_tasks))

    def save(self, *args, **kwargs):
        self.clean()
        super(Folder, self).save(*args, **kwargs)


class Task(ModelBase):
    """The central model of fastask - tasks."""
    text = models.CharField(max_length=TASK_MAX_TEXT_LENGTH)
    creator = models.ForeignKey(User, related_name='tasks_created')
    folder = models.ForeignKey(Folder, related_name='tasks',
                               null=True, blank=True)
    num_followers = models.IntegerField(default=0)
    due = models.DateTimeField(default=datetime.now, db_index=True)
    priority = models.IntegerField(default=TASK_MAX_PRIORITY)
    is_done = models.BooleanField(default=False, db_index=True)
    is_deleted = models.BooleanField(default=False, db_index=True)
    created = models.DateTimeField(default=datetime.now, db_index=True)
    updated = models.DateTimeField(auto_now=True, db_index=True)
    updated_by = models.ForeignKey(User, related_name='tasks_updated_by',
                                   null=True)
    followers = models.ManyToManyField(
        User, related_name='tasks_following', through='TaskFollowing')

    class Meta:
        ordering = ('-priority', 'due')

    def __unicode__(self):
        return '[%s] (by %s) %s' % (self.pk, self.creator.username,
                                    self.text[:50])

    def clean(self):
        if self.priority not in range(TASK_MIN_PRIORITY,
                                      TASK_MAX_PRIORITY + 1):
            raise ValidationError(
                '[%s] priority must be in [%s, %s] (%s received)' %
                (self, TASK_MIN_PRIORITY, TASK_MAX_PRIORITY, self.priority))
        if self.num_followers < 0:
            raise ValidationError(
                '[%s] num_followers must be strictly positive (%s received)' %
                (self, self.num_followers))

    def save(self, *args, **kwargs):
        self.clean()
        if self.pk:
            self.num_followers = self.followers.count()
        else:  # new tasks can't have followers already
            self.num_followers = 0
        super(Task, self).save(*args, **kwargs)


class TaskFollowing(ModelBase):
    """Mapping table for users <-> tasks."""
    user = models.ForeignKey(User)
    task = models.ForeignKey(Task)
    created = models.DateTimeField(default=datetime.now)

    class Meta:
        unique_together = ('user', 'task')

    def __unicode__(self):
        return '%s follows %s' % (self.user.username, self.task)


class FriendshipManager(models.Manager):
    """From https://github.com/jtauber/django-friends"""

    def friends_for_user(self, user):
        friends = []
        for friendship in self.filter(from_user=user).select_related(depth=1):
            friends.append({'friend': friendship.to_user,
                            'friendship': friendship})
        for friendship in self.filter(to_user=user).select_related(depth=1):
            friends.append({'friend': friendship.from_user,
                            'friendship': friendship})
        return friends

    def are_friends(self, user1, user2):
        if self.filter(from_user=user1, to_user=user2).count() > 0:
            return True
        if self.filter(from_user=user2, to_user=user1).count() > 0:
            return True
        return False

    def remove(self, user1, user2):
        if self.filter(from_user=user1, to_user=user2):
            friendship = self.filter(from_user=user1, to_user=user2)
        elif self.filter(from_user=user2, to_user=user1):
            friendship = self.filter(from_user=user2, to_user=user1)
        friendship.delete()


class Friendship(ModelBase):
    """A friendship is a bi-directional association to which both users have
    agreed."""
    to_user = models.ForeignKey(User, related_name='friends')
    from_user = models.ForeignKey(User, related_name='_unused_')
    created = models.DateTimeField(default=datetime.now)

    objects = FriendshipManager()

    class Meta:
        unique_together = ('to_user', 'from_user')

    def __unicode__(self):
        return '%s <-> %s' % (self.to_user.username, self.from_user.username)


admin.site.register(Task)
admin.site.register(Folder)
admin.site.register(TaskFollowing)
admin.site.register(Friendship)
