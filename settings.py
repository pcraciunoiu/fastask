# Django settings for fastask project.
import logging
import os

DEBUG = True
TEMPLATE_DEBUG = DEBUG
LOG_LEVEL = logging.DEBUG

ROOT = os.path.dirname(os.path.abspath(__file__))
path = lambda *a: os.path.join(ROOT, *a)

ROOT_PACKAGE = os.path.basename(ROOT)

ADMINS = ()

MANAGERS = ADMINS

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.',  # 'postgresql_psycopg2', 'postgresql'
                                          # 'mysql', 'sqlite3' or 'oracle'.
        'NAME': '',                       # Or path to db file if using sqlite3
        'USER': '',                       # Not used with sqlite3.
        'PASSWORD': '',                   # Not used with sqlite3.
        # Not used with sqlite3.
        'HOST': '',                       # Set to empty string for localhost.
        'PORT': '',                       # Set to empty string for default.
    }
}

DEFAULT_FROM_EMAIL = 'team@fastask.net'
SERVER_EMAIL = 'server-error@fastask.net'

#
# Session cookies
SESSION_COOKIE_SECURE = True
SESSION_EXPIRE_AT_BROWSER_CLOSE = True

# Cache Settings
CACHE_BACKEND = 'caching.backends.memcached://localhost:11211'
CACHE_PREFIX = 'fastask:'

# Local time zone for this installation. Choices can be found here:
# http://en.wikipedia.org/wiki/List_of_tz_zones_by_name
# although not all choices may be available on all operating systems.
# On Unix systems, a value of None will cause Django to use the same
# timezone as the operating system.
# If running in a Windows environment this must be set to the same as your
# system time zone.
TIME_ZONE = 'US/Pacific'

# Language code for this installation. All choices can be found here:
# http://www.i18nguy.com/unicode/language-identifiers.html
LANGUAGE_CODE = 'en-US'

SITE_ID = 1
SITE_TITLE = 'fastask'

# If you set this to False, Django will make some optimizations so as not
# to load the internationalization machinery.
USE_I18N = False

# If you set this to False, Django will not format dates, numbers and
# calendars according to the current locale
USE_L10N = True

# Absolute filesystem path to the directory that will hold user-uploaded files.
# Example: "/home/media/media.lawrence.com/media/"
MEDIA_ROOT = path('media')

# URL that handles the media served from MEDIA_ROOT. Make sure to use a
# trailing slash if there is a path component (optional in other cases).
# Examples: "http://media.lawrence.com/media/", "http://example.com/media/"
MEDIA_URL = '/static/media/'

ADMIN_MEDIA_PREFIX = '/static/admin/'


# Make this unique, and don't share it with anybody.
SECRET_KEY = 'og8&kmt9d_v=65nv(jr(qzp1m1osqfc#jx823tyo==(s)1@mmi'

# List of callables that know how to import templates from various sources.
TEMPLATE_LOADERS = (
    'django.template.loaders.filesystem.Loader',
    'django.template.loaders.app_directories.Loader',
#     'django.template.loaders.eggs.Loader',
)

TEMPLATE_CONTEXT_PROCESSORS = (
    'django.core.context_processors.auth',
    'django.core.context_processors.debug',
    'django.core.context_processors.media',
    'django.core.context_processors.request',
    'django.contrib.messages.context_processors.messages',

    'common.context_processors.global_settings',
    'jingo_minify.helpers.build_ids',
    'csrf_context.csrf',
)


MIDDLEWARE_CLASSES = (
    'django.middleware.transaction.TransactionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'commonware.middleware.NoVarySessionMiddleware',
    'commonware.middleware.FrameOptionsHeader',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'common.anonymous.AnonymousIdentityMiddleware',
)

ROOT_URLCONF = 'fastask.urls'

TEMPLATE_DIRS = (
    # Always use forward slashes, even on Windows.
    # Don't forget to use absolute paths, not relative paths.
    path('templates'),
)

