import datetime
import json

from django.http import HttpResponse

from parsedatetime import parsedatetime, parsedatetime_consts


def json_r(data_dict, cls=None):
    if not cls:
        cls = HttpResponse
    return cls(json.dumps(data_dict), mimetype='application/json')


def smart_int(string, fallback=0):
    """Convert a string to int, with fallback for invalid strings or types."""
    try:
        return int(float(string))
    except (ValueError, TypeError):
        return fallback


date_constants = parsedatetime_consts.Constants()
date_parser = parsedatetime.Calendar(date_constants)


def strtodatetime(string):
    return datetime.datetime(*date_parser.parse(string)[0][0:6])
