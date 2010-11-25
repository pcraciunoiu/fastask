from django.conf.urls.defaults import patterns, url


urlpatterns = patterns('dashboards.views',
    url(r'^$', 'main', name='main'),
)

