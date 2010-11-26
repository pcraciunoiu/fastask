from django.conf.urls.defaults import include, patterns
from django.contrib import admin

admin.autodiscover()

urlpatterns = patterns('',
    # Uncomment the admin/doc line below to enable admin documentation:
    # (r'^admin/doc/', include('django.contrib.admindocs.urls')),

    # Uncomment the next line to enable the admin:
    (r'^admin/', include(admin.site.urls)),
    # This is better last
    (r'^', include('dashboards.urls')),
    # Users
    ('', include('users.urls')),
)
