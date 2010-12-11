import json

from django.http import HttpResponse
from django.views.decorators.http import require_GET, require_POST

import jingo

from common.models import Task, Folder


def main(request):
    return jingo.render(request, 'dashboards/main.html')


@require_POST
def folders(request):
    results = _get_folders(request)
    data = json.dumps({'results': results})
    return HttpResponse(data, mimetype='application/json')


@require_POST
def all(request):
    counts = [[2, 0, 4, 12], [1, 11]]
    folders = _get_folders(request)
    pager = ['', '']
    tasks = _get_tasks(request)
    data = json.dumps({'counts': counts, 'groups': folders, 'pager': pager,
                       'tasks': tasks})
    return HttpResponse(data, mimetype='application/json')


def _get_tasks(request):
    tasks = Task.objects.all()
    results = []
    for t in tasks:
        followers = [{'id': f.id, 'username': f.username} for
                     f in t.followers.all()]
        group = None
        if t.folder:
            group = {'id': t.folder.id, 'name': t.folder.name}
        results.append({'created': str(t.created),
                        'due': str(t.due), 'due_out': str(t.due),
                        'followers': followers,
                        'group': group,
                        'group_id': t.folder.id if t.folder else 0,
                        'id': t.id,
                        'lastmodified': str(t.updated),
                        'num_followers': t.num_followers,
                        'planned': 0,
                        'priority': t.priority,
                        'status': 1 if t.done else 0,
                        'text': t.text,
                        'trash': 1 if t.is_deleted else 0,
                        'user_id': t.creator.id,
        })
    return results


def _get_folders(request):
    folders = Folder.objects.all()
    results = []
    for f in folders:
        results.append({'name': f.name})
    return results
