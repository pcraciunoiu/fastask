from django.conf.urls.defaults import patterns, url


urlpatterns = patterns('dashboards.views',
    url(r'^$', 'main', name='main'),
    url(r'^folders/list$', 'folders', name='folders.json'),
    url(r'^all$', 'all', name='all.json'),
)
