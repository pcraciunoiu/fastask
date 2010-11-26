import datetime
import json as jsonlib
import re
import urlparse

from django.core.urlresolvers import reverse
from django.http import QueryDict
from django.utils.encoding import smart_unicode, smart_str
from django.utils.http import urlencode
from django.utils.tzinfo import LocalTimezone

from jingo import register, env
import jinja2


@register.filter
def paginator(pager):
    """Render list of pages."""
    return Paginator(pager).render()


@register.function
def url(viewname, *args, **kwargs):
    """Helper for Django's ``reverse`` in templates."""
    return reverse(viewname, args=args, kwargs=kwargs)


@register.filter
def urlparams(url_, hash=None, **query):
    """
    Add a fragment and/or query paramaters to a URL.

    New query params will be appended to exising parameters, except duplicate
    names, which will be replaced.
    """
    url_ = urlparse.urlparse(url_)
    fragment = hash if hash is not None else url_.fragment

    q = url_.query
    query_dict = (QueryDict(smart_str(q), mutable=True) if
                  q else QueryDict('', mutable=True))
    for k, v in query.items():
        query_dict[k] = v  # Replace, don't append.

    query_string = urlencode([(k, v) for k, l in query_dict.lists() for
                              v in l if v is not None])
    new = urlparse.ParseResult(url_.scheme, url_.netloc, url_.path,
                               url_.params, query_string, fragment)
    return new.geturl()


class Paginator(object):

    def __init__(self, pager):
        self.pager = pager

        self.max = 10
        self.span = (self.max - 1) / 2

        self.page = pager.number
        self.num_pages = pager.paginator.num_pages
        self.count = pager.paginator.count

        pager.page_range = self.range()
        pager.dotted_upper = self.num_pages not in pager.page_range
        pager.dotted_lower = 1 not in pager.page_range

    def range(self):
        """Return a list of page numbers to show in the paginator."""
        page, total, span = self.page, self.num_pages, self.span
        if total < self.max:
            lower, upper = 0, total
        elif page < span + 1:
            lower, upper = 0, span * 2
        elif page > total - span:
            lower, upper = total - span * 2, total
        else:
            lower, upper = page - span, page + span - 1
        return range(max(lower + 1, 1), min(total, upper) + 1)

    def render(self):
        c = {'pager': self.pager, 'num_pages': self.num_pages,
             'count': self.count}
        t = env.get_template('layout/paginator.html').render(**c)
        return jinja2.Markup(t)


@register.filter
def fe(str_, *args, **kwargs):
    """Format a safe string with potentially unsafe arguments, then return a
    safe string."""

    str_ = unicode(str_)

    args = [jinja2.escape(smart_unicode(v)) for v in args]

    for k in kwargs:
        kwargs[k] = jinja2.escape(smart_unicode(kwargs[k]))

    return jinja2.Markup(str_.format(*args, **kwargs))


@register.function
def profile_url(user):
    """Return a URL to the user's profile."""
    # TODO
    return '/user/%s/profile' % user.id


@register.function
def profile_avatar(user):
    """Return a URL to the user's avatar."""
    # TODO: revisit this when we have a users app
    return '/user/%s/avatar' % user.username


_whitespace_then_break = re.compile(r'[\r\n\t ]+[\r\n]+')


@register.filter
def collapse_linebreaks(text):
    """Replace consecutive CRs and/or LFs with single CRLFs.

    CRs or LFs with nothing but whitespace between them are still considered
    consecutive.

    As a nice side effect, also strips trailing whitespace from lines that are
    followed by line breaks.

    """
    # I previously tried an heuristic where we'd cut the number of linebreaks
    # in half until there remained at least one lone linebreak in the text.
    # However, about:support in some versions of Firefox does yield some hard-
    # wrapped paragraphs using single linebreaks.
    return _whitespace_then_break.sub('\r\n', text)


@register.filter
def json(s):
    return jsonlib.dumps(s)


@register.filter
def timesince(d, now=None):
    """Take two datetime objects and return the time between d and now as a
    nicely formatted string, e.g. "10 minutes".  If d is None or occurs after
    now, return ''.

    Units used are years, months, weeks, days, hours, and minutes. Seconds and
    microseconds are ignored.  Just one unit is displayed.  For example,
    "2 weeks" and "1 year" are possible outputs, but "2 weeks, 3 days" and "1
    year, 5 months" are not.

    Adapted from django.utils.timesince to have better i18n (not assuming
    commas as list separators and including "ago" so order of words isn't
    assumed), show only one time unit, and include seconds.

    """
    if d is None:
        return u''
    chunks = [
        (60 * 60 * 24 * 365, lambda n: ungettext('%(number)d year ago',
                                                 '%(number)d years ago', n)),
        (60 * 60 * 24 * 30, lambda n: ungettext('%(number)d month ago',
                                                '%(number)d months ago', n)),
        (60 * 60 * 24 * 7, lambda n: ungettext('%(number)d week ago',
                                               '%(number)d weeks ago', n)),
        (60 * 60 * 24, lambda n: ungettext('%(number)d day ago',
                                           '%(number)d days ago', n)),
        (60 * 60, lambda n: ungettext('%(number)d hour ago',
                                      '%(number)d hours ago', n)),
        (60, lambda n: ungettext('%(number)d minute ago',
                                 '%(number)d minutes ago', n)),
        (1, lambda n: ungettext('%(number)d second ago',
                                 '%(number)d seconds ago', n))]
    if not now:
        if d.tzinfo:
            now = datetime.datetime.now(LocalTimezone(d))
        else:
            now = datetime.datetime.now()

    # Ignore microsecond part of 'd' since we removed it from 'now'
    delta = now - (d - datetime.timedelta(0, 0, d.microsecond))
    since = delta.days * 24 * 60 * 60 + delta.seconds
    if since <= 0:
        # d is in the future compared to now, stop processing.
        return u''
    for i, (seconds, name) in enumerate(chunks):
        count = since // seconds
        if count != 0:
            break
    return name(count) % {'number': count}
