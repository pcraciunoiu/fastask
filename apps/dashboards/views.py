from django.http import HttpResponseBadRequest
from django.shortcuts import get_object_or_404
from django.views.decorators.http import require_POST

import jingo

from common.models import Task, Folder
from common.utils import json_r, smart_int
from users import views as user_views


def main(request):
    return jingo.render(request, 'dashboards/main.html')


@require_POST
def folders(request):
    results = _get_folders(request)
    return json_r({'results': results})


@require_POST
def all(request):
    counts = [[2, 0, 4, 12], [1, 11]]
    folders = _get_folders(request)
    pager = ['', '']
    tasks = _get_tasks(request)
    friends = user_views.get_friends(request)
    return json_r({'counts': counts, 'groups': folders, 'pager': pager,
                    'tasks': tasks, 'friends': friends})


@require_POST
def new_task(request):
    # TODO: use forms
    return json_r({'TODO': True})


def _validate_field_value(field_name, value):
    """Validates the field's value given its name."""
    if field_name == 'priority':
        value = smart_int(value, 3)
        return (value, value in range(1, 4))
    elif field_name == 'is_done':
        return (value == 'true', True)
    elif field_name == 'text':
        return (value, isinstance(value, basestring))
    return (value, False)


@require_POST
def change_task_field(request, task_id, field_name):
    """Change a task field to the POSTed value."""
    task = get_object_or_404(Task, pk=task_id)
    value, is_valid = _validate_field_value(field_name,
                                            request.POST.get(field_name))
    if not is_valid:
        return json_r({}, HttpResponseBadRequest)
    setattr(task, field_name, value)
    task.save()
    return json_r({field_name: getattr(task, field_name)})


def _get_tasks(request):
    tasks = Task.objects.all()
    results = {}
    for t in tasks:
        followers = [{'id': f.id, 'username': f.username} for
                     f in t.followers.all()]
        group = None
        if t.folder:
            group = {'id': t.folder.id, 'name': t.folder.name}
        results[t.pk] = {'created': str(t.created),
                         'due': str(t.due), 'due_out': str(t.due),
                         'followers': followers,
                         'group': group,
                         'group_id': t.folder.id if t.folder else 0,
                         'id': t.id,
                         'lastmodified': str(t.updated),
                         'num_followers': t.num_followers,
                         'planned': 0,
                         'priority': t.priority,
                         'is_done': 1 if t.is_done else 0,
                         'text': t.text,
                         'trash': 1 if t.is_deleted else 0,
                         'user_id': t.creator.id}
    return results


def _get_folders(request):
    folders = Folder.objects.all()
    results = []
    for f in folders:
        results.append({'name': f.name})
    return results
