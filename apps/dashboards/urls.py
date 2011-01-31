from django.conf.urls.defaults import patterns, url, include

from dashboards import views


task_patterns = patterns('',
    url(r'^/s$', views.change_task_field, {'field_name': 'is_done'},
        name='task.done'),
    url(r'^/p$', views.change_task_field,  {'field_name': 'priority'},
        name='task.priority'),
    url(r'^/t$', views.change_task_field,  {'field_name': 'text'},
        name='task.text'),
)

urlpatterns = patterns('dashboards.views',
    url(r'^$', views.main, name='main'),
    url(r'^folders/list$', views.folders, name='folders.list'),
    url(r'^all$', views.all, name='all.json'),

    url(r'^task/(?P<task_id>\d+)', include(task_patterns)),
    url(r'^task/new$', views.new_task, name='task.new'),
)
