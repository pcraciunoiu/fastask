import datetime

from nose.tools import eq_

from common.tests import TestCase
from common.utils import strtodatetime


today = datetime.date.today()
one_day = datetime.timedelta(days=1)


class StrToDateTimeTestCase(TestCase):
    def test_today(self):
        result = strtodatetime('today')
        eq_(today.strftime('%Y%m%d'), result.strftime('%Y%m%d'))

    def test_tomorrow(self):
        tomorrow = today + one_day
        result = strtodatetime('tomorrow')
        eq_(tomorrow.strftime('%Y%m%d'), result.strftime('%Y%m%d'))