INSTALLED_APPS = (
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.sites',
    'django.contrib.messages',
    'django.contrib.admin',
    'common',
    'jingo_minify',
    ROOT_PACKAGE,
    'users',
    'dashboards',
    'cronjobs',
)

# Extra apps for testing
if DEBUG:
    INSTALLED_APPS += (
        'django_extensions',
        'django_nose',
        'test_utils',
    )
    # Fixtures don't seem to be loading at the moment
    FIXTURE_DIRS = ('apps/users/fixtures',)

TEST_RUNNER = 'test_utils.runner.RadicalTestSuiteRunner'
TEST_UTILS_NO_TRUNCATE = ('django_content_type',)


def JINJA_CONFIG():
    import jinja2
    from django.conf import settings
    from caching.base import cache
    config = {'extensions': ['caching.ext.cache', 'jinja2.ext.with_',
              'jinja2.ext.i18n'],
              'finalize': lambda x: x if x is not None else ''}
    if 'memcached' in cache.scheme and not settings.DEBUG:
        # We're passing the _cache object directly to jinja because
        # Django can't store binary directly; it enforces unicode on it.
        # Details: http://jinja.pocoo.org/2/documentation/api#bytecode-cache
        # and in the errors you get when you try it the other way.
        bc = jinja2.MemcachedBytecodeCache(cache._cache,
                                           "%sj2:" % settings.CACHE_PREFIX)
        config['cache_size'] = -1  # Never clear the cache
        config['bytecode_cache'] = bc
    return config

# Bundles for JS/CSS Minification
MINIFY_BUNDLES = {
    'css': {
        'common': (
            'css/main.css',
        ),
        'dashboards': (
            'css/modal.css',
            'css/workbox.css',
            'css/list.css',
            'css/profile.css',
            'css/notification.css',
            'css/autocomplete.css',
        ),
        'login': (
            'css/login.css',
        ),
        'register': (
            #'css/errors.css',
            #'css/info.css',
            #'css/invite.css',
            'css/register.css',
        ),
    },
    'js': {
        'common': (
            'js/libs/jquery.min.js',
            'js/common.js',
        ),
        'dashboards': (
            'js/libs/jqModal.js',
            'js/libs/jquery.history.js',
            'js/libs/jquery.autocomplete.pack.js',
            'js/constants.js',
            'js/url.js',
            'js/notification.js',
            'js/row.js',
            'js/list.js',
            'js/workbox.js',
            'js/modal.js',
            'js/profile.js',
            'js/debug.js',
            'js/main.js',
        ),
        'register': (
            'js/register.js',
        ),
    },
}

JAVA_BIN = '/usr/bin/java'

#
# Connection information for Sphinx search
SPHINX_HOST = '127.0.0.1'
SPHINX_PORT = 3381
SPHINXQL_PORT = 3382

SPHINX_INDEXER = '/usr/bin/indexer'
SPHINX_SEARCHD = '/usr/bin/searchd'
SPHINX_CONFIG_PATH = path('configs/sphinx/sphinx.conf')

TEST_SPHINX_PATH = path('tmp/test/sphinx')
TEST_SPHINX_PORT = 3416
TEST_SPHINXQL_PORT = 3418

# Sphinx results tweaking
SEARCH_MAX_RESULTS = 1000

# Auth and permissions related constants
AUTHENTICATION_BACKENDS = (
    'users.backends.Sha256Backend',
)
LOGIN_URL = '/users/login'
LOGOUT_URL = '/users/logout'
LOGIN_REDIRECT_URL = '/'
LOGOUT_REDIRECT_URL = '/users/login'
REGISTER_URL = '/users/register'

# Anonymous user cookie
ANONYMOUS_COOKIE_NAME = 'fastask_anonid'
ANONYMOUS_COOKIE_MAX_AGE = 30 * 86400  # Seconds
