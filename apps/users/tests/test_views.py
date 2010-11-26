from django.conf import settings
from django.contrib.auth.models import User
from django.core.urlresolvers import reverse

from nose.tools import eq_

from common.tests import TestCase


class RegisterTestCase(TestCase):
    fixtures = ['users.json']

    def setUp(self):
        self.old_debug = settings.DEBUG
        settings.DEBUG = True
        self.client.logout()

    def tearDown(self):
        settings.DEBUG = self.old_debug

    def test_new_user(self):
        response = self.client.post(reverse('users.register'),
                                    {'username': 'newbie',
                                     'email': 'newbie@example.com',
                                     'password': 'foo',
                                     'password2': 'foo'}, follow=True)
        eq_(200, response.status_code)
        u = User.objects.get(username='newbie')
        assert u.password.startswith('sha256')

    def test_duplicate_username(self):
        response = self.client.post(reverse('users.register'),
                                    {'username': 'paul',
                                     'email': 'newbie@example.com',
                                     'password': 'foo',
                                     'password2': 'foo'}, follow=True)
        self.assertContains(response, 'already exists')

    def test_duplicate_email(self):
        User.objects.create(username='noob', email='noob@example.com').save()
        response = self.client.post(reverse('users.register'),
                                    {'username': 'newbie',
                                     'email': 'noob@example.com',
                                     'password': 'foo',
                                     'password2': 'foo'}, follow=True)
        self.assertContains(response, 'already exists')

    def test_no_match_passwords(self):
        response = self.client.post(reverse('users.register'),
                                    {'username': 'newbie',
                                     'email': 'newbie@example.com',
                                     'password': 'foo',
                                     'password2': 'bar'}, follow=True)
        self.assertContains(response, 'must match')
