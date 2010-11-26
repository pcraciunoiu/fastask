from django.conf import settings
from django.contrib.auth.models import User
from django.core.urlresolvers import reverse
from django.test.client import Client

from test_utils import TestCase  # So others can import it from here


get = lambda c, v, **kw: c.get(reverse(v, **kw), follow=True)
post = lambda c, v, data={}, **kw: c.post(reverse(v, **kw), data, follow=True)
