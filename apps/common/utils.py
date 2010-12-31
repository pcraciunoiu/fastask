import json

from django.http import HttpResponse


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
